# CBD frontend and Python backend

The Docker stack runs this React/Vite frontend with the FastAPI backend at
`D:\web apps\Python\CBD_Python`, PostgreSQL, and Redis. The previous Node/MongoDB
configuration has been replaced.

## Start on Windows

Install Docker Desktop and enable Linux containers. Run these commands from
`D:\web apps\React\CBD project` in PowerShell:

```powershell
npm.cmd run docker:init
npm.cmd run docker:dev
```

Open **http://localhost:5173**. Backend docs are at **http://localhost:8000/docs**.
Both applications reload when their source changes. Polling is enabled for
Windows bind mounts. Restart/rebuild after changing dependencies.

`docker:init` creates an ignored `.env.docker` with random database and JWT
secrets and leaves an existing file intact. It does not change either project's
existing `.env`. Adjust `BACKEND_PATH`, `BACKEND_PORT`, or `FRONTEND_PORT` there
if needed. Paths are relative to this Compose file; use forward slashes for
Windows absolute paths, for example `D:/web apps/Python/CBD_Python`.
Keep `POSTGRES_PASSWORD` URL-safe (the generated hexadecimal value already is).

## Production containers

Stop development before switching modes; both modes share the Docker database.

```powershell
npm.cmd run docker:down
npm.cmd run docker:prod
```

Open **http://localhost** (or the `FRONTEND_PORT` configured in `.env.docker`).
Nginx serves the frontend, handles SPA routes, and forwards `/api/`, `/health`,
and `/socket.io/` to FastAPI on port 8000. Socket upgrades and uploads up to
50 MB are supported. The backend, PostgreSQL, and Redis are internal services
in production; only the frontend port is published.

API URLs and socket settings are baked into the frontend at build time. Docker
builds use the same origin (`/`), so the browser never needs a container hostname
or a hardcoded localhost API address. Rebuild to change frontend build arguments.
Development uses the same routing through Vite's proxy.

Services wait for PostgreSQL/Redis health checks and then backend readiness.
The backend retains the application's existing `AUTO_CREATE_TABLES=true` startup
behavior, creating the current model tables on a fresh database. This does not
migrate existing schemas; review and apply Alembic migrations separately for
schema changes. Docker creates a **new database**; it does not import your
existing local PostgreSQL data.

## Checks, logs, and stopping

```powershell
# Validate configuration without building (does not print secrets)
docker compose --env-file .env.docker --profile dev config --quiet
docker compose --env-file .env.docker --profile prod config --quiet

# Backend syntax/import smoke check, then frontend build check in containers
npm.cmd run docker:test

# Status and logs
docker compose --env-file .env.docker --profile prod ps
npm.cmd run docker:logs

# Stop all profiles, preserving stored data
npm.cmd run docker:down
```

The test profile performs syntax/import and build checks, not database integration
tests. Each check runs separately so a successful backend exit cannot interrupt
the frontend check or hide a failure.

PostgreSQL and Redis data persist in named Docker volumes. `docker:down` preserves
them. Do not use `down -v` unless you intend to delete that Docker data. Changing
the database password in `.env.docker` does not change a password already stored
in an initialized PostgreSQL volume.

## Run without Docker

Frontend: `npm.cmd ci`, copy `.env.example` to `.env` if needed, and run
`npm.cmd run dev`. The default backend URL is `http://localhost:8000`.

Backend: in `D:\web apps\Python\CBD_Python`, create/activate a Python 3.13
environment, run `pip install -r requirements.txt`, configure `.env` for your
PostgreSQL/Redis instances, and run
`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`.

## GitHub Actions

`.github/workflows/frontend-ci.yml` runs on pull requests and pushes to main/master,
and supports manual runs and reuse by CD. It installs locked dependencies, runs
`test:ci` (currently a production build, not a unit-test suite), validates Compose,
builds and executes the Docker test image, and builds the production image.

`.github/workflows/frontend-cd.yml` runs the same CI checks before publishing to
`ghcr.io/<lowercase-owner>/cbdp-frontend`, tagged with the commit SHA and latest.
Publishing and deployment runs are serialized within each repository. A server
lock prevents the frontend and backend workflows from updating the shared stack
at the same time. Only main/master can publish production images. SSH deployment uses the image's
immutable digest and waits for the frontend container to become healthy.

For optional SSH deployment, configure these repository secrets together:

- `DEPLOY_HOST`: server hostname or IP address.
- `DEPLOY_USER`: SSH user with Docker access.
- `DEPLOY_SSH_KEY`: SSH private key.
- `DEPLOY_PATH`: absolute server directory containing `docker-compose.yml` and
  a configured `.env.docker`.

Without any deployment secrets, CD publishes the image and skips SSH deployment.
Partial configuration fails with an explanatory error. The server needs the Linux `flock` command and Docker
Compose v2 with `up --wait` support and the production backend stack already
running under the same Compose project. Provision that stack and its database
separately before enabling frontend deployment. The frontend workflow does not
build or deploy the separate Python repository.

Deployment supplies a temporary Compose image override, so the existing local
Docker build setup stays usable. It updates only `frontend-prod`; it does not
start or rebuild backend services. Registry credentials are passed through
standard input and stored only in a temporary directory for the deploy command.
A failed health check marks deployment failed; automatic rollback is not configured.

Workflow references: [GitHub secret conditions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
and [Docker Compose health checks](https://docs.docker.com/reference/cli/docker/compose/up/).


References: [Compose health-based startup](https://docs.docker.com/compose/how-tos/startup-order/)
and [Vite build-time environment variables](https://vite.dev/guide/env-and-mode).

## Backend CI/CD and repository paths

Local frontend: `D:\web apps\React\CBD project` (GitHub: `Surendra146/CRD-F`).
Local backend: `D:\web apps\Python\CBD_Python` (GitHub: `Surendra146/CRD-B`).

The local Compose default `BACKEND_PATH=../../Python/CBD_Python` resolves to that
backend directory. GitHub-hosted runners check out each repository into their
own workspace; these Windows paths must not be placed in GitHub workflows.
Frontend CI validates Compose syntax but does not build the sibling backend.

The backend repository uses `.github/workflows/backend-ci.yml` and
`.github/workflows/backend-cd.yml`. Backend CI checks Python 3.13 imports and
syntax, starts the application against a disposable PostgreSQL service, checks
`/health`, runs the Docker test target, and builds the production target. These
are build/startup checks; there is no automated endpoint test suite configured.
Backend CD calls that CI workflow and publishes `ghcr.io/surendra146/cbdp-backend`.

Set the four `DEPLOY_*` secrets in each repository to enable its deployment.
In both repositories, `DEPLOY_PATH` points to the same server directory that
contains the frontend's `docker-compose.yml` and configured `.env.docker`.
Provision the production stack there first. Backend CD requires PostgreSQL and
Redis to be running, updates only `backend-prod`, waits for health, and reloads
Nginx in a running `frontend-prod` container to resolve the new backend address.

Each repository triggers its own workflows when its code changes. Commit and
push the backend workflow files in CRD-B and the frontend workflow files in CRD-F.
No cross-repository checkout token is required for these independent pipelines.
