#!/bin/bash
# Scale a service to N instances
# Usage: ./scripts/scale.sh worker 5

SERVICE=${1:-worker}
COUNT=${2:-3}

echo "Scaling ${SERVICE} to ${COUNT} instances..."
docker compose -f docker-compose.prod.yml up -d --scale "${SERVICE}=${COUNT}"

echo "Scaled ${SERVICE} to ${COUNT} instances"
docker compose -f docker-compose.prod.yml ps
