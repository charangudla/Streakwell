# Hostinger KVM 4 VPS - Vital30 Production Deployment Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy and secure the **Vital30 MVP** on a **Hostinger KVM 4 VPS** running **Ubuntu** (22.04 or 24.04 LTS).

---

## 🛠️ Server Topology & Security Overview

Our architecture isolates database layers and exposes only static and reverse-proxy ports to the internet:

- **Reverse Proxy**: Nginx container handling SSL termination and reverse proxy upstreams on ports `80` and `443`.
- **API Server**: NestJS API + Better Auth, container exposes internal port `3000` only on the private Docker network.
- **Public Website**: Next.js standalone server (apps/web), internal port `3000` only.
- **Admin App**: React SPA (apps/admin) compiled as static assets, served on port `80` internally.
- **Databases**: PostgreSQL (`5432`) and Redis (`6379`) do **not** map any public ports and are completely isolated.

Four subdomains are served by the same VPS:
- `vital30.com` + `www.vital30.com` → Next.js public site
- `api.vital30.com` → NestJS API (with `/api/auth/*` owned by Better Auth)
- `admin.vital30.com` → React admin SPA

---

## 🛡️ 1. VPS Host Hardening & Security Setup

Before deploying the application, perform these host-level security configurations:

### A. Establish SSH Key Authentication
Avoid using root password login, which is susceptible to brute-force attacks.

1. On your **local machine**, generate a secure RSA 4096 SSH key pair:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/vital30_kvm4_key
   ```
2. Copy the public key to your Hostinger VPS (replace `<IP>` with your host IP):
   ```bash
   ssh-copy-id -i ~/.ssh/vital30_kvm4_key.pub root@<IP>
   ```
3. Test logging in without a password:
   ```bash
   ssh -i ~/.ssh/vital30_kvm4_key root@<IP>
   ```

### B. Disable Password & Root Logins
1. Open the SSH daemon configuration file:
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
2. Modify or add the following properties to disable password logins and prevent direct root access:
   ```text
   PasswordAuthentication no
   ChallengeResponseAuthentication no
   PubkeyAuthentication yes
   PermitRootLogin prohibit-password
   ```
3. Save and close, then restart the SSH daemon:
   ```bash
   sudo systemctl restart sshd
   ```

### C. Configure UFW Host Firewall
Hostinger VPS servers run on Ubuntu and use `ufw` as the default firewall. Protect the system by blocking all unneeded ports:

1. Block all incoming connections by default:
   ```bash
   sudo ufw default deny incoming
   ```
2. Allow all outgoing connections by default:
   ```bash
   sudo ufw default allow outgoing
   ```
3. Open essential ports for SSH, HTTP, and HTTPS:
   ```bash
   sudo ufw allow 22/tcp comment 'SSH Secure Port'
   sudo ufw allow 80/tcp comment 'Nginx HTTP Port'
   sudo ufw allow 443/tcp comment 'Nginx HTTPS SSL Port'
   ```
4. Enable the firewall:
   ```bash
   sudo ufw enable
   ```
5. Verify status:
   ```bash
   sudo ufw status verbose
   ```

---

## 📦 2. Install Docker & Prerequisites

Install Docker Engine and Docker Compose on the host Ubuntu system:

```bash
# 1. Update package registry
sudo apt update && sudo apt upgrade -y

# 2. Install certificates and curl tools
sudo apt install -y ca-certificates curl gnupg lsb-release

# 3. Add official Docker repository keys
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Configure apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine, CLI, and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Verify installation
docker --version
docker compose version
```

---

## 💾 3. Clone Repository & Setup Environment

1. Create a dedicated directory under `/opt` and clone the codebase:
   ```bash
   sudo mkdir -p /opt/vital30
   sudo chown -R $USER:$USER /opt/vital30
   git clone https://github.com/your-username/vital30.git /opt/vital30
   cd /opt/vital30
   ```

2. Initialize the production environment variables:
   ```bash
   cp .env.prod.example .env
   nano .env
   ```

   > [!IMPORTANT]
   > Replace **every** `<REPLACE_ME_*>` placeholder. The deploy script
   > refuses to run while any remain.
   >
   > - **`BETTER_AUTH_SECRET`** — `openssl rand -base64 32`. Must be ≥ 32 chars.
   > - **`POSTGRES_PASSWORD`** — `openssl rand -base64 24`. Update **both**
   >   `POSTGRES_PASSWORD` and the password embedded in `DATABASE_URL`.
   > - **`RESEND_API_KEY`** — get from https://resend.com/api-keys.
   >   Verify your sending domain (`vital30.com`) in the Resend dashboard
   >   before sending production email.
   > - **`BETTER_AUTH_URL`** — leave as `https://api.vital30.com` once DNS
   >   + SSL are live. Password-reset email links use this.
   > - **`CORS_ORIGIN`** — must include every public origin (web, www, admin).
   > - **`NEXT_PUBLIC_*`** + **`VITE_API_BASE_URL`** — baked into the web
   >   and admin builds; changing later requires a rebuild.

---

## 🌐 4. DNS Configuration

Point your domains to your Hostinger VPS public IP. Add **four** A records in your domain registrar's DNS settings panel:

