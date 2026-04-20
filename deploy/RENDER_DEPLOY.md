# Render Deployment Guide

Render is the easiest way to get this project online quickly, but the free web service sleeps when idle. For an academic demo it works, but Oracle remains the safer primary choice if you want always-on behavior.

This guide matches the current repo behavior:
- backend uses `DATABASE_URL`
- PostgreSQL schema is applied with Alembic
- frontend needs `VITE_API_URL` during build

## 1. Sign Up

1. Go to https://render.com
2. Sign in with GitHub
3. Make sure your repository is pushed to GitHub

## 2. Create the PostgreSQL Database

In Render Dashboard:

1. Click `New +`
2. Select `PostgreSQL`
3. Name it `intellitrack-db`
4. Choose a region close to you
5. Create the database
6. Copy the `External Database URL`

## 3. Deploy the Backend Web Service

In Render Dashboard:

1. Click `New +`
2. Select `Web Service`
3. Connect your GitHub repo
4. Configure it like this:

- Name: `intellitrack-backend`
- Root Directory: leave blank
- Environment: `Python`
- Build Command: `pip install -r requirements.txt`
- Start Command: `alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Backend Environment Variables

Add these in Render:

```env
DATABASE_URL=<Render external database URL>
DEBUG=false
SECRET_KEY=replace-this-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AUTO_CREATE_TABLES=false
SEED_DATA_ON_STARTUP=false
CORS_ORIGINS=https://intellitrack-frontend.onrender.com
PYTHONUNBUFFERED=1
AI_PROVIDER=openai
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=<your-hosted-llm-api-key>
```

Replace `https://intellitrack-frontend.onrender.com` with your real frontend URL after Render assigns it.

For local Ollama instead, use:

```env
AI_PROVIDER=ollama
OLLAMA_BASE=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## 4. Deploy the Frontend Static Site

In Render Dashboard:

1. Click `New +`
2. Select `Static Site`
3. Connect the same GitHub repo
4. Configure it like this:

- Name: `intellitrack-frontend`
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

### Frontend Build Environment Variable

Add this environment variable to the static site:

```env
VITE_API_URL=https://intellitrack-backend.onrender.com
```

Replace the URL with the actual backend Render URL once created.

## 5. Fix the Backend CORS Origin

After the frontend is created, go back to the backend service and update:

```env
CORS_ORIGINS=https://YOUR_FRONTEND_NAME.onrender.com
```

Then redeploy the backend.

## 6. Deploy Order

Use this order:

1. Create PostgreSQL database
2. Create backend web service
3. Create frontend static site
4. Update backend `CORS_ORIGINS`
5. Redeploy backend

## 7. Verify URLs

After deployment, the usual URLs are:

- Backend: `https://intellitrack-backend.onrender.com`
- API docs: `https://intellitrack-backend.onrender.com/docs`
- Frontend: `https://intellitrack-frontend.onrender.com`

## 8. Updating After Code Changes

Push code to GitHub:

```bash
git push origin main
```

Render will redeploy automatically.

Because the backend start command already runs `alembic upgrade head`, schema migrations are applied on each deploy before the API starts.

## 9. Important Limitation

Render free web services sleep after inactivity. That means your first request before a demo can be slow. If you use Render for the presentation, open the frontend and backend docs a few minutes before presenting.

## 10. AI Analysis On Render

The backend now supports both hosted OpenAI-compatible providers and local Ollama.

Why:

- local defaults like `http://localhost:11434` only work on the same machine as the backend process
- a Render web service cannot talk to Ollama running on your laptop
- Render free web services are also a poor place to run Ollama itself because model downloads are large, memory is limited, and there is no GPU

To make AI live in cloud, use one of these setups:

1. Recommended on Render: set `AI_PROVIDER=openai`, `AI_API_BASE`, `AI_MODEL`, and `AI_API_KEY` for a hosted OpenAI-compatible provider.
2. Run Ollama on a separate VM and set backend env vars `AI_PROVIDER=ollama`, `OLLAMA_BASE`, and `OLLAMA_MODEL`.
3. Keep the main app on Render, but host the AI service separately on infrastructure designed for model inference.

If you do nothing, the rest of the app works, but the AI page will stay offline.

## 11. Recommended Render Setup for This Repo

- Backend: Render Web Service
- Frontend: Render Static Site
- Database: Render PostgreSQL

[Render Docs](https://render.com/docs)
