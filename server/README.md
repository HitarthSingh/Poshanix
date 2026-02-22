Quick start for the small Gemini proxy server

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
2. From the `server/` folder run `npm install` then `npm start`.
3. The server listens on port `3001` by default and exposes:
   - `POST /api/gemini/ocr` — accepts JSON `{ text: string }` and returns AI response
   - `POST /api/gemini/chat` — accepts JSON `{ message: string }` or `{ messages: [...] }`

From the frontend, set `VITE_AI_API_BASE` to the server base if needed (defaults to `http://localhost:3001`).
