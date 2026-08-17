# Oracle Cloud Always Free – Dev & QA Hosting

This guide walks you through hosting PeopleFlow on a **free Oracle Cloud VM**.

---

## Architecture

```
Internet
    │
    ▼
Oracle Cloud VM (Public IP)
    ├── port 8080 → Dev stack  (Docker Compose — peopleflow-dev)
    └── port 8081 → QA stack   (Docker Compose — peopleflow-qa)
```

Each stack is:
```
web container (nginx:8080) → api container (NestJS:3000) → SQLite on volume
```

---

## Step 1 — Create Oracle Cloud account

1. Go to → https://www.oracle.com/cloud/free/
2. Sign up with your email (requires credit card for identity verification — **not charged**)
3. Choose **Home Region** — pick the closest to you (cannot be changed later)

---

## Step 2 — Create the free VM

1. In OCI Console → **Compute → Instances → Create Instance**
2. Settings:
   | Field | Value |
   |---|---|
   | Name | `peopleflow-vm` |
   | Image | **Ubuntu 22.04** |
   | Shape | **VM.Standard.A1.Flex** (Always Free ARM) |
   | OCPUs | 1 (up to 4 free) |
   | Memory | 6 GB (up to 24 GB free) |
   | Boot volume | 50 GB (up to 200 GB free) |
3. **SSH keys** — download the private key — you'll need it for GitHub secrets
4. Click **Create**
5. Wait ~2 minutes for the VM to reach **Running** state
6. Note the **Public IP address**

---

## Step 3 — Open firewall ports in OCI Console

1. Go to **Networking → Virtual Cloud Networks → your VCN**
2. Click **Security Lists → Default Security List**
3. Click **Add Ingress Rules**, add two rules:

   | Source CIDR | Protocol | Port |
   |---|---|---|
   | 0.0.0.0/0 | TCP | 8080 |
   | 0.0.0.0/0 | TCP | 8081 |

4. Save

---

## Step 4 — Bootstrap the VM

SSH into your VM:
```bash
ssh -i <path-to-private-key> ubuntu@<VM-PUBLIC-IP>
```

Run the setup script (installs Docker, clones repo, opens ports):
```bash
curl -fsSL https://raw.githubusercontent.com/priyankapolapallyibm/orangehrm/main/scripts/oracle-vm-setup.sh | bash
```

Or manually:
```bash
bash /opt/peopleflow/scripts/oracle-vm-setup.sh
```

Log out and back in after setup (so Docker group takes effect).

---

## Step 5 — Create environment files on the VM

```bash
cd /opt/peopleflow

# Dev environment
cp .env.dev.example .env.dev
nano .env.dev
# Fill in:
#   JWT_SECRET=<random 32+ char string>
#   DEMO_ADMIN_USERNAME=admin.dev
#   DEMO_ADMIN_PASSWORD=<your dev password>
#   DEV_WEB_PORT=8080
#   WEB_ORIGIN=http://<VM-PUBLIC-IP>:8080

# QA environment
cp .env.qa.example .env.qa
nano .env.qa
# Fill in:
#   JWT_SECRET=<different random 32+ char string>
#   DEMO_ADMIN_USERNAME=admin.qa
#   DEMO_ADMIN_PASSWORD=<your qa password>
#   QA_WEB_PORT=8081
#   WEB_ORIGIN=http://<VM-PUBLIC-IP>:8081
```

Generate a strong JWT secret:
```bash
openssl rand -base64 48
```

---

## Step 6 — Deploy manually (first time)

```bash
cd /opt/peopleflow

# Deploy dev
bash scripts/deploy-linux.sh dev

# Deploy qa
bash scripts/deploy-linux.sh qa
```

Check both are running:
```bash
docker ps
```

Test in your browser:
- Dev → `http://<VM-PUBLIC-IP>:8080`
- QA  → `http://<VM-PUBLIC-IP>:8081`

---

## Step 7 — Set up GitHub secrets for automated deployment

In your GitHub repo → **Settings → Environments**, create two environments:

### `dev` environment secrets

| Secret name | Value |
|---|---|
| `DEV_VM_HOST` | Your VM public IP |
| `DEV_VM_USER` | `ubuntu` |
| `DEV_VM_SSH_KEY` | Contents of the VM private key file |
| `DEV_JWT_SECRET` | Same JWT secret you put in `.env.dev` |
| `DEV_ADMIN_USERNAME` | Your dev admin username |
| `DEV_ADMIN_PASSWORD` | Your dev admin password |

### `qa` environment secrets

| Secret name | Value |
|---|---|
| `QA_VM_HOST` | Your VM public IP (same VM, different port) |
| `QA_VM_USER` | `ubuntu` |
| `QA_VM_SSH_KEY` | Same private key |
| `QA_JWT_SECRET` | QA JWT secret |
| `QA_ADMIN_USERNAME` | Your qa admin username |
| `QA_ADMIN_PASSWORD` | Your qa admin password |

---

## Step 8 — Trigger automated deployment

**Dev** deploys automatically when you push to `main`.

**QA** deploys on demand:
- Go to GitHub → **Actions → Deploy QA → Run workflow**

---

## Deployment flow

```
push to main
     │
     ▼
CI pipeline (validate + build + docker image scan)
     │ (on success)
     ▼
Deploy Dev workflow (SSH into VM → git pull → docker compose up)
     │
     ▼
Health check http://<VM>:8080/health

Manual trigger
     │
     ▼
Deploy QA workflow (SSH into VM → git pull → docker compose up)
     │
     ▼
Health check http://<VM>:8081/health
```

---

## Useful commands on the VM

```bash
# View running containers
docker ps

# View logs
docker compose --env-file .env.dev -f compose.yaml -f compose.dev.yaml logs -f

# Restart a service
docker compose --env-file .env.dev -f compose.yaml -f compose.dev.yaml restart api

# Stop everything
docker compose --env-file .env.dev -f compose.yaml -f compose.dev.yaml down
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Port not accessible | Check OCI Console Security List ingress rules |
| `docker: permission denied` | Log out and back in after setup script |
| Container won't start | Run `docker compose logs migrate` to see migration errors |
| Health check fails | App may still be starting — wait 30s and retry |
