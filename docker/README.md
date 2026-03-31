# Docker deployment

## Quick start (any host with Docker)

From the repository root:

```bash
cp docker-compose.env.example .env
# Edit .env — set a strong POSTGRES_PASSWORD
docker compose up --build -d
```

- **Frontend (nginx + static build):** `http://<host>:8080` — `/api` is proxied to the backend container.
- **Backend (Express):** `http://<host>:3000`
- **PostgreSQL:** `<host>:5432`

The frontend production build uses **same-origin** `/api/...` URLs (see `frontend/src/lib/api.ts`), so the browser talks only to nginx on 8080; nginx forwards `/api` to `backend:3000` on the internal Docker network.

After Postgres is up, load CSV data from the **repository root on your PC or NAS** (port `5432` must be reachable):

```bash
DATABASE_URL=postgresql://rvsystem:YOUR_PASSWORD@127.0.0.1:5432/reliability npm run import-pg
```

Use the same user/password/database as in `.env`. If the DB is only on the Docker network, use `docker compose run --rm -e DATABASE_URL=...` with a one-off Node image or expose `5432` as in this compose file.

## Synology NAS (DSM 7+)

1. **Install Container Manager** (formerly “Docker”) from Package Center.
2. Copy this project to a shared folder (e.g. `docker/rv-system`) via File Station or `git clone` over SSH.
3. On your PC or via SSH on the NAS, create `.env` from `docker-compose.env.example` and set `POSTGRES_PASSWORD`.
4. **Option A — SSH:**  
   `cd /volume1/docker/rv-system` (path may differ) then `docker compose up --build -d`.
5. **Option B — Container Manager UI:**  
   Open Container Manager → **Project** → **Create** → select the folder that contains `docker-compose.yml` → follow the wizard (DSM may use “Compose” import depending on version).
6. **Firewall / router:** Allow TCP **8080** (and optionally **3000**, **5432** only on trusted LAN). Avoid exposing **5432** to the public internet.
7. Open `http://<NAS-LAN-IP>:8080` in a browser.

### Notes

- **Passwords in `DATABASE_URL`:** If `POSTGRES_PASSWORD` contains `@`, `:`, or `/`, URL-encode it or use a simpler password in `.env`.
- **TLS / HTTPS:** Put a reverse proxy (Synology Application Portal, nginx, or Traefik) in front of port 8080 and enable HTTPS there.
- **Data persistence:** Postgres uses the named volume `pgdata`. CSV/upload files use the bind mount `./data` → `/data` in the backend container.
