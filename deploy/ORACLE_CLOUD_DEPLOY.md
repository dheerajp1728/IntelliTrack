# Oracle Cloud Free Tier Deployment

Oracle Cloud Free Tier is a strong fit for this repo when paired with Oracle managed PostgreSQL and one Ubuntu VM for the app containers.

## What This Guide Deploys

- Oracle Autonomous PostgreSQL for the database
- One Ubuntu VM for backend and frontend containers
- Host Nginx as the reverse proxy
- Optional HTTPS with Certbot

This guide matches the current repo behavior:
- backend reads `DATABASE_URL` from env
- frontend needs `VITE_API_URL` at build time
- demo seed data is disabled in production by default

## Free Tier Includes

✅ Always Free compute instance options
✅ Always Free Autonomous PostgreSQL options
✅ Persistent block storage
✅ Good baseline performance for small-team usage

## 1. Create Oracle Resources

### 1.1 Create the database

1. Sign in to Oracle Cloud.
2. Open `Autonomous Database`.
3. Create an `Autonomous Database (PostgreSQL)`.
4. Choose an Always Free option.
5. Save the full PostgreSQL connection string from the database details page.

Use the full connection string Oracle provides. Do not manually rewrite it unless needed.

### 1.2 Create the VM

1. Open `Compute` → `Instances`.
2. Create an Ubuntu 22.04 instance.
3. Choose an Always Free shape.
4. Assign a public IP.
5. Download the SSH key pair.

### 1.3 Open network ports

In your Oracle VCN security list or network security group, allow inbound traffic for:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS

You do not need to expose `5173` or `8000` publicly if Nginx is handling traffic.

## 2. SSH into the VM

```bash
ssh -i path/to/private-key ubuntu@YOUR_PUBLIC_IP
```

## 3. Install Docker, Compose, Git, and Nginx

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git curl nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker
```

Verify:

```bash
docker --version
docker compose version
nginx -v
```

## 4. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git setup
cd setup
```

## 5. Create the Production Environment File

Create `.env.prod` in the repo root.

### 5.1 If you have a domain

```bash
cat > .env.prod <<'EOF'
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
DEBUG=false
SECRET_KEY=replace-this-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SEED_DATA_ON_STARTUP=false
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
VITE_API_URL=https://your-domain.com/api
VITE_APP_URL=https://your-domain.com
EOF
```

### 5.2 If you are using only the public IP for now

```bash
cat > .env.prod <<'EOF'
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
DEBUG=false
SECRET_KEY=replace-this-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SEED_DATA_ON_STARTUP=false
CORS_ORIGINS=http://YOUR_PUBLIC_IP
VITE_API_URL=http://YOUR_PUBLIC_IP/api
VITE_APP_URL=http://YOUR_PUBLIC_IP
EOF
```

Replace `DATABASE_URL` with the exact PostgreSQL connection string from Oracle if one is already provided in full.

## 6. Build and Start the Containers

The frontend reads `VITE_API_URL` during build, so always build with the production env file.

Before starting the app for the first time on PostgreSQL, apply the schema migration.

```bash
docker compose --env-file .env.prod build
docker compose --env-file .env.prod run --rm backend alembic upgrade head
docker compose --env-file .env.prod up -d backend frontend
```

Check status:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## 7. Configure Nginx on the VM

Create an Nginx site config:

```bash
sudo tee /etc/nginx/sites-available/intellitrack > /dev/null <<'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

If you are using only a public IP for now, replace `server_name your-domain.com www.your-domain.com;` with:

```nginx
server_name YOUR_PUBLIC_IP;
```

Enable the site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/intellitrack /etc/nginx/sites-enabled/intellitrack
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Enable HTTPS

If you have a real domain pointed at the VM:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

If you are using only a raw public IP, stay on HTTP until you attach a domain.

## 9. Verify the Deployment

```bash
curl http://127.0.0.1:8000/docs
curl http://127.0.0.1:5173
curl http://YOUR_PUBLIC_IP
```

Expected URLs:

- Frontend: `http://YOUR_PUBLIC_IP` or `https://your-domain.com`
- Backend docs: `http://YOUR_PUBLIC_IP/docs` or `https://your-domain.com/docs`
- API root through proxy: `http://YOUR_PUBLIC_IP/api/`

## 10. Updates and Operations

### Deploy a code update

```bash
git pull
docker compose --env-file .env.prod build
docker compose --env-file .env.prod run --rm backend alembic upgrade head
docker compose --env-file .env.prod up -d backend frontend
sudo systemctl reload nginx
```

### View logs

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
sudo journalctl -u nginx -f
```

### Restart services

```bash
docker compose restart backend frontend
sudo systemctl restart nginx
```

## Notes

- The repo now supports PostgreSQL in cloud deployment through `DATABASE_URL`.
- PostgreSQL deployments should run `alembic upgrade head` before starting updated containers.
- `SEED_DATA_ON_STARTUP=false` prevents demo data from being inserted in production.
- Do not use the repo's Docker Nginx profile for first Oracle setup unless you also provide SSL cert files under `config/ssl`.

[Oracle Cloud Docs](https://docs.oracle.com/en-us/iaas/Content/home.htm)
