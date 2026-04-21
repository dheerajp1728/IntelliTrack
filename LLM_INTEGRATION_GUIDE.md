# IntelliTrack + LLM Integration Guide

This guide explains how to deploy both the IntelliTrack application and the LLM service on Render.

## Architecture Overview

The system consists of two separate services:

1. **IntelliTrack Backend** - Main project management application
2. **IntelliTrack LLM** - Separate microservice for AI-powered progress analysis

This microservice architecture allows:
- Independent scaling
- Separate deployment and updates
- Reusability of the LLM service for other applications

## Deployment Steps on Render

### Step 1: Create Two GitHub Repositories

You already have:
- `IntelliTrack` - Main application
- `IntelliTrack_llm` - LLM service

Both should be accessible at:
- https://github.com/dheerajp1728/IntelliTrack
- https://github.com/dheerajp1728/IntelliTrack_llm

### Step 2: Create a Render Account

1. Go to https://render.com
2. Sign up with your GitHub account

### Step 3: Deploy IntelliTrack

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Search for and select `IntelliTrack` repository
5. Use default settings with these configurations:
   - **Name**: `intellitrack`
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free tier (recommended for testing)

6. Add Environment Variables:
   - Render will auto-generate from render.yaml
   - Or manually set each variable from [render.yaml](../render.yaml)

### Step 4: Deploy LLM Service

1. In Render Dashboard, click "New" → "Web Service"
2. Select `IntelliTrack_llm` repository  
3. Configure:
   - **Name**: `intellitrack-llm`
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
   - **Plan**: Free tier

### Step 5: Link Services

After both services are deployed:

1. Copy the LLM service URL from Render (e.g., `https://intellitrack-llm.onrender.com`)
2. Go to IntelliTrack Backend settings
3. Add environment variable:
   - **Key**: `LLM_SERVICE_URL`
   - **Value**: `https://intellitrack-llm.onrender.com`
4. Redeploy IntelliTrack Backend

## Local Testing

### Prerequisites

- Python 3.8+
- LM Studio installed and running
- Qdrant Docker container running
- PostgreSQL database

### Setup

1. **Clone repositories**:
   ```bash
   git clone https://github.com/dheerajp1728/IntelliTrack.git
   git clone https://github.com/dheerajp1728/IntelliTrack_llm.git
   ```

2. **Setup IntelliTrack Backend**:
   ```bash
   cd IntelliTrack
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Configure .env file
   cp .env.example .env.local
   # Edit .env.local with your database URL
   
   # Run migrations
   alembic upgrade head
   
   # Start backend (port 8000)
   uvicorn app.main:app --reload
   ```

3. **Setup IntelliTrack LLM Service**:
   ```bash
   cd IntelliTrack_llm
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Start LLM service (port 8001)
   uvicorn main:app --reload --port 8001
   ```

4. **Start LM Studio** (for local LLM inference):
   - Open LM Studio application
   - Load a model (e.g., `llama-2-7b-chat`)
   - Click "Start Server" (will run on `127.0.0.1:1234`)

5. **Start Qdrant** (vector database):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

6. **Test LLM Endpoint**:
   ```bash
   curl -X POST "http://localhost:8001/progress" \
     -H "Content-Type: application/json" \
     -d '{
       "repo_url": "https://github.com/dheerajp1728/IntelliTrack.git",
       "tasks": "Setup database; Create user authentication; Build API endpoints"
     }'
   ```

7. **Frontend** (separate):
   ```bash
   cd IntelliTrack/frontend
   npm install
   npm run dev
   ```

## Available Endpoints

### IntelliTrack Backend

- `GET /` - Health check
- `GET /llm/health` - Check LLM service status
- `POST /llm/analyze` - Analyze project progress
  - Parameters: `repo_url`, `tasks`, `github_token` (optional)

### IntelliTrack LLM Service

- `GET /` - Service info
- `GET /health` - Health check
- `POST /progress` - Analyze repository and tasks

## Environment Variables

### IntelliTrack Backend
- `LLM_SERVICE_URL` - URL of the LLM service
- `DATABASE_URL` - PostgreSQL database URL
- `CORS_ORIGINS` - Allowed CORS origins

### IntelliTrack LLM Service
- `LM_STUDIO_URL` - LM Studio server URL (default: `http://localhost:1234`)
- `QDRANT_URL` - Qdrant database URL (default: `http://localhost:6333`)
- `GITHUB_TOKEN` - Optional GitHub API token

## Troubleshooting

### LLM Service Not Reachable

1. Verify both services are deployed on Render
2. Check the LLM service URL is correct in backend environment variables
3. Check the health endpoint: `https://intellitrack-llm.onrender.com/health`

### Database Connection Issues

1. Ensure PostgreSQL database is created on Render
2. Verify `DATABASE_URL` environment variable format
3. Check database credentials in render.yaml

### LLM Analysis Timeout

- LLM analysis can take 30-60 seconds
- Request timeout is set to 5 minutes (300 seconds)
- Increase timeout if using more complex models

## Next Steps

1. Deploy on Render using the configurations above
2. Test LLM endpoints with sample repositories
3. Integrate with IntelliTrack dashboard for UI
4. Monitor performance and scale as needed

## Support

For issues or questions:
1. Check Render logs in the service dashboard
2. Review environment variables configuration
3. Test local setup to isolate issues
4. Check GitHub issues in respective repositories
