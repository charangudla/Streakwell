# Staging Environment — Vital30

A full **staging** stack that runs **alongside production on the same Hostinger
KVM 4 VPS**. Use it to validate changes end-to-end against real containers,
real Postgres, and real HTTPS before promoting to production.

- **Web:**   `https://staging.challenge.charangudla.com`
- **API:**   `https://api.staging.challenge.charangudla.com`
- **Admin:** `https://admin.staging.challenge.charangudla.com`

---

## 🧭 How it relates to production

Staging is **fully isolated** from prod in every dimension *except* the single
front-door nginx, which fronts both stacks:

| Concern | Production | Staging |
| :--- | :--- | :--- |
| Compose file | `docker-compose.prod.yml` | `docker-compose.staging.yml` |
| Compose project | `vital30` | `vital30-staging` |
| Env file | `.env` | `.env.staging` |
| Postgres / Redis | own containers + volumes | **separate** containers + volumes |
| DB volume | `postgres_prod_data` | `postgres_staging_data` |
| Internal network | `vital30_internal` | `vital30_staging_internal` |
| App service names | `api` / `web` / `admin` | `staging-api` / `staging-web` / `staging-admin` |
| Cookie scope | `.challenge.charangudla.com` | `.staging.challenge.charangudla.com` |
| nginx | **shared** — one container serves both | |
| TLS cert | **shared** — one SAN cert covers all 7 hostnames | |

Nothing in staging can read or write production data: different database,
different volume, different secrets, different cookie domain.

### Why the edge-facing services are renamed `staging-*`

A Docker service registers its **name** as a DNS record on **every** network it
joins. The prod nginx and the staging app containers meet on a shared network
(`vital30_edge`). If staging also named its services `api` / `web` / `admin`,
the prod nginx's `api` lookup would become ambiguous and could route prod
traffic into staging. Unique names (`staging-api`, etc.) keep the two apart.
(Postgres + Redis stay plain-named because they live only on the isolated
`vital30_staging_internal` network, never on the shared edge.)

### Why staging nginx routing uses a runtime resolver

`deploy/nginx/staging-ssl.conf` resolves its upstreams **per request**
(`resolver 127.0.0.11` + variable `proxy_pass`) instead of the static
`upstream {}` blocks prod uses. Two payoffs:

1. **nginx starts even when staging is down** — a static upstream to a missing
   host can abort nginx startup, which would take prod down with it.
2. **staging redeploys need no nginx restart** — fresh container IPs are picked
   up automatically, so the prod-shared nginx is never blipped by staging work.

---

## 🏗️ Architecture

```
                          Internet (HTTPS :443)
                                  │
                    ┌─────────────┴──────────────┐
                    │      nginx (prod stack)     │  one SAN cert,
                    │  conf.d/default.conf  (prod)│  7 hostnames
                    │  conf.d/staging.conf  (stg) │
                    └───────┬──────────────┬──────┘
            vital30_internal│              │vital30_edge (external)
              ┌─────────────┴───┐     ┌────┴──────────────────────┐
              │ api  web  admin │     │ staging-api staging-web    │
              │ postgres  redis │     │ staging-admin              │
              │  (prod stack)   │     │   + postgres + redis       │
              └─────────────────┘     │   (staging stack, on       │
                                      │    vital30_staging_internal)│
                                      └────────────────────────────┘
```

The prod nginx joins **both** `vital30_internal` (to reach prod app
containers) and `vital30_edge` (to reach the `staging-*` containers).

---

## 🌐 DNS

Add **three** staging A records pointing at the VPS public IP (`2.24.89.83`):

| Type | Hostname | Destination IP | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `staging.challenge.charangudla.com`       | `2.24.89.83` | `3600` |
| **A** | `api.staging.challenge.charangudla.com`   | `2.24.89.83` | `3600` |
| **A** | `admin.staging.challenge.charangudla.com` | `2.24.89.83` | `3600` |

> [!IMPORTANT]
> Certbot validates **all** SAN hostnames in one shot (all-or-nothing). The
> shared cert also includes `www.challenge.charangudla.com`, so that record
> must resolve too — make sure `www` has an A record → `2.24.89.83` or the cert
> renewal will fail on `www` and roll back the whole batch.

Verify before issuing certs:
```bash
dig +short staging.challenge.charangudla.com @8.8.8.8
dig +short api.staging.challenge.charangudla.com @8.8.8.8
dig +short admin.staging.challenge.charangudla.com @8.8.8.8
```
All three must return `2.24.89.83`.

---

## 🚀 First-time setup

Run these once, on the VPS, from `/opt/vital30`.

### 1. Pull the code + create the shared edge network

```bash
cd /opt/vital30
git pull --ff-only
docker network create vital30_edge
```

> [!CAUTION]
> After this `git pull`, `docker-compose.prod.yml` references the external
> `vital30_edge` network. **Any** prod compose command (including a routine
> `./scripts/deploy-prod.sh`) will fail with *"network vital30_edge declared as
> external, but could not be found"* until that network exists. Always run
> `docker network create vital30_edge` before the next prod deploy.
> (`deploy-staging.sh` also creates it idempotently.)

### 2. Create the staging secrets

```bash
cp .env.staging.example .env.staging
openssl rand -base64 32     # -> BETTER_AUTH_SECRET
openssl rand -base64 24     # -> POSTGRES_PASSWORD (paste into BOTH the
                            #    POSTGRES_PASSWORD line AND DATABASE_URL)
nano .env.staging
```

