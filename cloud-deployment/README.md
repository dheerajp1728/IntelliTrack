# Cloud Deployment

This folder is the entry point for cloud deployment in this repository.

## What Stays Outside This Folder

Some deployment files must remain in their original locations:

- `render.yaml` must stay at the repository root for Render Blueprint deploys.
- `Dockerfile.backend`, `Dockerfile.frontend`, and `docker-compose.yml` stay at the repository root because the existing deployment flow depends on those paths.
- Platform-specific scripts remain under `deploy/`.

## Recommended Options

### Fully Free

- Oracle Cloud Free Tier

### Fastest Setup

- Render

## Deployment Guides

- [Render](./RENDER.md)
- [Oracle](./ORACLE.md)
- [Checklist](./CHECKLIST.md)

## Existing Source Files

- Main Render guide: `deploy/RENDER_DEPLOY.md`
- Main Oracle guide: `deploy/ORACLE_CLOUD_DEPLOY.md`
- Render blueprint: `render.yaml`

## Quick Start

### Render

1. Push this repository to GitHub.
2. In Render, create a Blueprint from the repository.
3. Render reads `render.yaml` from the repo root.

### Oracle

1. Create an Oracle PostgreSQL database.
2. Create an Ubuntu VM.
3. Clone the repo, set `.env.prod`, run migrations, and start services.