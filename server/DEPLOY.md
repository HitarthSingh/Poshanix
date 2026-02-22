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
- Render / Railway: create a new Web Service and point to the repo root `server` (or set the start command to `node index.js`). Add environment variables in the dashboard.
- Cloud Run / ECS: push the Docker image to a registry and deploy from the image.

4. After deployment:
- Add the deployed server URL to your frontend `VITE_AI_API_BASE`.
- Update OAuth / Supabase redirect URIs to point at your deployed frontend origin and (if used) any redirect helper endpoints.

If you want, I can add a GitHub Actions workflow to build and push the Docker image automatically—tell me which container registry (Docker Hub / GHCR / GCP) you'd like.