# Render Deployment

Use Render when you want the quickest deployment path.

## Files Used

- Blueprint: `render.yaml`
- Detailed guide: `deploy/RENDER_DEPLOY.md`

## Steps

1. Push the repository to GitHub.
2. Sign in to Render.
3. Choose `New +` -> `Blueprint`.
4. Select this repository.
5. Render will create the database, backend, and frontend from `render.yaml`.

## Notes

- The backend runs `alembic upgrade head` on startup.
- The frontend reads `VITE_API_URL` during build.
- Free Render services sleep when idle.

## Expected Services

- `intellitrack-db`
- `intellitrack-backend`
- `intellitrack-frontend`