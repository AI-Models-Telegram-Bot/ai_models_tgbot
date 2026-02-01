#!/bin/bash

# Restore database from backup
# Usage: ./restore.sh backup_file.sql.gz

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh /home/deployer/backups/db_*.sql.gz
    exit 1
fi

BACKUP_FILE="$1"
PROJECT_DIR="/home/deployer/ai_models_tgbot"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will restore the database from $BACKUP_FILE"
echo "Current data will be LOST!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Restoring database..."

# Decompress and restore
gunzip -c "$BACKUP_FILE" | \
    docker-compose -f "$PROJECT_DIR/docker-compose.prod.yml" exec -T postgres \
    psql -U aibot aibot_production

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi
