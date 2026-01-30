#!/bin/bash
set -e

echo "Building..."
docker compose -f docker-compose.prod.yml build

echo "Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm bot1 npx prisma migrate deploy

echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for health check..."
sleep 5

echo "Health check:"
curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || echo "Health endpoint not reachable yet"

echo ""
echo "Deployment complete!"
docker compose -f docker-compose.prod.yml ps
