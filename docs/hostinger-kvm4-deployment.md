# Hostinger KVM 4 VPS - Vital30 Production Deployment Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy and secure the **Vital30 MVP** on a **Hostinger KVM 4 VPS** running **Ubuntu** (22.04 or 24.04 LTS).

---

## 🛠️ Server Topology & Security Overview

Our architecture isolates database layers and exposes only static and reverse-proxy ports to the internet:

- **Reverse Proxy**: Nginx container handling SSL termination and reverse proxy upstreams on ports `80` and `443`.
- **API Server**: NestJS API container exposing internal port `3000` solely inside the private Docker network.
- **Admin App**: React SPA container compiled as static assets, served on port `80` inside the private Docker network.
- **Databases**: PostgreSQL (`5432`) and Redis (`6379`) do **not** map any public ports and are completely isolated.

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
   > Configure secure environment variables:
   > - Generate a secure 256-bit `JWT_SECRET` by running: `openssl rand -base64 32`
   > - Set a strong, unique `POSTGRES_PASSWORD` (minimum 24 characters).
   > - Update `DATABASE_URL` to match the custom password:
   >   `DATABASE_URL=postgresql://vital30_prod_admin:<your_password>@postgres:5432/vital30_prod_db?schema=public`

---

## 🌐 4. DNS Configuration

Point your domains to your Hostinger VPS public IP. Add two **A Records** in your domain registrar's DNS settings panel:

| Type | Hostname | Destination IP | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `api` | `<YOUR_VPS_PUBLIC_IP>` | `3600` |
| **A** | `admin` | `<YOUR_VPS_PUBLIC_IP>` | `3600` |

---

## 🚀 5. Deploy Stack & Run Prisma Migrations

Make the automated deployment script executable and run it:

```bash
chmod +x ./scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

### What the deployment script does:
1. Validates Docker and Compose installations.
2. Checks that a production `.env` exists and contains no default placeholders.
3. Builds/Pulls production container images.
4. Starts postgres, redis, api, admin, and Nginx containers in background.
5. Runs safe database migrations: `npx prisma migrate deploy` inside the API container.
6. Seeds the database with the 42 starter challenges.

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

3. Obtain the certificates:
   ```bash
   sudo certbot certonly --standalone -d api.vital30.com -d admin.vital30.com
   ```
   *Your certificates will be saved under `/etc/letsencrypt/live/api.vital30.com/` on the host.*

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
