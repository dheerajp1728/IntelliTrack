# Render Deployment Guide - Separate Services

This guide explains how to deploy IntelliTrack as separate microservices on Render.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Render Cloud                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IntelliTrack Frontend (Static Site)                 │   │
│  │  https://intellitrack-frontend.onrender.com          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IntelliTrack Backend (FastAPI)                      │   │
│  │  https://intellitrack-backend.onrender.com           │   │
│  │  • Database: PostgreSQL                              │   │
│  │  • Calls LLM Service for analysis                    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │ (HTTP API Call)                      │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IntelliTrack LLM (Separate Repository)              │   │
│  │  https://intellitrack-llm.onrender.com               │   │
│  │  • Repository: IntelliTrack_llm                      │   │
│  │  • Independent Deployment                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### Step 1: Deploy IntelliTrack LLM Service (First)

This is a **separate repository** and must be deployed first.

**Repository:** https://github.com/dheerajp1728/IntelliTrack_llm

#### On Render:

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select **IntelliTrack_llm** repository
5. Configure:
   - **Name**: `intellitrack-llm`
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
   - **Plan**: Free
6. Environment Variables:
   - `PYTHONUNBUFFERED`: `1`
   - Other variables auto-configured
7. Click "Create Web Service"

**⏱️ Wait for deployment to complete**

✅ **Copy the deployed URL**: `https://intellitrack-llm.onrender.com`

---

### Step 2: Deploy IntelliTrack Backend

**Repository:** https://github.com/dheerajp1728/IntelliTrack

#### On Render:

1. Click "New" → "Web Service"
2. Select **IntelliTrack** repository
3. Configure:
   - **Name**: `intellitrack-backend`
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/`
   - **Plan**: Free
4. Environment Variables:
   - Render will auto-create PostgreSQL database (intellitrack-db)
   - Add **LLM_SERVICE_URL**: `https://intellitrack-llm.onrender.com` (from Step 1)
   - Other variables auto-generated from render.yaml
5. Click "Create Web Service"

**⏱️ Wait for deployment to complete**

✅ **Copy the deployed URL**: `https://intellitrack-backend.onrender.com`

---

### Step 3: Deploy IntelliTrack Frontend

**Repository:** https://github.com/dheerajp1728/IntelliTrack

#### On Render:

1. Click "New" → "Static Site"
2. Select **IntelliTrack** repository
3. Configure:
   - **Name**: `intellitrack-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Free
4. Environment Variables:
   - `VITE_API_URL`: `https://intellitrack-backend.onrender.com` (from Step 2)
5. Click "Create Static Site"

**⏱️ Wait for deployment to complete**

---

## Verification

### Check All Services Are Running:

```bash
# LLM Service Health
curl https://intellitrack-llm.onrender.com/health

# Backend Health
curl https://intellitrack-backend.onrender.com/

# Frontend (Open in browser)
https://intellitrack-frontend.onrender.com
```

### Test Backend → LLM Communication:

```bash
curl -X GET "https://intellitrack-backend.onrender.com/llm/health"
```

Should return: `{"status": "ok", "llm_service": true}`

### Test LLM Analysis:

```bash
curl -X POST "https://intellitrack-backend.onrender.com/llm/analyze?repo_url=https://github.com/dheerajp1728/IntelliTrack.git&tasks=Setup%20database"
```

---

## Troubleshooting

### LLM Service Returns 503 Error

**Cause**: Backend cannot reach LLM service

**Solution**:
1. Verify LLM service is running: `https://intellitrack-llm.onrender.com/health`
2. Check backend logs for the exact error
3. Verify `LLM_SERVICE_URL` environment variable is set correctly

### Database Connection Error

**Cause**: PostgreSQL not initialized

**Solution**:
1. Check Render dashboard for database status
2. Ensure `DATABASE_URL` environment variable is set
3. Re-run migrations

### Frontend Can't Connect to Backend

**Cause**: CORS or incorrect API URL

**Solution**:
1. Check `VITE_API_URL` environment variable
2. Verify backend CORS settings include frontend domain
3. Check network tab in browser DevTools

---

## Important Notes

⚠️ **Free Tier Limitations**:
- Services spin down after 15 minutes of inactivity
- Database limited to 0.5GB
- Monthly compute limits apply
- Good for testing/development

✅ **For Production**:
- Upgrade to paid plans for continuous uptime
- Use managed database services
- Set up proper monitoring and alerts
- Use custom domains (paid feature)

---

## Repository URLs

| Service | Repository | Render Name |
|---------|-----------|------------|
| Backend | `https://github.com/dheerajp1728/IntelliTrack` | `intellitrack-backend` |
| LLM | `https://github.com/dheerajp1728/IntelliTrack_llm` | `intellitrack-llm` |
| Frontend | `https://github.com/dheerajp1728/IntelliTrack` | `intellitrack-frontend` |

---

## Environment Variables Reference

### Backend (IntelliTrack)
- `DATABASE_URL` - Auto-set from database
- `LLM_SERVICE_URL` - Set to LLM service URL from Step 1
- `SECRET_KEY` - Auto-generated
- `CORS_ORIGINS` - `https://intellitrack-frontend.onrender.com`
- `AI_PROVIDER` - `openai`
- `AI_MODEL` - `gpt-4o-mini`

### LLM Service (IntelliTrack_llm)
- `PYTHONUNBUFFERED` - `1`

### Frontend
- `VITE_API_URL` - `https://intellitrack-backend.onrender.com`

---

## Next Steps

1. Deploy services in order: LLM → Backend → Frontend
2. Verify all services are running
3. Test API endpoints
4. Monitor logs in Render dashboard
5. Set up alerts for production
