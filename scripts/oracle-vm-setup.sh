#!/usr/bin/env bash
# Oracle Cloud VM Bootstrap Script
# Run once on a fresh Ubuntu 22.04 / 24.04 OCI Always Free VM as the default user (ubuntu/opc)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/priyankapolapallyibm/orangehrm/main/scripts/oracle-vm-setup.sh | bash
#   OR copy and run manually:
#   bash oracle-vm-setup.sh
#
set -euo pipefail

REPO_URL="https://github.com/priyankapolapallyibm/orangehrm.git"
APP_DIR="/opt/peopleflow"
DEPLOY_USER="${SUDO_USER:-ubuntu}"

echo "============================================"
echo "  PeopleFlow – Oracle Cloud VM Setup"
echo "  Deploy user: $DEPLOY_USER"
echo "============================================"

# ── 1. System update ─────────────────────────────────────────────────────────
echo "==> Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ── 2. Install Docker ─────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "==> Installing Docker..."
  sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$DEPLOY_USER"
  echo "==> Docker installed"
else
  echo "==> Docker already installed: $(docker --version)"
fi

# ── 3. Install Git ─────────────────────────────────────────────────────────────
sudo apt-get install -y -qq git

# ── 4. Clone repo ─────────────────────────────────────────────────────────────
if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Cloning repository to $APP_DIR..."
  sudo git clone "$REPO_URL" "$APP_DIR"
  sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
else
  echo "==> Repo already cloned at $APP_DIR"
  sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
fi

# ── 5. Open OCI firewall ports ─────────────────────────────────────────────────
# Note: You must ALSO open these ports in the OCI Console:
#   Networking > VCN > Security Lists > Ingress Rules
echo "==> Configuring UFW firewall..."
sudo apt-get install -y -qq ufw
sudo ufw allow OpenSSH
sudo ufw allow 8080/tcp   # dev web
sudo ufw allow 8081/tcp   # qa web
sudo ufw --force enable

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Log out and back in (or run: newgrp docker)"
echo ""
echo "2. Create /opt/peopleflow/.env.dev from .env.dev.example"
echo "   Fill in: JWT_SECRET, DEMO_ADMIN_USERNAME, DEMO_ADMIN_PASSWORD"
echo ""
echo "3. Deploy dev environment:"
echo "   cd $APP_DIR && bash scripts/deploy-linux.sh dev"
echo ""
echo "4. Deploy qa environment:"
echo "   cd $APP_DIR && bash scripts/deploy-linux.sh qa"
echo ""
echo "5. Add GitHub secrets (see docs/deployment-oracle.md)"
echo ""
echo "App will be at:"
echo "  Dev: http://<VM-PUBLIC-IP>:8080"
echo "  QA:  http://<VM-PUBLIC-IP>:8081"
