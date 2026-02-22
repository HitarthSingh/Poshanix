Deploying the server (quick guide)

1. Local dev (verify):

```bash
cd server
npm install
npm start
```

2. Using Docker (recommended for single-service deploy):

```bash
cd server
# build
docker build -t poshanix-server .
# run with your .env file
docker run --env-file .env -p 3001:3001 poshanix-server
```

3. Deploy to a cloud host:
- Render (recommended - repo deploy):
	1. Go to https://dashboard.render.com and create a new Web Service.
	2. Connect your GitHub/GitLab repo and set the "Root Directory" to `server`.
	3. Choose **Node** (or Docker if you prefer). If you choose Node, Render will run the build/start commands you provide.
	4. Use these commands (when using Node environment):
		 - Build command: `npm install`
		 - Start command: `npm start` (or `node index.js`). You can also rely on the included `Procfile` (`web: node index.js`).
	5. Add the following environment variables in the Render dashboard: `GEMINI_API_KEY`, `GEMINI_API_TYPE`, `GEMINI_MODEL`, `GEMINI_API_ENDPOINT` (if used), and any other secrets your server needs.
	6. Configure the Health Check path to `/api/gemini/ocr` (HTTP) so Render can verify the service is healthy.

	- Render (Docker): If you prefer a container, choose the Docker option in Render and it will build using `server/Dockerfile`. Ensure your image exposes port `3001` and your code listens on `process.env.PORT`.

	- Railway: create a Web Service, point it at the `server` folder or set the start command to `node index.js`. Add env vars in the Railway dashboard.

	- Cloud Run / ECS: push the Docker image to a registry and deploy from the image.

4. After deployment:
- Add the deployed server URL to your frontend `VITE_AI_API_BASE`.
- Update OAuth / Supabase redirect URIs to point at your deployed frontend origin and (if used) any redirect helper endpoints.

If your Render service is reachable at `https://poshanix.onrender.com`:
- Set your frontend `VITE_AI_API_BASE` (at build time or in your frontend host) to `https://poshanix.onrender.com` so the app will call the correct AI proxy.
- On Render, ensure the service is reachable (Render will expose the service on the assigned public domain). The server already listens on `process.env.PORT || 3001`, which Render sets automatically.
- CORS: the server currently uses permissive CORS (`cors()`), so the frontend origin will be allowed. If you prefer to restrict origins, configure CORS in `server/index.js` to only allow `https://poshanix.onrender.com`.

Example: set the frontend env or build-time var when building the frontend (Vite) so the production build contains the correct API base:

```bash
# from repo root (before running `npm run build` for frontend)
export VITE_AI_API_BASE=https://poshanix.onrender.com
npm run build
```

On Windows (PowerShell):

```powershell
$env:VITE_AI_API_BASE = 'https://poshanix.onrender.com'
npm run build
```

If you want, I can add a GitHub Actions workflow to build and push the Docker image automatically—tell me which container registry (Docker Hub / GHCR / GCP) you'd like.