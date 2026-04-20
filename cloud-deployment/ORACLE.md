# Oracle Cloud Deployment

Use Oracle Cloud when you want a fully free deployment with better live-demo stability.

## Files Used

- Detailed guide: `deploy/ORACLE_CLOUD_DEPLOY.md`
- Production env template: `.env.prod`

## Steps

1. Create an Oracle Always Free PostgreSQL database.
2. Create an Oracle Ubuntu VM.
3. Clone this repository to the VM.
4. Fill in `.env.prod` with your Oracle PostgreSQL connection string.
5. Run:

```bash
docker compose --env-file .env.prod build
docker compose --env-file .env.prod run --rm backend alembic upgrade head
docker compose --env-file .env.prod up -d backend frontend
```

6. Put Nginx in front of the containers.

## Notes

- Oracle is the better option for a free academic demo because it does not sleep like Render free.
- PostgreSQL is the correct production database for this repo.