> [!IMPORTANT]
> - Use **different** secrets than production.
> - The password inside `DATABASE_URL` must exactly match `POSTGRES_PASSWORD`.
> - `.env.staging` is gitignored — never commit it. Only `.env.staging.example`
>   is tracked.
> - `EMAIL_FROM` reuses the already-verified prod sending domain so staging
>   email actually sends. To isolate staging mail, verify a separate
>   domain/subdomain in Resend and use it here.

### 3. Deploy the staging stack

```bash
./scripts/deploy-staging.sh
```

This builds the images, starts the containers, runs `prisma migrate deploy`,
and **auto-seeds the 42-challenge catalog** (the non-destructive
`seed-catalog.js`, safe to re-run). The staging containers are now up on the
edge network, but not yet publicly routed (cert + nginx route come next).

### 4. Expand the TLS cert to cover the staging hostnames

The staging routing reuses the prod SAN cert lineage
(`challenge.charangudla.com`). Expand it to all 7 hostnames:

```bash
docker compose -f docker-compose.prod.yml stop nginx
certbot certonly --standalone --cert-name challenge.charangudla.com --expand \
  -d challenge.charangudla.com -d www.challenge.charangudla.com \
  -d api.challenge.charangudla.com -d admin.challenge.charangudla.com \
  -d staging.challenge.charangudla.com \
  -d api.staging.challenge.charangudla.com -d admin.staging.challenge.charangudla.com
docker compose -f docker-compose.prod.yml up -d nginx
```

The final `up -d nginx` recreates nginx with the new `staging.conf` mount +
`vital30_edge` attachment and reloads the expanded cert.

### 5. Verify

```bash
curl -sS -o /dev/null -w "web   HTTP %{http_code}\n" https://staging.challenge.charangudla.com/
curl -sS -w "\napi   %{http_code}\n"                  https://api.staging.challenge.charangudla.com/health
curl -sS -o /dev/null -w "admin HTTP %{http_code}\n" https://admin.staging.challenge.charangudla.com/
```

Expect `200` everywhere and `{"status":"ok",...}` from the API. The catalog:
```bash
curl -sS https://api.staging.challenge.charangudla.com/challenges | python3 -c 'import sys,json;print(len(json.load(sys.stdin)),"challenges")'
```

> [!NOTE]
> No test users are seeded — Better Auth password hashing is owned by the API,
> not the seed. Register an account through the staging UI to test auth flows.

---

## 🔁 Routine staging redeploys

After the one-time setup, deploying the latest committed code to staging is just:

```bash
cd /opt/vital30 && git pull --ff-only && ./scripts/deploy-staging.sh
```

No nginx or cert steps needed — the runtime resolver picks up the new container
IPs automatically. Public env values (`NEXT_PUBLIC_*`, `VITE_API_BASE_URL`) are
baked at **build** time from `.env.staging`, so staging images always carry the
staging URLs.

---

## ⬆️ Promoting staging → production

The promotion model is **rebuild the same commit on prod** (code is identical;
only the baked public URLs differ, by design). Once a commit is validated on
staging:

```bash
# from your Mac, repo root:
./scripts/deploy-remote.sh        # push + VPS pull + ./scripts/deploy-prod.sh
```

`deploy-prod.sh` rebuilds the prod images with prod's `.env` (prod URLs baked),
recreates the prod containers, and restarts nginx.

---

## 🧹 Teardown

Stop staging without touching prod:
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging down
```

Add `-v` to also wipe the staging database + Redis volumes (gives the next
deploy a fresh DB + reseeded catalog):
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging down -v
```

To fully remove staging from the public edge, also delete
`deploy/nginx/staging-ssl.conf` from the nginx mounts in
`docker-compose.prod.yml` and `up -d nginx`. The cert can keep the staging SANs
harmlessly, or be re-issued without them.

---

## 🩺 Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `network vital30_edge ... could not be found` on a prod command | Edge network not created | `docker network create vital30_edge` |
| Certbot fails on `www...` (`no valid A records`) | `www` has no DNS record | Add `www` A record → `2.24.89.83`, re-run certbot |
| `502 Bad Gateway` on a `staging.*` URL | Staging stack is down | `./scripts/deploy-staging.sh` (nginx itself stays up by design) |
| Browser cert warning on `staging.*` | Cert not yet expanded to staging SANs | Run the certbot `--expand` step (§4) |
| Staging container shows `(unhealthy)` | — | Healthchecks probe `127.0.0.1` (not `localhost`, which resolves to IPv6 `::1` first while the servers bind IPv4 only). Check logs: `docker compose -f docker-compose.staging.yml --env-file .env.staging logs staging-web` |

### Useful commands

```bash
# Staging status + logs (note the --env-file is required for every command)
docker compose -f docker-compose.staging.yml --env-file .env.staging ps
docker compose -f docker-compose.staging.yml --env-file .env.staging logs --tail=100 -f staging-api

# Re-run the non-destructive catalog seed manually
docker compose -f docker-compose.staging.yml --env-file .env.staging exec -T staging-api node dist-seed/seed-catalog.js
```

---

## 📁 Files

| File | Role |
| :--- | :--- |
| `docker-compose.staging.yml` | The staging stack definition |
| `.env.staging.example` | Env template (copy to `.env.staging`, gitignored) |
| `deploy/nginx/staging-ssl.conf` | Staging routing, mounted into the prod nginx |
| `scripts/deploy-staging.sh` | Build → up → migrate → seed |
| `docker-compose.prod.yml` | nginx joins `vital30_edge` + mounts `staging.conf` |
