const $ = (selector) => document.querySelector(selector);
const messages = $('#messages');
const form = $('#chatForm');
const input = $('#messageInput');
const toast = $('#toast');
let toastTimer;
let replyTone = '温柔';
let chatHistory = [];

const greetings = ['我在听呢～慢慢说，不着急。','嗯嗯，我懂你的意思。我们可以一起把这件事理一理。','听起来很值得认真聊聊。你愿意再多告诉我一点吗？','收到！我陪你一起想办法 ✨'];
const moods = [
  {emoji:'🌱',title:'元气满满',text:'想和你一起探索新鲜事'},
  {emoji:'☁️',title:'慵懒放空',text:'适合慢下来，喝杯喜欢的饮料'},
  {emoji:'✨',title:'灵感闪闪',text:'脑袋里好像有好多新点子'},
  {emoji:'🌷',title:'温柔平静',text:'今天也要对自己好一点呀'},
  {emoji:'🐣',title:'好奇宝宝',text:'想知道你今天发现了什么'}
];
const replyGroups = [
  {match:/周末|放松|出去|旅行|去哪/, replies:['周末就该留一点时间给自己呀 🌿\n\n我给你安排个轻松版：\n· 上午睡到自然醒，去喜欢的咖啡店吃早午餐\n· 下午找一条绿荫多的路线散散步，顺便拍几张喜欢的照片\n· 晚上挑一部轻松的电影，或者约朋友吃顿饭\n\n不用把行程排太满，留白也是计划的一部分。你更喜欢户外还是宅家？','听起来需要一点松弛感～可以试试「半日微旅行」：选个没去过的街区，找家小店坐坐，再沿着河边慢慢走。不用赶时间，跟着好奇心走就好。你想往自然里走走，还是去城市里逛逛？']},
  {match:/累|疲惫|压力|焦虑|难过|烦|不开心/, replies:['先给你一个云朵抱抱 ☁️🫂\n\n听起来你今天真的已经很努力了。现在不用急着解决所有事情，可以先喝口水、松松肩膀，给自己两分钟什么也不做。\n\n如果你愿意，可以跟我说说最让你累的是什么；不想说也没关系，我可以陪你安静一会儿。','辛苦啦，小满。那些感觉都是真的，也值得被好好对待。要不我们先把事情分成「现在必须做」和「可以晚点再说」两堆？或者你只想让我听你说，我也在。']},
  {match:/灵感|创意|写|想法|惊喜/, replies:['来，送你一个小小的灵感种子 🎁\n\n「如果今天的风有颜色，它会是什么颜色？它一路上悄悄带走了什么，又给谁留下了什么？」\n\n可以把它写成三句话的小故事，也可以只是想一想。你脑海里出现了什么画面？','今天的小惊喜：给未来的自己写一张便签，内容只有一句——「记得，________」。把第一个想到的词填进去就好。你会写什么呢？✨']},
  {match:/晚餐|吃什么|午餐|早餐|吃饭/, replies:['让我想想～如果想吃得舒服又不费劲：番茄鸡蛋面，加一把青菜，十几分钟就能搞定 🍅🍜\n\n想清淡一点的话可以做菌菇豆腐汤；想犒劳自己，就点一份最喜欢的。今天你想吃热乎的还是清爽的？','今天来点暖胃的吧：照烧鸡肉饭、蔬菜汤，或者一碗热腾腾的馄饨都不错～如果你告诉我冰箱里有什么，我还能帮你搭配一下！']},
  {match:/计划|安排|待办|任务|工作|学习/, replies:['当然可以，我们把事情变轻一点 ✍️\n\n先试试这个小方法：\n1. 写下今天最重要的一件事\n2. 再挑两件 15 分钟内能完成的小事\n3. 做完一件，就给自己一个小小的庆祝\n\n不用一次完成全部。你今天最想先搞定哪件事？','我们来做个不累的计划吧！先选一个最重要的目标，再把它拆成一个 10 分钟就能开始的小步骤。告诉我你要做什么，我陪你拆解～']},
  {match:/谢谢|感谢/, replies:['嘿嘿，不用客气～能帮上你我就很开心啦 ☺️','你这么说我也心里暖暖的。随时来找我，我一直都在～']},
  {match:/你好|嗨|早上好|晚上好|在吗/, replies:['嗨，小满！见到你真好～今天有什么新鲜事想和我分享吗？☀️','我在呀～今天过得怎么样？想聊聊天、找灵感，还是一起安排一下今天？']}
];

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}
function escapeHTML(text) {
  return text.replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function timeNow() {
  return new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
}
function appendMessage(text, who) {
  const row = document.createElement('div');
  row.className = `message-row ${who === 'user' ? 'user-row' : 'assistant-row'}`;
  const safe = escapeHTML(text).replace(/\n/g,'<br>');
  row.innerHTML = `${who === 'assistant' ? '<span class="message-avatar">m</span>' : ''}<div class="message-content"><span class="message-author">${who === 'assistant' ? 'Mori' : '小满'} <time>${timeNow()}</time></span><div class="bubble">${safe}</div>${who === 'assistant' ? '<div class="message-reactions"><button class="reaction" aria-label="喜欢">♡</button><button class="reaction" aria-label="复制">▢</button></div>' : ''}</div>${who === 'user' ? '<span class="message-avatar">林</span>' : ''}`;
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return row;
}
function buildReply(text) {
  const match = replyGroups.find((group) => group.match.test(text));
  if (match) return match.replies[Math.floor(Math.random() * match.replies.length)];
  if (/\?$|吗[？?]?$|什么|怎么|如何|为什么/.test(text)) return `这个问题问得好～我会先从你现在的感受和实际情况出发来想。${greetings[Math.floor(Math.random()*greetings.length)]}\n\n你最在意的是哪一部分？多一点背景的话，我可以给你更贴近的建议。`;
  return `${greetings[Math.floor(Math.random()*greetings.length)]}\n\n关于「${text.slice(0,30)}${text.length>30?'…':''}」，我们可以慢慢聊。你希望我先帮你分析一下，还是先听你多分享一点？`;
}
function sendMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  appendMessage(clean,'user');
  chatHistory.push({role:'user',text:clean});
  input.value = '';
  input.style.height = '31px';
  const typing = document.createElement('div');
  typing.className = 'message-row assistant-row';
  typing.innerHTML = '<span class="message-avatar">m</span><div class="message-content"><span class="message-author">Mori <time>正在思考</time></span><div class="bubble typing-bubble"><i></i><i></i><i></i></div></div>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  setTimeout(() => {
    typing.remove();
    let reply = buildReply(clean);
    if (replyTone === '简洁') reply = reply.split('\n\n').slice(0,2).join('\n\n');
    if (replyTone === '活泼') reply += '\n\n走吧～我们一起把它变有趣！✌️';
    appendMessage(reply,'assistant');
    chatHistory.push({role:'assistant',text:reply});
  }, 650 + Math.random()*450);
}
form.addEventListener('submit',(event) => { event.preventDefault(); sendMessage(input.value); });
input.addEventListener('keydown',(event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
});
input.addEventListener('input',() => { input.style.height = '31px'; input.style.height = `${Math.min(input.scrollHeight,96)}px`; });
document.querySelectorAll('.suggestion').forEach((button) => button.addEventListener('click',() => sendMessage(button.dataset.prompt)));
messages.addEventListener('click',(event) => {
  const button = event.target.closest('.reaction');
  if (!button) return;
  if (button.getAttribute('aria-label') === '喜欢') {
    button.classList.toggle('liked');
    button.textContent = button.classList.contains('liked') ? '♥' : '♡';
  } else {
    const bubble = button.closest('.message-content').querySelector('.bubble');
    navigator.clipboard?.writeText(bubble.innerText).then(() => showToast('已复制 Mori 的回复')).catch(() => showToast('选中消息即可复制'));
  }
});

