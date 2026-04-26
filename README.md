# CBD Project (Frontend + Backend + Docker + CI/CD)

This repository is configured to run the full stack with Docker in three modes:

- `dev`: hot-reload frontend + backend + MongoDB
- `test`: containerized CI-style test/build checks
- `prod`: production containers for frontend, backend, and MongoDB

Backend path expected by compose:
`D:\web apps\node\CBDP_node`

## Prerequisites

- Node.js 22+
- Docker Desktop (with Compose)

## Local setup

1. Frontend env:
   - Copy `.env.example` to `.env` in this folder.
2. Backend env:
   - Copy `D:\web apps\node\CBDP_node\.env.example` to `.env`.
   - Fill required secrets.

## Run with Docker

From this frontend directory (`D:\web apps\React\CBD project`):

- Dev stack:
  - `npm run docker:dev`
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:5001`
- Test stack:
  - `npm run docker:test`
- Production stack:
  - `npm run docker:prod`
  - Frontend served from Nginx on `http://localhost`

Stop everything:
- `docker compose down`

## Run without Docker

- Frontend:
  - `npm ci`
  - `npm run dev`
- Backend:
  - `cd D:\web apps\node\CBDP_node`
  - `npm ci`
  - `npm run dev`

## CI/CD pipelines

Frontend workflows:
- `.github/workflows/frontend-ci.yml`
- `.github/workflows/frontend-cd.yml`

Backend workflows (in backend folder):
- `.github/workflows/backend-ci.yml`
- `.github/workflows/backend-cd.yml`

CD deploy jobs are enabled only when these GitHub secrets exist:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`

Images are pushed to GHCR:

- `ghcr.io/<owner>/cbdp-frontend`
- `ghcr.io/<owner>/cbdp-backend`
