#!/bin/sh
# Refresh Bunny CDN edge server IPs for nginx set_real_ip_from
# Run via cron: 0 4 * * 1 /home/deployer/ai_models_tgbot/nginx/refresh-bunny-ips.sh

set -e

NGINX_DIR="$(dirname "$0")"
OUT="$NGINX_DIR/bunny-ips.conf"
TMP="$OUT.tmp"
CONTAINER="aibot_nginx"

curl -sf "https://bunnycdn.com/api/system/edgeserverlist" | python3 -c "
import json, sys
from datetime import datetime, timezone
ips = json.load(sys.stdin)
lines = ['# Bunny CDN edge server IPs — auto-refreshed ' + datetime.now(timezone.utc).strftime('%Y-%m-%d')]
for ip in ips:
    lines.append('set_real_ip_from ' + ip + ';')
print('\n'.join(lines))
" > "$TMP"

# Only update if we got a valid response (at least 100 IPs)
count=$(grep -c 'set_real_ip_from' "$TMP" || true)
if [ "$count" -lt 100 ]; then
    echo "ERROR: Only got $count IPs from Bunny API — aborting" >&2
    rm -f "$TMP"
    exit 1
fi

mv "$TMP" "$OUT"
echo "Updated $OUT with $count IPs"

# Reload nginx if container is running
if docker ps --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
    docker exec "$CONTAINER" nginx -s reload
    echo "Nginx reloaded"
fi
