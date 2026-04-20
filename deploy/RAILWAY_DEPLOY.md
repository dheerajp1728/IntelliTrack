# Railway.app Deployment Guide

Railway is a modern cloud platform with a **free tier** ($5 credit monthly).

## 1. Sign Up
- Go to https://railway.app
- Click "Connect with GitHub"
- Authorize Railway to access your repos

## 2. Create New Project

### Option A: Deploy from GitHub (Recommended)
```bash
# Push your code to GitHub first
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/intellitrack.git
git push -u origin main
```

Then in Railway Dashboard:
- Click "New Project"
- Select "Deploy from GitHub repo"
- Select your intellitrack repository
- Railway auto-detects Python and Node.js

### Option B: Deploy from Local (Docker)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd setup
railway init

# Link project
railway link

# Deploy
railway up
```

## 3. Configure Services

### Backend Service
```
Service Name: intellitrack-backend
Start Command: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend Service
```
Service Name: intellitrack-frontend
Start Command: npm run build && npm run preview
```

## 4. Add PostgreSQL Database

In Railway Dashboard:
1. Click "+ New Service"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway auto-creates connection URL

## 5. Environment Variables

For Backend:
```
DATABASE_URL=<railway-postgres-url>
DEBUG=false
CORS_ORIGINS=https://your-frontend.railway.app
```

For Frontend:
```
VITE_API_URL=https://your-backend.railway.app/api
```

## 6. Deploy

```bash
# Push to GitHub (automatic deployment)
git push origin main

# Or manually trigger
railway deploy
```

## 7. Get URLs

In Railway Dashboard, each service shows its public URL:
- Backend: `https://intellitrack-backend.railway.app`
- Frontend: `https://intellitrack-frontend.railway.app`

## Cost
- **Free: $5 credit/month** (usually covers small projects)
- After free tier: ~$7/month for compute + $20/month for database

[Railway Docs](https://docs.railway.app)