| Type | Hostname | Destination IP | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (root)  | `<YOUR_VPS_PUBLIC_IP>` | `3600` |
| **A** | `www`       | `<YOUR_VPS_PUBLIC_IP>` | `3600` |
| **A** | `api`       | `<YOUR_VPS_PUBLIC_IP>` | `3600` |
| **A** | `admin`     | `<YOUR_VPS_PUBLIC_IP>` | `3600` |

Wait for DNS to propagate (often a few minutes; up to 1 hour). Verify with:
```bash
dig +short vital30.com
dig +short www.vital30.com
dig +short api.vital30.com
dig +short admin.vital30.com
```
All four should return your VPS IP before continuing to SSL.

---

## 🚀 5. Deploy Stack & Run Prisma Migrations

Make the automated deployment script executable and run it:

```bash
chmod +x ./scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

### What the deployment script does:
1. Validates Docker and Compose installations.
2. Checks that a production `.env` exists, has no `<REPLACE_ME_*>` placeholders, and that `BETTER_AUTH_SECRET` is ≥ 32 chars.
3. Builds production container images (`postgres`, `redis`, `api`, `admin`, `web`, `nginx`).
4. Starts the stack in detached mode.
5. Runs `npx prisma migrate deploy` inside the API container.
6. Seeds the database with the starter categories + challenges.

---

## 🔒 6. SSL Certificate Configuration (Let's Encrypt)

Once DNS has propagated, obtain a secure, free SSL certificate using Let's Encrypt and Certbot on the host:

1. Install Certbot on the host system:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. Stop the local Nginx container temporarily so Certbot can bind to port 80 to verify domain ownership:
   ```bash
   docker compose -f docker-compose.prod.yml stop nginx
   ```

3. Obtain certificates for **all four** hostnames in one shot (single cert covers everything):
   ```bash
   sudo certbot certonly --standalone \
     -d vital30.com -d www.vital30.com \
     -d api.vital30.com -d admin.vital30.com
   ```
   *Certificates will be saved under `/etc/letsencrypt/live/vital30.com/` (the cert path uses the first `-d` value as the lineage name).*

4. Add cert auto-renewal cron (Certbot installs a systemd timer on Ubuntu by default; verify with `systemctl list-timers | grep certbot`).

5. Mount the cert directory into the Nginx container by adding to the `nginx` service in `docker-compose.prod.yml`:
   ```yaml
   nginx:
     volumes:
       - /etc/letsencrypt:/etc/letsencrypt:ro
       # ... existing mounts
   ```
   Then update each server block in `deploy/nginx/prod.conf` to listen on `443 ssl http2` and reference the cert paths (see SSL example below).

4. Mount the host certificates into the Nginx container by editing Nginx reverse proxy configurations, or update `nginx` service in `docker-compose.prod.yml` to mount SSL folders. Let's document how to redirect and configure HTTPS within Nginx.

### HTTPS Redirection Nginx Configuration
Update `/opt/vital30/deploy/nginx/prod.conf` to handle SSL:

```text
server {
    listen 80;
    server_name api.vital30.com admin.vital30.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.vital30.com;

    ssl_certificate /etc/letsencrypt/live/api.vital30.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.vital30.com/privkey.pem;

    location / {
        proxy_pass http://vital30_api;
        # ... standard proxy headers
    }
}
```

---

## 🩺 7. Maintenance & Operations Command References

### Checking System Health
```bash
# Verify container statuses and healthcheck results
docker compose -f docker-compose.prod.yml ps

# Audit logs
docker compose -f docker-compose.prod.yml logs --tail=100 -f
```

### Restarting Services
```bash
# Restart the entire stack
docker compose -f docker-compose.prod.yml restart

# Restart a specific container
docker compose -f docker-compose.prod.yml restart api
```

---

## 💾 8. Database Backup & Restoration Protocols

### Automated Backups
Make the backup script executable:
```bash
chmod +x ./scripts/backup-postgres.sh
```

To run backups automatically every night at 2:00 AM, configure a cron job:
```bash
sudo crontab -e
```
Add the following line to the crontab:
```text
0 2 * * * /opt/vital30/scripts/backup-postgres.sh >> /var/log/vital30-backup.log 2>&1
```

---

### Step-by-Step Restoration Drills

> [!CAUTION]
> Restoring a database drops and recreates the target database. This action results in permanent data loss for existing records. Always make a copy of the active state before running a restore.

1. **Locate and decompress the backup file**:
   ```bash
   gunzip ./backups/vital30_prod_db_backup_2026-05-25_020000.sql.gz
   ```

2. **Terminate active client database connections**:
   ```bash
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U vital30_prod_admin -d postgres -c \
     "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'vital30_prod_db' AND pid <> pg_backend_pid();"
   ```

3. **Drop and recreate database**:
   ```bash
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U vital30_prod_admin -d postgres -c "DROP DATABASE \"vital30_prod_db\";"
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U vital30_prod_admin -d postgres -c "CREATE DATABASE \"vital30_prod_db\";"
   ```

4. **Restore the database**:
   ```bash
   docker compose -f docker-compose.prod.yml exec -T postgres psql -U vital30_prod_admin -d vital30_prod_db < ./backups/vital30_prod_db_backup_2026-05-25_020000.sql
   ```
