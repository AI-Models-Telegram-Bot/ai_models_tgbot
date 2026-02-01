#!/bin/bash

# Configuration
BACKUP_DIR="/home/deployer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
PROJECT_DIR="/home/deployer/ai_models_tgbot"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Backup database
backup_database() {
    log "Starting database backup..."

    docker compose -f "$PROJECT_DIR/docker-compose.prod.yml" exec -T postgres \
        pg_dump -U aibot aibot_production > "$BACKUP_DIR/db_$DATE.sql"

    if [ $? -eq 0 ]; then
        gzip "$BACKUP_DIR/db_$DATE.sql"
        log "Database backup completed: db_$DATE.sql.gz"

        local size=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
        log "Backup size: $size"
    else
        log "ERROR: Database backup failed!"
        return 1
    fi
}

# Backup environment files
backup_env() {
    log "Backing up environment files..."

    cp "$PROJECT_DIR/.env.production" "$BACKUP_DIR/env_$DATE.backup" 2>/dev/null

    if [ $? -eq 0 ]; then
        log "Environment backup completed"
    else
        log "WARNING: Environment backup failed (file may not exist)"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "env_*.backup" -mtime +$RETENTION_DAYS -delete

    log "Cleanup completed"
}

# Send notification
send_notification() {
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$ADMIN_CHAT_ID" ]; then
        local backup_count=$(ls -1 "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | wc -l)
        local latest_size=$(du -h "$BACKUP_DIR/db_$DATE.sql.gz" 2>/dev/null | cut -f1)

        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${ADMIN_CHAT_ID}" \
            -d "text=💾 Backup completed%0ADate: $DATE%0ASize: ${latest_size}%0ATotal backups: ${backup_count}" \
            > /dev/null 2>&1
    fi
}

# Main execution
log "=== Backup Started ==="
backup_database
backup_env
cleanup_old_backups
send_notification
log "=== Backup Completed ==="
