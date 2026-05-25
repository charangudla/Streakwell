# VPS Deployment

Vital30 is prepared for a future Hostinger KVM 4 VPS deployment using Docker Compose and Nginx.

## 1. Prepare Ubuntu

Install Docker and Docker Compose on the VPS:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in, then verify:

```bash
docker --version
docker compose version
```

## 2. Clone the Repo

```bash
sudo mkdir -p /opt/vital30
sudo chown $USER:$USER /opt/vital30
git clone <your-repo-url> /opt/vital30
cd /opt/vital30
```

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and use production-safe values for:

- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `VITE_API_BASE_URL`

For Docker production networking, `DATABASE_URL` should point at the compose service name:

```text
postgresql://vital30:your_password@postgres:5432/vital30_db?schema=public
```

## 4. Configure DNS

Point DNS records to the VPS public IP:

- `api.yourdomain.com`
- `admin.yourdomain.com`

Update `deploy/nginx/prod.conf` to use the real domains.

## 5. Start Production Containers

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

## 6. SSL Later

SSL is intentionally deferred until DNS is working. Add Let's Encrypt certificates with Certbot and then update Nginx to redirect HTTP to HTTPS.

## 7. Backups

Back up PostgreSQL daily:

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U vital30 vital30_db > vital30_db_$(date +%F).sql
```

Store backups outside the VPS as well as locally on the server.
