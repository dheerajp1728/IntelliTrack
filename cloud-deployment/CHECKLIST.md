# Cloud Deployment Checklist

## Before Deploying

- Confirm code is pushed to GitHub.
- Confirm `DATABASE_URL` is set for PostgreSQL in production.
- Confirm `AUTO_CREATE_TABLES=false` in production.
- Confirm `SEED_DATA_ON_STARTUP=false` in production.
- Confirm frontend API URL is correct.

## Render Checklist

- `render.yaml` exists at the repository root.
- GitHub repository is accessible from Render.
- Backend URL and frontend URL are updated if Render changes service names.

## Oracle Checklist

- Oracle PostgreSQL connection string is ready.
- VM ports are open.
- Nginx is configured.
- `alembic upgrade head` ran successfully.

## Demo Checklist

- Open frontend before the presentation.
- Open backend docs before the presentation.
- Verify login works.
- Verify one main project flow works end-to-end.