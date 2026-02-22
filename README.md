# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # Poshanix — AI Nutrition Scanner

    This repository is a Vite + React + TypeScript app that scans food labels, runs OCR, and sends OCR text to an AI backend (Gemini/OpenAI) to produce structured nutrition data and concise medical/nutrition observations.

    **Main features**
    - OCR scanning with Tesseract.js (image upload or device camera)
    - Local AI proxy (server) that forwards requests to Google Generative Language (Gemini) or OpenAI, keeping API keys server-side
    - Strict OCR→AI processing mode for nutrition: the server instructs the model to return JSON-only nutrition data and clinical observations
    - Floating Chat-with-AI widget on the Home page for general nutrition questions
    - Food detail page that displays AI-parsed nutrition facts, ingredients, observations, and a health score
    - Tailwind CSS support and UI components

    **Key files**
    - Server proxy: [server/index.js](server/index.js)
    - Frontend OCR & scan UI: [src/pages/Home.tsx](src/pages/Home.tsx)
    - Food detail page (AI output): [src/pages/Food.tsx](src/pages/Food.tsx)
    - Chat widget: [src/components/ChatWidget.tsx](src/components/ChatWidget.tsx)
    - Animate icon (chat): [src/components/animate-ui/icons/message-square-more.tsx](src/components/animate-ui/icons/message-square-more.tsx)
    - Tailwind config: [tailwind.config.cjs](tailwind.config.cjs)

    **Server endpoints (local proxy)**
    - POST `/api/gemini/ocr` — accepts { text } (OCR output). Returns parsed JSON (nutrition object) or a plain text assistant message. If input is not a food label, returns:

    ```json
    { "status": "waiting_for_food_ocr", "message": "Scan a food label to get nutrition information." }
    ```

    - POST `/api/gemini/chat` — accepts { message } or { messages } and forwards to the AI provider; returns assistant content (plain text or JSON when applicable).

    Server environment variables (server/.env):
    - `GEMINI_API_KEY` — API key for Gemini (or OpenAI key if using OpenAI endpoint)
    - `GEMINI_API_TYPE` — `google` to use Google Generative Language, otherwise OpenAI-compatible
    - `GEMINI_MODEL` — model name (e.g., `gemini-2.5-flash`)
    - `GEMINI_API_ENDPOINT` — optional custom endpoint URL
    - `PORT` — server port (default 3001)

    Usage / development
    1. Copy your project `.env` into `server/.env` and set the appropriate API key and model.
    2. Install server deps and start the proxy:

    ```powershell
    cd server
    npm install
    npm start
    ```

    3. Install frontend deps and run Vite dev server:

    ```powershell
    npm install
    npm run dev
    ```

    4. Open the app (default Vite port shown in terminal), navigate to Home, click "Scan Food" and upload or capture an image. The app will immediately navigate to the Food detail page and show AI analysis.

    Developer notes
    - The server builds provider-specific payloads (Gemini generateContent vs OpenAI chat) inside `callAI()` in `server/index.js`.
    - `SYSTEM_INSTRUCTION` in `server/index.js` enforces strict JSON-only output and concise clinical observations.
    - Frontend `Home.tsx` now navigates to `/food` as soon as OCR text is obtained; `Food.tsx` performs the AI parse (so the UI moves immediately to results view).
    - Chat widget dynamically loads the animated `MessageSquareMore` icon when present and falls back to an inline SVG.

    If you'd like, I can:
    - Run a local smoke test against the proxy endpoint.
    - Add automated tests for the server parsing behavior.
    - Tweak the SYSTEM_INSTRUCTION or the `Food` page layout and health-score calculation.

    ---
    Updated: February 22, 2026
