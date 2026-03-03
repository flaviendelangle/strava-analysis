# Strava Analysis

A self-hosted web app for analyzing your Strava training data. Syncs activities and streams from Strava, computes training metrics (TSS, HRSS), and provides interactive charts, maps, and explorer tiles.

Built with Next.js, tRPC, Drizzle ORM, and PostgreSQL.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/)
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)
- A [Strava API application](https://www.strava.com/settings/api) (for OAuth credentials)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/flaviendelangle/strava-analysis.git
cd strava-analysis
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d
podman compose -f docker-compose.dev.yml up -d
```

This starts a PostgreSQL 17 instance on `localhost:5432` with user `strava`, password `strava`, database `strava_analysis`.

### 3. Configure environment

Create a `.env.local` file at the project root:

```env
DATABASE_URL=postgresql://strava:strava@localhost:5432/strava_analysis
STRAVA_CLIENT_ID=<your-strava-client-id>
STRAVA_CLIENT_SECRET=<your-strava-client-secret>
NEXTAUTH_SECRET=<any-random-string>
NEXTAUTH_URL=http://localhost:3000
```

To get Strava credentials, create an API application at https://www.strava.com/settings/api with the callback URL set to `http://localhost:3000/api/auth/callback/strava`.

### 4. Push the database schema

```bash
pnpm db:push
```

### 5. Start the dev server

```bash
pnpm dev
```

Open http://localhost:3000 — you'll be redirected to the login page where you can sign in with Strava.

## Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `pnpm dev`         | Start Next.js dev server         |
| `pnpm build`       | Production build                 |
| `pnpm start`       | Start production server          |
| `pnpm db:push`     | Push schema to database (dev)    |
| `pnpm db:generate` | Generate a migration             |
| `pnpm db:migrate`  | Run pending migrations           |
| `pnpm db:studio`   | Open Drizzle Studio (DB browser) |
| `pnpm lint`        | Run ESLint                       |
| `pnpm test-unit`   | Run Vitest                       |
| `pnpm test-e2e`    | Run Playwright                   |

## Production deployment

The project includes Docker files for self-hosted deployment:

```bash
# Build and start all services (PostgreSQL + App + Caddy)
docker compose up -d

# Run migrations
docker compose exec app npx drizzle-kit migrate
```

Set the `DOMAIN` environment variable for Caddy to auto-provision HTTPS.
