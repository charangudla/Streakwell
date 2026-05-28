# Vital30 launch checklist

A single-page production launch flow. Tick each box top-to-bottom — order matters.

> All commands assume you SSH'd to the VPS as a non-root user and the repo is at `/opt/vital30`. For the full walkthrough of each step, see [hostinger-kvm4-deployment.md](./hostinger-kvm4-deployment.md).

---

## Pre-flight — once per project, ahead of time

- [ ] Domain registered (challenge.charangudla.com) and DNS panel accessible
- [ ] Hostinger KVM 4 VPS provisioned, Ubuntu 22.04/24.04
- [ ] SSH key uploaded; root password login disabled
- [ ] UFW configured to allow only 22, 80, 443
- [ ] Docker + Docker Compose installed (`docker --version`, `docker compose version`)
- [ ] Resend account created at https://resend.com; sending domain `challenge.charangudla.com` verified

---

## Day 0 — first production deploy

### 1. DNS — point all four hostnames at the VPS

Add **four A records** in the domain registrar, each pointing to the VPS IP:

| Type | Host  | TTL  |
|------|-------|------|
| A    | `@`   | 3600 |
| A    | `www` | 3600 |
| A    | `api` | 3600 |
| A    | `admin` | 3600 |

Wait for propagation. Verify:
```bash
for h in challenge.charangudla.com www.challenge.charangudla.com api.challenge.charangudla.com admin.challenge.charangudla.com; do
  printf "%-25s %s\n" "$h" "$(dig +short $h | head -1)"
done
```
All four should return the same VPS IP before continuing.

### 2. Clone + configure

```bash
sudo mkdir -p /opt/vital30 && sudo chown -R $USER:$USER /opt/vital30
git clone <repo-url> /opt/vital30
cd /opt/vital30
cp .env.prod.example .env
nano .env
```

In `.env`, replace every `<REPLACE_ME_*>`:

- `BETTER_AUTH_SECRET` — `openssl rand -base64 32` (≥ 32 chars)
- `POSTGRES_PASSWORD` — `openssl rand -base64 24`. Also update the password embedded in `DATABASE_URL`.
- `RESEND_API_KEY` — from the Resend dashboard

### 3. Initial deploy (HTTP only — SSL comes next)

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

Script validates `.env`, builds all images, starts the stack, runs migrations, and seeds challenges. Expect ~5 minutes the first time.

Smoke test:
```bash
curl http://api.challenge.charangudla.com/health             # → {"status":"ok",...}
curl -I http://challenge.charangudla.com/                    # → 200
curl -I http://admin.challenge.charangudla.com/              # → 200
```

### 4. SSL via Let's Encrypt

```bash
docker compose -f docker-compose.prod.yml stop nginx
sudo apt install -y certbot
sudo certbot certonly --standalone \
  -d challenge.charangudla.com -d www.challenge.charangudla.com \
  -d api.challenge.charangudla.com -d admin.challenge.charangudla.com
```

The HTTPS config (`deploy/nginx/prod-ssl.conf`) and the `/etc/letsencrypt`
mount are already in the repo. Once the certs above exist, just point nginx
at the SSL config and restart — change this one line in
`docker-compose.prod.yml` (nginx `volumes:`):

```yaml
#   - ./deploy/nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro      # was
    - ./deploy/nginx/prod-ssl.conf:/etc/nginx/conf.d/default.conf:ro  # now
```

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

Verify:
```bash
curl -I https://challenge.charangudla.com/
curl -I https://api.challenge.charangudla.com/health
curl -I https://admin.challenge.charangudla.com/
```
All three should return 200 with a valid TLS cert (no `-k` needed).

### 5. Backup cron

```bash
chmod +x scripts/backup-postgres.sh
sudo crontab -e
# Add:
# 0 2 * * * /opt/vital30/scripts/backup-postgres.sh >> /var/log/vital30-backup.log 2>&1
```

### 6. Smoke test the app end-to-end

- [ ] `https://challenge.charangudla.com` loads, hero + popular challenges render
- [ ] `/challenges`, `/categories`, `/faq`, `/privacy` all 200
- [ ] `https://admin.challenge.charangudla.com` loads (login flow if implemented)
- [ ] Register a real user via the mobile app pointed at `https://api.challenge.charangudla.com`
- [ ] Check Resend dashboard — verification email was delivered
- [ ] Complete a check-in → notification appears in inbox → achievement awarded
- [ ] Visit `/sitemap.xml` and confirm it lists all challenge URLs

### 7. App Store / Play Store

- [ ] Update `apps/mobile/assets/env/production.env`: `API_BASE_URL=https://api.challenge.charangudla.com`
- [ ] `flutter build ipa --release` (iOS) / `flutter build appbundle --release` (Android)
- [ ] Upload via Transporter / Play Console (see [app-store-submission.md](./app-store-submission.md))

---

## Subsequent deploys (after the first one)

```bash
cd /opt/vital30
git pull
./scripts/deploy-prod.sh
```

The script is idempotent — it rebuilds, restarts, and re-applies migrations. No DNS or SSL re-config needed.

If only one service changed, rebuild just that container:
```bash
docker compose -f docker-compose.prod.yml up -d --build web   # or api, admin
```

---

## Rollback

```bash
git log --oneline -5                                          # find the last good commit
git checkout <SHA>
./scripts/deploy-prod.sh
```

If the database schema regressed, restore from the most recent backup:
```bash
ls -lh backups/                                               # find the right .sql.gz
# Follow the restore steps in scripts/backup-postgres.sh comments
```

---

## Owed-but-not-blocking before public launch

These should land before the App Store submission, but won't block a closed beta:

- [ ] Attorney review of `/docs/{privacy-policy,terms-of-service,health-disclaimer}.md`
- [ ] App Store screenshots (1290×2796 and 1170×2532) + Play Store screenshots
- [x] Testimonials removed from the landing page (no fake/composite reviews — FTC). Add back only real, consented testimonials if desired.
- [ ] Contact form backend (currently uses `mailto:`)
- [ ] Push notifications (FCM/APNs — current notifications are local only)
- [ ] Web admin restyle to the design system
