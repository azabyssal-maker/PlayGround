# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/azabyssal-maker/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/azabyssal-maker/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/azabyssal-maker/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/azabyssal-maker/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/azabyssal-maker/PlayGround).
- 🛠️ [Check build runs](https://github.com/azabyssal-maker/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/azabyssal-maker/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/azabyssal-maker).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## Run locally

This project uses a small Node.js server for both the website and the private Gemini API proxy. Node.js 20 or newer is required; no npm packages need to be installed.

```bash
./start.sh
```

Open the address printed by the server (usually `http://localhost:3000`). To enable AI chat and Google Search grounding, create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey) and set it on the server before starting:

```bash
AI_API_KEY="your-key" ./start.sh
```

You can alternatively use `GEMINI_API_KEY`. The default model is `gemini-2.5-flash`; override it with `GEMINI_MODEL` if needed. The key stays on the server and is not sent to the browser. Without a key, the site still loads, but AI chat and search are unavailable. API availability, free quotas, model access, and Google Search grounding limits depend on Google's current account and region policies. Mori's spoken replies use your browser's built-in speech synthesis and do not require an API key.
