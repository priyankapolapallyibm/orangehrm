# VM deployment for dev and QA

## Environments

- **dev**: Docker Compose stack using `.env.dev` and `compose.dev.yaml`
- **qa**: Docker Compose stack using `.env.qa` and `compose.qa.yaml`

Both environments share the base `compose.yaml` and override only what differs:
- project name
- port binding
- persistent volume name
- seeded admin credentials
- public origin

## VM prerequisites

1. Install Docker Engine with Compose support.
2. Install GitHub Actions self-hosted runner on the VM.
3. Configure DNS / reverse proxy for the environment URLs.
4. Open inbound ports only through the reverse proxy.

## Required GitHub environment configuration

Create two GitHub environments:

### dev
- Secret: `DEV_JWT_SECRET`
- Secret: `DEV_ADMIN_USERNAME`
- Secret: `DEV_ADMIN_PASSWORD`
- Variable: `DEV_WEB_ORIGIN`
- Variable: `DEV_WEB_PORT`

### qa
- Secret: `QA_JWT_SECRET`
- Secret: `QA_ADMIN_USERNAME`
- Secret: `QA_ADMIN_PASSWORD`
- Variable: `QA_WEB_ORIGIN`
- Variable: `QA_WEB_PORT`

## First-time setup on the VM

1. Copy `.env.dev.example` to `.env.dev` and fill values.
2. Copy `.env.qa.example` to `.env.qa` and fill values.
3. Run:
   `pwsh -File .\scripts\deploy-vm.ps1 -EnvironmentName dev`
4. Run:
   `pwsh -File .\scripts\deploy-vm.ps1 -EnvironmentName qa`

## Deployment behavior

- **Dev** deploys automatically from `main`
- **QA** deploys manually through the `Deploy QA` workflow

## Suggested URLs

- Dev: `https://dev.peopleflow.example.com`
- QA: `https://qa.peopleflow.example.com`
