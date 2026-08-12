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
SQLite when the hosted Dev environment is introduced.
