# Poshanix — AI Nutrition Scanner

A Vite + React + TypeScript app that scans food labels (OCR), sends OCR text to an AI backend (Google Gemini or OpenAI), and displays structured nutrition data plus concise medical/nutrition observations.

## Key features
- OCR scanning with Tesseract.js (image upload or device camera)
- Server-side AI proxy to keep API keys private
- Strict OCR → AI processing pipeline that returns JSON nutrition data and clinical observations
- Floating chat widget for general nutrition questions
- Food detail page with AI-parsed nutrition facts, ingredients, observations, and health score
- Tailwind CSS and a small component library

## Tech stack
- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS, styled-components, tailwindcss-animate
- OCR: Tesseract.js
- AI proxy: Node.js server in `server/index.js` (for Gemini/OpenAI calls)
- DB / migrations: Supabase migrations present in `supabase/migrations`

## Quickstart

Prerequisites: Node.js (16+ recommended) and npm.

1) Install server dependencies and configure environment variables

```powershell
cd server
npm install
# create server/.env and set GEMINI_API_KEY, GEMINI_API_TYPE, GEMINI_MODEL, PORT etc.
```

2) Start the server proxy (local)

```powershell
# from repository root
cd server
npm start
```

3) Install and start the frontend

```powershell
# from repository root
npm install
npm run dev
```

4) Open the app in your browser (Vite port shown in terminal). Use the Home page to upload or capture a food label image and view parsed results on the Food page.

## Environment variables
Server (.env in `server/`):
- `GEMINI_API_KEY` — API key for Gemini or OpenAI
- `GEMINI_API_TYPE` — set to `google` for Gemini; otherwise uses OpenAI-compatible API
- `GEMINI_MODEL` — e.g. `gemini-2.5-flash`
- `GEMINI_API_ENDPOINT` — optional custom endpoint
- `PORT` — server port (default 3001)

Frontend: You can provide a `.env` file at the project root if using runtime configuration; check the code for any `import.meta.env` usages.

## Server endpoints (local proxy)
- POST `/api/gemini/ocr` — body: `{ text }` (OCR output). Returns parsed JSON nutrition object or a helper status message:

```json
{ "status": "waiting_for_food_ocr", "message": "Scan a food label to get nutrition information." }
```

- POST `/api/gemini/chat` — body: `{ message }` or `{ messages }`. Forwards to the configured AI provider and returns assistant content (plain text or JSON when applicable).

Key server code: [server/index.js](server/index.js)

## Important frontend files
- Home / OCR flow: [src/pages/Home.tsx](src/pages/Home.tsx)
- Food details (AI parsing): [src/pages/Food.tsx](src/pages/Food.tsx)
- Chat widget: [src/components/ChatWidget.tsx](src/components/ChatWidget.tsx)
- Animated icon: [src/components/animate-ui/icons/message-square-more.tsx](src/components/animate-ui/icons/message-square-more.tsx)
- Tailwind configuration: [tailwind.config.cjs](tailwind.config.cjs)

## Supabase migrations
See the `supabase/migrations` folder for SQL migrations used to create and update the `profiles` table and onboarding fields.

## Scripts
Use the scripts defined in `package.json`:

```powershell
npm run dev     # start Vite dev server
npm run build   # build production bundle
npm run preview # preview production build
```

## Developer notes
- The server builds provider-specific payloads (Gemini generateContent vs OpenAI chat) inside `callAI()` in `server/index.js`.
- `SYSTEM_INSTRUCTION` in `server/index.js` enforces strict JSON-only output and concise clinical observations for nutrition parsing.
- `Home.tsx` obtains OCR text and navigates to the Food page; `Food.tsx` performs the AI parse and renders results.

## Contributing
- Open an issue to discuss major changes.
- For small fixes, send a pull request with a clear description and tests where appropriate.

## License & contact
Specify your preferred license here (e.g., MIT). For questions, open an issue or contact the repository owner.

---
Last updated: February 22, 2026
