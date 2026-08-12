# PeopleFlow

PeopleFlow is an OrangeHRM-inspired learning application for building a complete
HR platform with automated development, testing, and delivery practices. The
current first release includes:

- A responsive Vue 3 and TypeScript login interface
- A NestJS authentication API
- A local administrator account
- An authenticated dashboard shell
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
```

## Configuration

The application has safe local defaults. Copy `.env.example` to `.env` when you
want to override the API port, browser origin, JWT secret, or demo credentials.
A production deployment must provide a JWT secret containing at least 32
characters. Persistent PostgreSQL users will be introduced with the
employee-management foundation.
