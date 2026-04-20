# Fly.io Deployment Guide

Fly.io offers a **generous free tier** with always-on servers (no cold starts).

## 1. Sign Up
- Go to https://fly.io
- Click "Get Started"
- Sign up with GitHub or email

## 2. Install Fly CLI

### Windows
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

## 3. Login to Fly
```bash
fly auth login
```

## 4. Create PostgreSQL Database

```bash
# Create database cluster
fly postgres create --name intellitrack-db

# This gives you connection string
```

## 5. Deploy Backend

### Create Dockerfile (Already done!)
You have `Dockerfile.backend` ready.

### Initialize Fly App
```bash
cd setup
fly launch

# After prompts:
# - App Name: intellitrack-backend
# - Region: Choose closest or "sjc" (San Jose)
# - PostgreSQL: Select the one you created (intellitrack-db)
# - Redis: Skip (optional)
```

### Set Secrets
```bash
fly secrets set --app intellitrack-backend DEBUG=false
fly secrets set --app intellitrack-backend SECRET_KEY="your-secret-key-here"
fly secrets set --app intellitrack-backend CORS_ORIGINS="https://intellitrack-frontend.fly.dev"

# Database URL is auto-set by Fly when you link PostgreSQL
```

### Deploy
```bash
fly deploy --app intellitrack-backend
```

## 6. Deploy Frontend

### Create fly.toml (Frontend)

Create file: `frontend/fly.toml`
```toml
app = "intellitrack-frontend"
primary_region = "sjc"

[[services]]
  protocol = "tcp"
  internal_port = 5173
  
  [services.http_checks]
    enabled = true
    grace_period = "5s"
    interval = "30s"
    timeout = "5s"
    path = "/"

[env]
VITE_API_URL = "https://intellitrack-backend.fly.dev"

[build]
  builder = "heroku"
```

### Create Procfile (Frontend)

Create file: `frontend/Procfile`
```
web: npm run preview -- --host 0.0.0.0 --port 5173
```

### Deploy Frontend
```bash
cd frontend
fly launch --name intellitrack-frontend

fly deploy --app intellitrack-frontend
```

### Set Environment Variables
```bash
fly secrets set --app intellitrack-frontend VITE_API_URL="https://intellitrack-backend.fly.dev/api"
```

## 7. Check Deployment

```bash
# View logs
fly logs --app intellitrack-backend
fly logs --app intellitrack-frontend

# Get status
fly status --app intellitrack-backend

# Open in browser
fly open --app intellitrack-backend
fly open --app intellitrack-frontend
```

## 8. Get URLs

```bash
# Get app URLs
fly info --app intellitrack-backend
fly info --app intellitrack-frontend
```

URLs will be:
- **Backend**: `https://intellitrack-backend.fly.dev`
- **Frontend**: `https://intellitrack-frontend.fly.dev`

## Cost
- **FREE Tier Includes**:
  - 3 Shared-CPU-1x 256MB VMs
  - Database machines: 3GB storage, PostgreSQL included
  - 160GB outbound data/month
  - No cold starts
  - Always-on servers

- **After Free**: ~$2/month per additional VM

## Monitor

```bash
# Real-time dashboard
fly dashboard

# SSH into app
fly ssh console --app intellitrack-backend

# Scale replicas
fly scale count --app intellitrack-backend 2
```

## Update & Deploy

```bash
# Make changes locally
git add .
git commit -m "Update"

# Deploy
fly deploy --app intellitrack-backend
fly deploy --app intellitrack-frontend
```

[Fly.io Docs](https://fly.io/docs)
