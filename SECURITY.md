# Security & Server Hardening

Operational security rules for this project and its production servers. Read this
before changing `docker-compose.prod.yml`, `nginx/nginx.conf`, or anything that
publishes a port. These rules exist because a full audit (2026-06-18) found real
holes — each rule maps to something that was actually exposed.

Servers:
- **Server A** `157.230.151.205` — this bot stack (aibot prod/dev, worker, nginx, postgres, redis, pgadmin) + the separate `fashion_reel_bot` (freel_*) stack.
- **Server B** `64.23.217.80` — n8n, ai-video-bot, outreach-engine, hermes (separate repos).

---

## 1. Docker port publishing — the #1 trap

**UFW does NOT filter Docker-published ports.** A port published as `0.0.0.0:NNNN`
is reachable from the public internet even when `ufw status` shows only 22/80/443
allowed. Docker inserts its own iptables rules ahead of UFW.

Rules:
- **Never publish a backend / admin / DB / cache port on `0.0.0.0`.** In
  `docker-compose.prod.yml`, anything nginx proxies to (the bots, APIs) and every
  datastore must use a loopback bind or no host port at all:
  - nginx reaches the bots over the Docker network (`upstream bot_backend { server bot1:3000; }`),
    so the bots **do not need a host port at all**. If you want local-debug access,
    bind `127.0.0.1:3001:3000` — never `3001:3000`.
  - Postgres is already correct: `127.0.0.1:5432:5432`. Keep it that way.
  - Redis has no host port (internal only). Keep it that way.
- Public host bind is **only** for nginx (`80`, `443`).
- Belt-and-suspenders: a `DOCKER-USER` iptables rule blocks external access to the
  bot backend ports, persisted by `docker-firewall.service` (`/usr/local/sbin/docker-firewall-rules.sh`).
  Keep that service enabled.

Verify after every deploy:
```bash
# on the server — DOCKER-USER must contain the DROP rule:
iptables -L DOCKER-USER -n -v
# from your laptop — these MUST time out (not "succeeded"):
nc -vz 157.230.151.205 3001 ; nc -vz 157.230.151.205 3003 ; nc -vz 157.230.151.205 3005
# these MUST stay open:
nc -vz 157.230.151.205 443
```

## 2. docker.sock is host-root — never expose it

`src/admin/routes.ts` talks to `/var/run/docker.sock` for container management, so
`dev-bot` mounts the socket and is added to the host `docker` group (`group_add: 988`).
**A container with the docker socket + docker group = full host root** (it can launch
a privileged container that mounts host `/`). `:ro` on the socket does NOT prevent
API calls.

Rules:
- The container that holds the socket (`dev-bot`) **must not be directly internet-facing.**
  Its host port (`3003`) is bound away from the public internet (see §1) — keep it so.
- The proper fix is to put a **`tecnativa/docker-socket-proxy`** between the bot and the
  socket, exposing only the minimal endpoints the admin panel needs (read-only where
  possible), and point `routes.ts` at the proxy instead of the raw socket. Until then,
  the admin endpoints that trigger Docker actions must require strong auth.
- Never add the socket mount or `group_add: 988` to a new service "for convenience."

## 3. nginx — every admin/internal route needs auth

nginx drops **all** server-level `add_header` once a `location` defines its own — so
security headers and auth must be repeated **in each location block**.

Rules:
- **Bull Board** (`/admin/queues`), **pgAdmin** (`db.vseonix.com`), and any admin/debug
  route must have `auth_basic` + an IP `allow`/`deny` — never be publicly reachable
  unauthenticated. (Bull Board was found world-open and **write-enabled** — anyone could
  trigger job retries. It is mounted in `src/health/server.ts`; mount it with
  `readOnlyMode: true` and protect the nginx location.)
- `server_tokens off;` in the `http{}` block (don't leak the nginx version).
- Repeat in every `location /` that serves HTML:
  ```nginx
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;   # webapp vhost uses CSP frame-ancestors for Telegram
  ```
- Block dotfiles so `.env`/`.git` can never be served even if the docroot changes:
  ```nginx
  location ~ /\.(git|env) { deny all; return 404; }
  ```
- `nginx.conf` is directory-mounted from this repo and overwritten by `git pull` on the
  server. **Always edit it here and commit** — never hand-edit on the server.

## 4. Secrets

- `chmod 600` every `.env*` and env backup. Never `664`/`644`.
  (`/home/deployer` is `0750` which is the only thing that was saving group/other-readable
  secrets — don't rely on that.)
- Never deploy the repo root or `.env`/`.git` under `/var/www`. Deploy built `dist/` only.
- No default/weak DB creds. Rotate live keys (YooKassa, bot token) if exposure is suspected.

## 5. SSH (both servers)

- Keys only: `PasswordAuthentication no`. Set it in `00-hardening.conf` **and** in the
  cloud-init drop-ins (`50-cloud-init.conf`, `60-cloudimg-settings.conf`) so a cloud-init
  refresh can't silently re-enable passwords.
- `fail2ban` enabled, `bantime` ≥ 1h (use `bantime.increment = true`).
- Per-user keys (no shared key across accounts); `passwd -l` service accounts.
- `MaxStartups 100:30:200` (so a brute-force flood can't starve real logins),
  `ClientAliveInterval 300`, disable X11/agent forwarding on headless hosts.

## 6. Operations / availability

- **Do not run heavy tooling (VS Code Server, Claude Code, AI extensions) on the prod
  box.** Server A is 3.8 GB RAM; a remote IDE session alone consumed ~1.9 GB and drove
  load to >130, taking down SSH and intermittently the public site. Dev on your laptop;
  if you must edit on the server, use a small editor and close it when done. Consider a
  bigger droplet or a separate dev box.
- Set per-container `mem_limit` so one leak can't starve sshd. Alert on swap pressure.
- Don't co-tenant unrelated stacks (the `freel_*` stack should ideally move off this host).
- Pin image tags / digests — no `:latest`. Cap journald (`SystemMaxUse=200M`) and add
  Docker `json-file` log rotation (`max-size 10m, max-file 3`).
- Backups: scripts must be root-owned + executable; after editing one, run it once and
  confirm a fresh dump appears; copy dumps **off-box**; alert if newest dump > 36h old.
- Attach the free **Ubuntu Pro** subscription and `pro enable esm-apps esm-infra` for
  universe security patches.

---

## Quick pre-deploy checklist

- [ ] No new `0.0.0.0:` port publish (loopback or docker-network only).
- [ ] No new `docker.sock` mount / `group_add: 988`.
- [ ] Any new admin/debug route has `auth_basic` + IP allowlist in nginx.
- [ ] New `.env` files are `chmod 600`.
- [ ] `nginx.conf` edited in-repo, not on the server.
- [ ] After deploy: `nc -vz <server> <new-backend-port>` from outside → times out.

_Last full audit: 2026-06-18. See git history / the security review for the finding list._
