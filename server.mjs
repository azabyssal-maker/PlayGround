import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.env.STATIC_DIR || path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendJson(response, status, value) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64 * 1024) throw Object.assign(new Error('请求内容太大'), { status: 413 });
  }
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error('请求格式无效'), { status: 400 }); }
}

async function chat(request, response) {
  if (!API_KEY) return sendJson(response, 503, { error: 'AI 服务未配置。请在服务端设置 AI_API_KEY。' });
  let payload;
  try { payload = await readJson(request); }
  catch (error) { return sendJson(response, error.status || 400, { error: error.message }); }

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-20) : [];
  const contents = messages
    .filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.text === 'string')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.text.slice(0, 6000) }],
    }));
  if (!contents.length || contents.at(-1).role !== 'user') {
    return sendJson(response, 400, { error: '请先输入一条消息。' });
  }

  const tones = { 温柔: '温柔、耐心，像亲近的朋友一样交流', 活泼: '轻松、活泼，适度使用表情符号', 简洁: '表达简洁清楚，避免冗长' };
  const tone = tones[payload.tone] || tones.温柔;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(API_KEY)}`;
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 45000);
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: abort.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `你是 Mori，一个友善、真诚的中文 AI 伙伴。请自然地回应用户、认真回答问题并结合对话上下文，不要捏造事实；不确定时坦诚说明。当前回复风格：${tone}。用户询问新近事实、新闻、地点、价格或需要查证的信息时，使用 Google 搜索工具查找最新资料，并在回答末尾简要提示关键信息的来源。` }] },
        contents,
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Gemini API error:', upstream.status, data.error?.message || 'Unknown error');
      const message = upstream.status === 429
        ? 'AI 免费额度暂时用完或请求太频繁，请稍后再试。'
        : upstream.status === 400 || upstream.status === 403
          ? 'AI 服务配置或权限有误，请检查 API 密钥、模型权限和 Google 搜索功能。'
          : 'AI 服务暂时不可用，请稍后再试。';
      return sendJson(response, upstream.status === 429 ? 429 : 502, { error: message });
    }

    const candidate = data.candidates?.[0];
    const reply = candidate?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!reply) return sendJson(response, 502, { error: 'AI 暂时没有生成回复，请重试。' });
    const seen = new Set();
    const sources = (candidate.groundingMetadata?.groundingChunks || [])
      .map((chunk) => chunk.web)
      .filter((web) => web?.uri && /^https:\/\//i.test(web.uri) && !seen.has(web.uri) && seen.add(web.uri))
      .slice(0, 5)
      .map((web) => ({ title: String(web.title || '').slice(0, 160), uri: web.uri }));
    return sendJson(response, 200, { reply, sources });
  } catch (error) {
    console.error('AI request failed:', error.name === 'AbortError' ? 'timeout' : error.message);
    return sendJson(response, 502, { error: error.name === 'AbortError' ? 'AI 响应超时，请重试。' : '连接 AI 服务失败，请检查网络后重试。' });
  } finally {
    clearTimeout(timeout);
  }
}

async function serveStatic(request, response) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Bad request'); return; }
  if (pathname === '/') pathname = '/index.html';
  if (pathname.split('/').filter(Boolean).some((part) => part.startsWith('.'))) {
    response.writeHead(404).end('Not found');
    return;
  }
  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  const extension = path.extname(filePath).toLowerCase();
  if (!MIME_TYPES[extension]) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    const content = await readFile(filePath);
    response.writeHead(200, {
      'content-type': MIME_TYPES[extension],
      'content-length': content.length,
      'x-content-type-options': 'nosniff',
      'cache-control': ['.html', '.js'].includes(extension) ? 'no-cache' : 'public, max-age=3600',
    });
    response.end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (request.method === 'GET' && url.pathname === '/api/status') {
    return sendJson(response, 200, { configured: Boolean(API_KEY), model: MODEL });
  }
  if (request.method === 'POST' && url.pathname === '/api/chat') return chat(request, response);
  if (url.pathname.startsWith('/api/')) return sendJson(response, 404, { error: 'API 路径不存在。' });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  if (request.method === 'HEAD') {
    response.writeHead(200).end();
    return;
  }
  await serveStatic(request, response);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Mori is ready at http://localhost:${PORT}`);
  console.log(API_KEY ? `AI enabled (${MODEL}; Google Search grounding enabled)` : 'AI disabled: set AI_API_KEY to enable chat and search');
});
