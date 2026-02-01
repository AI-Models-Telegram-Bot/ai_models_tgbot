#!/bin/bash

# Configuration
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
ADMIN_CHAT_ID="${ADMIN_CHAT_ID}"
LOG_FILE="/home/deployer/ai_models_tgbot/logs/monitor.log"

# Function to send Telegram alert
send_alert() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${ADMIN_CHAT_ID}" \
        -d "text=${message}" > /dev/null 2>&1
}

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check bot health
check_bot_health() {
    local health_status=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null)

    if [ "$health_status" != "healthy" ]; then
        log "ERROR: Bot health check failed - Status: $health_status"
        send_alert "⚠️ Bot health check failed!%0AStatus: ${health_status}%0ARestarting services..."

        cd /home/deployer/ai_models_tgbot
        docker-compose -f docker-compose.prod.yml restart bot1 bot2

        sleep 30

        # Check again
        health_status=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null)
        if [ "$health_status" == "healthy" ]; then
            send_alert "✅ Bot recovered after restart"
            log "INFO: Bot recovered after restart"
        else
            send_alert "❌ Bot still unhealthy after restart. Manual intervention required!"
            log "ERROR: Bot still unhealthy after restart"
        fi
    else
        log "INFO: Bot health check passed"
    fi
}

# Check disk space
check_disk_space() {
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -gt 80 ]; then
        log "WARNING: Disk usage at ${disk_usage}%"
        send_alert "⚠️ Disk usage: ${disk_usage}%25%0AConsider cleanup!"
    fi
}

# Check memory usage
check_memory() {
    local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')

    if [ "$mem_usage" -gt 90 ]; then
        log "WARNING: Memory usage at ${mem_usage}%"
        send_alert "⚠️ Memory usage: ${mem_usage}%25"
    fi
}

# Check Docker containers
check_containers() {
    local unhealthy_containers=$(docker ps --filter health=unhealthy --format "{{.Names}}" | wc -l)

    if [ "$unhealthy_containers" -gt 0 ]; then
        local container_names=$(docker ps --filter health=unhealthy --format "{{.Names}}" | tr '\n' ', ')
        log "ERROR: $unhealthy_containers unhealthy container(s): $container_names"
        send_alert "⚠️ Unhealthy containers detected:%0A${container_names}"
    fi
}

# Main execution
log "Starting health check"
check_bot_health
check_disk_space
check_memory
check_containers
log "Health check completed"