const moodRefresh = $('#moodRefresh');
moodRefresh.addEventListener('click',() => {
  const choices = moods.filter((mood) => mood.title !== $('#moodTitle').textContent);
  const mood = choices[Math.floor(Math.random()*choices.length)];
  $('#moodEmoji').textContent = mood.emoji;
  $('#moodTitle').textContent = mood.title;
  $('#moodText').textContent = mood.text;
  showToast(`Mori 今天是「${mood.title}」`);
});
function petMori() {
  const character = $('#character');
  character.animate([{transform:'scale(1) rotate(0)'},{transform:'scale(1.05) rotate(-5deg)'},{transform:'scale(1) rotate(0)'}],{duration:480,easing:'ease-out'});
  showToast('Mori 开心地蹭了蹭你的手 ✨');
}
$('#character').addEventListener('click',petMori);
$('#character').addEventListener('keydown',(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); petMori(); } });
$('#newChat').addEventListener('click',() => {
  messages.innerHTML = '<div class="chat-date"><span></span><time>新的开始</time><span></span></div><div class="message-row assistant-row"><span class="message-avatar">m</span><div class="message-content"><span class="message-author">Mori <time>'+timeNow()+'</time></span><div class="bubble">新的一页开始啦～你今天最想聊些什么？🌷</div><div class="message-reactions"><button class="reaction" aria-label="喜欢">♡</button><button class="reaction" aria-label="复制">▢</button></div></div></div>';
  document.querySelectorAll('.recent').forEach((item) => item.classList.remove('active'));
  showToast('已开启新的对话');
});
$('#toneBtn').addEventListener('click',() => {
  const tones = ['温柔','活泼','简洁'];
  replyTone = tones[(tones.indexOf(replyTone)+1)%tones.length];
  $('#toneBtn').innerHTML = `☼ <span>${replyTone}</span><span class="chevron">⌄</span>`;
  showToast(`回复风格已切换为「${replyTone}」`);
});
$('#voiceBtn').addEventListener('click',() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast('当前浏览器暂不支持语音输入'); return; }
  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.onstart = () => showToast('正在听，请开始说话…');
  recognition.onresult = (event) => { input.value += event.results[0][0].transcript; input.dispatchEvent(new Event('input')); input.focus(); };
  recognition.onerror = () => showToast('没有听清，再试一次吧');
  recognition.start();
});
$('#attachBtn').addEventListener('click',() => showToast('图片和文件分享功能即将到来'));
$('#upgradeBtn').addEventListener('click',() => showToast('Mori Plus 正在准备中，敬请期待 ✨'));
$('#settingsBtn').addEventListener('click',() => showToast('设置面板即将上线'));
$('#chatMenu').addEventListener('click',() => showToast('你的对话仅保存在当前页面中'));
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click',() => {
  document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.remove('active'));
  item.classList.add('active');
  if (item.dataset.view !== 'chat') showToast(`${item.innerText.trim()}功能即将上线，先来和 Mori 聊聊吧`);
}));
document.querySelectorAll('.recent').forEach((item) => item.addEventListener('click',() => {
  document.querySelectorAll('.recent').forEach((recent) => recent.classList.remove('active'));
  item.classList.add('active');
  showToast(`已打开「${item.textContent.trim()}」`);
}));
$('#todayLabel').textContent = new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric'}).format(new Date());
