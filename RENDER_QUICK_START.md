# Quick Render Deployment Checklist

## 🚀 Deployment Order

### 1️⃣ Deploy IntelliTrack LLM (Separate Repository)
- **Repository**: `https://github.com/dheerajp1728/IntelliTrack_llm.git`
- **Name on Render**: `intellitrack-llm`
- **Get URL**: Copy deployed URL (e.g., `https://intellitrack-llm.onrender.com`)

### 2️⃣ Deploy IntelliTrack Backend
- **Repository**: `https://github.com/dheerajp1728/IntelliTrack.git`
- **Name on Render**: `intellitrack-backend`
- **Add Environment Variable**:
  - Key: `LLM_SERVICE_URL`
  - Value: `https://intellitrack-llm.onrender.com` (from step 1)

### 3️⃣ Deploy IntelliTrack Frontend
- **Repository**: `https://github.com/dheerajp1728/IntelliTrack.git` (frontend folder)
- **Name on Render**: `intellitrack-frontend`
- **Add Environment Variable**:
  - Key: `VITE_API_URL`
  - Value: `https://intellitrack-backend.onrender.com` (from step 2)

---

## 📋 Render Configuration Summary

| Service | Type | Runtime | Build | Start |
|---------|------|---------|-------|-------|
| **Backend** | Web | Python 3.11 | `pip install -r requirements.txt` | `alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **LLM** | Web | Python 3.11 | `pip install -r requirements.txt` | `python -m uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Frontend** | Static | - | `cd frontend && npm install && npm run build` | - |

---

## ✅ Verification Commands

```bash
# 1. Check LLM is running
curl https://intellitrack-llm.onrender.com/health

# 2. Check Backend is running
curl https://intellitrack-backend.onrender.com/

# 3. Check Backend → LLM connection
curl https://intellitrack-backend.onrender.com/llm/health

# 4. Access Frontend
https://intellitrack-frontend.onrender.com
```

---

## 🔑 Environment Variables

### Backend needs:
- `LLM_SERVICE_URL` = https://intellitrack-llm.onrender.com

### Frontend needs:
- `VITE_API_URL` = https://intellitrack-backend.onrender.com

---

## 📚 Full Documentation

See: [RENDER_SEPARATE_DEPLOYMENT.md](./RENDER_SEPARATE_DEPLOYMENT.md)

---

## ⚠️ Important

- **Deploy in order**: LLM → Backend → Frontend
- **Copy URLs**: After each deployment, copy the URL for the next service
- **Environment variables**: Set them in Render dashboard AFTER deployment
- **Wait for completion**: Each service takes 5-10 minutes to deploy
