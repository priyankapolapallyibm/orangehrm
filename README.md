# PeopleFlow

PeopleFlow is an OrangeHRM-inspired learning application for building a complete
HR platform with automated development, testing, and delivery practices. The
current first release includes:

- A responsive Vue 3 and TypeScript login interface
- A NestJS authentication API
- A local administrator account
- An authenticated dashboard shell
- SQLite persistence with Prisma migrations and seed data
- Employee listing, search, creation, editing, and deletion
- Leave requests with overlap validation and approval or rejection
- Recruitment vacancies and candidate pipeline management
- User account creation, employee linking, roles, and access control
- Navigation placeholders for Time, Performance, Directory, and Claims
- Backend unit and API integration tests
- Frontend component tests

## Prerequisites

- Node.js 20 or later
- npm 10 or later

Docker is not required for this initial release.

## Start locally

Install all workspace dependencies:

```powershell
npm install
npm run db:setup
```

Start the API and web application:

```powershell
npm run dev
```

Open `http://localhost:5173` and sign in with:

```text
Username: Admin
Password: admin123
```

The API health endpoint is available at `http://localhost:3000/api/health`.

## Available APIs

All HR endpoints require a Bearer token. Mutation and administration operations
require the `ADMIN` role.

| Area                | Endpoints                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication      | `POST /api/auth/login`                                                                                                                                                       |
| Employees           | `GET/POST /api/employees`, `GET/PATCH/DELETE /api/employees/:id`                                                                                                             |
| Leave               | `GET/POST /api/leave-requests`, `PATCH /api/leave-requests/:id/status`                                                                                                       |
| Recruitment         | `GET/POST /api/recruitment/vacancies`, `PATCH /api/recruitment/vacancies/:id/status`, `GET/POST /api/recruitment/candidates`, `PATCH /api/recruitment/candidates/:id/status` |
| User administration | `GET/POST /api/users`, `PATCH /api/users/:id`                                                                                                                                |

## Start with containers

Docker or another Compose-compatible container runtime is required:

```powershell
docker compose up --build
```

Open `http://localhost:8080` and use the same local administrator credentials.
The Compose application builds separate web and API images, runs database
migrations and seed data once, waits for API health, and persists SQLite data in
the `peopleflow-data` volume.

Inspect service health and logs:

```powershell
docker compose ps
docker compose logs --follow api web
```

Stop services without deleting employee data:

```powershell
docker compose down
```

Delete the local container database only when a full reset is intended:

```powershell
docker compose down --volumes
```

## Commands

```powershell
npm run dev
npm run build
npm test
npm run test:e2e
npm run db:setup
```

## Configuration

The application has safe local defaults. Copy `.env.example` to `.env` when you
want to override the API port, browser origin, JWT secret, or demo credentials.
A production deployment must provide a JWT secret containing at least 32
characters and explicit administrator credentials with a password of at least
12 characters. The public local credentials are not accepted as implicit
production defaults.

The current local database is SQLite at `apps/api/prisma/dev.db`. It is generated
locally and is not committed. Prisma migrations and seed data are committed so
each developer and CI run can recreate the same database. PostgreSQL will replace
SQLite when the hosted Dev environment is introduced. The interim container
configuration intentionally runs a single API replica with a persistent volume;
it is not the final horizontally scaled Azure database architecture.
