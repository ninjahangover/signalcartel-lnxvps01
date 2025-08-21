# SignalCartel Platform Management Guide

## 📋 Table of Contents
1. [Quick Reference](#quick-reference)
2. [Docker Management](#docker-management)
3. [Portainer Dashboard](#portainer-dashboard)
4. [Service Operations](#service-operations)
5. [Monitoring & Logs](#monitoring--logs)
6. [Troubleshooting](#troubleshooting)
7. [Backup & Recovery](#backup--recovery)
8. [Performance Tuning](#performance-tuning)

---

## 🚀 Quick Reference

### Essential Commands
```bash
# Check all services status
docker ps -a

# Start the platform
docker-compose up -d

# Stop the platform
docker-compose down

# View logs (live)
docker-compose logs -f trading-engine

# Restart a crashed service
docker-compose restart website

# Emergency stop all
docker stop $(docker ps -q)
```

### Service URLs
- **Website**: https://dev.signalcartel.io
- **Portainer**: http://localhost:9000
- **Redis Commander**: http://localhost:8081 (if enabled)
- **Grafana**: http://localhost:3002 (if monitoring enabled)
- **Prometheus**: http://localhost:9090 (if monitoring enabled)

---

## 🐳 Docker Management

### Starting the Platform

#### Production Mode (Recommended)
```bash
# Start core services only
docker-compose up -d website trading-engine redis

# Start with monitoring
docker-compose --profile monitoring up -d

# Start everything
docker-compose up -d
```

#### Development Mode
```bash
# Start with live logs
docker-compose up

# Start specific service with rebuild
docker-compose up -d --build website
```

### Stopping Services

```bash
# Graceful shutdown
docker-compose down

# Stop but keep volumes (data persists)
docker-compose stop

# Emergency shutdown with cleanup
docker-compose down -v --remove-orphans
```

### Service Management

#### Individual Service Control
```bash
# Stop single service
docker-compose stop trading-engine

# Start single service
docker-compose start trading-engine

# Restart service
docker-compose restart website

# Rebuild and restart
docker-compose up -d --build trading-engine
```

#### Scaling Services
```bash
# Scale market data collectors
docker-compose up -d --scale market-data=3

# Scale trading engines (careful with this!)
docker-compose up -d --scale trading-engine=2
```

---

## 🎛️ Portainer Dashboard

### Accessing Portainer
1. Navigate to http://localhost:9000
2. Login with your credentials
3. Select "Local" environment

### Key Portainer Features

#### Container Management
- **Containers** → View all running containers
- Click container name → Access logs, stats, console
- **Quick Actions**: Start/Stop/Restart buttons
- **Exec Console**: Access container shell directly

#### Stack Management
- **Stacks** → "signalcartel" stack
- View docker-compose configuration
- Update stack with new compose file
- Redeploy with single click

#### Monitoring in Portainer
- **Dashboard** → Real-time resource usage
- **Container Stats** → CPU, Memory, Network, Disk I/O
- Set resource limits per container
- Configure health check parameters

### Portainer Best Practices
1. Set up **Container Templates** for quick deployment
2. Use **Webhooks** for automated deployments
3. Configure **Email Notifications** for container events
4. Create **User Access** controls for team members

---

## 🔧 Service Operations

### Health Checks

#### Automated Health Monitoring
```yaml
# Already configured in docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### Manual Health Verification
```bash
# Check website health
curl http://localhost:3001/api/health

# Check trading engine
docker exec signalcartel-trading ps aux | grep strategy

# Check market data flow
docker logs signalcartel-trading --tail 20 | grep "Market Data"

# Check Redis connection
docker exec signalcartel-redis redis-cli ping
```

### Configuration Management

#### Environment Variables
```bash
# View current env vars
docker-compose config

# Override with .env file
cat > .env << EOF
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
DB_PASSWORD=secure_password
EOF

# Apply new configuration
docker-compose up -d
```

#### Updating Configurations
```bash
# Edit docker-compose.yml
nano docker-compose.yml

# Validate configuration
docker-compose config

# Apply changes
docker-compose up -d
```

---

## 📊 Monitoring & Logs

### Log Management

#### Viewing Logs
```bash
# All services
docker-compose logs

# Specific service (last 100 lines)
docker-compose logs --tail 100 trading-engine

# Follow logs in real-time
docker-compose logs -f website

# Logs with timestamps
docker-compose logs -t trading-engine

# Filter logs
docker-compose logs trading-engine | grep ERROR
```

#### Log Rotation
```bash
# Configure in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Performance Monitoring

#### Resource Usage
```bash
# Real-time stats
docker stats

# Specific container
docker stats signalcartel-trading

# Export metrics
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

#### With Prometheus & Grafana
```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access dashboards
# Grafana: http://localhost:3002 (admin/admin)
# Prometheus: http://localhost:9090
```

---

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Service Won't Start
```bash
# Check logs
docker-compose logs website

# Check port conflicts
netstat -tulpn | grep 3001

# Force recreate
docker-compose up -d --force-recreate website
```

#### Out of Memory
```bash
# Check memory usage
docker system df

# Clean up
docker system prune -a --volumes

# Increase memory limits
docker-compose down
# Edit docker-compose.yml, add:
# deploy:
#   resources:
#     limits:
#       memory: 2G
docker-compose up -d
```

#### Connection Issues
```bash
# Check network
docker network ls
docker network inspect signalcartel_signalcartel-network

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

#### Database Issues
```bash
# Backup database first!
docker exec signalcartel-postgres pg_dump -U signalcartel > backup.sql

# Access database
docker exec -it signalcartel-postgres psql -U signalcartel

# Reset database
docker-compose down -v
docker-compose up -d
```

### Debug Mode

```bash
# Run container with shell access
docker run -it --rm signalcartel-trading /bin/sh

# Attach to running container
docker exec -it signalcartel-trading /bin/sh

# View container processes
docker top signalcartel-trading
```

---

## 💾 Backup & Recovery

### Automated Backups

#### Daily Backup Script
```bash
#!/bin/bash
# Save as backup.sh

BACKUP_DIR="/backups/signalcartel/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup database
docker exec signalcartel-postgres pg_dump -U signalcartel > $BACKUP_DIR/database.sql

# Backup volumes
docker run --rm -v signalcartel_redis-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis-data.tar.gz /data

# Backup configurations
cp docker-compose.yml $BACKUP_DIR/
cp .env $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

#### Schedule with Cron
```bash
# Add to crontab
0 2 * * * /home/user/backup.sh
```

### Recovery Procedures

#### Restore Database
```bash
# Stop services
docker-compose stop

# Restore database
docker exec -i signalcartel-postgres psql -U signalcartel < backup.sql

# Restart services
docker-compose start
```

#### Restore Volumes
```bash
# Stop service
docker-compose stop redis

# Restore volume
docker run --rm -v signalcartel_redis-data:/data -v /backups:/backup alpine tar xzf /backup/redis-data.tar.gz

# Start service
docker-compose start redis
```

---

## ⚡ Performance Tuning

### Resource Optimization

#### Memory Settings
```yaml
# In docker-compose.yml
services:
  trading-engine:
    environment:
      - NODE_OPTIONS=--max-old-space-size=2048
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 1G
```

#### Network Optimization
```yaml
# Use host network for lowest latency
network_mode: "host"

# Or optimize Docker network
networks:
  signalcartel-network:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1450
```

### Monitoring Performance

#### Key Metrics to Watch
1. **Container CPU**: Should stay below 80%
2. **Memory Usage**: Monitor for leaks
3. **Network I/O**: Check for bottlenecks
4. **Disk I/O**: Ensure fast enough for logs
5. **API Response Times**: Should be < 1s

#### Performance Testing
```bash
# Load test the API
ab -n 1000 -c 10 http://localhost:3001/api/health

# Monitor during test
docker stats --no-stream
```

---

## 📱 Telegram Integration

### Verify Telegram is Working
```bash
# Check environment variables
docker exec signalcartel-trading env | grep TELEGRAM

# Check logs for Telegram initialization
docker logs signalcartel-trading | grep Telegram

# Test notification
docker exec signalcartel-trading node -e "
  const bot = require('./src/lib/telegram-bot-service');
  bot.sendMessage('Test from Docker container');
"
```

---

## 🔄 Maintenance Windows

### Scheduled Maintenance
```bash
# Notify users (if applicable)
echo "Maintenance starting in 5 minutes" | docker exec -i signalcartel-trading node send-telegram.js

# Graceful shutdown
docker-compose stop

# Perform updates
git pull
docker-compose build

# Start services
docker-compose up -d

# Verify health
./scripts/services/status.sh
```

---

## 📚 Additional Resources

### Documentation
- [Docker Compose Reference](https://docs.docker.com/compose/reference/)
- [Portainer Documentation](https://docs.portainer.io/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### Support Channels
- **Logs**: Primary debugging tool
- **Portainer**: Visual management
- **Telegram**: Real-time alerts
- **Grafana**: Historical analysis

### Emergency Contacts
- Keep a list of critical contacts
- Document escalation procedures
- Maintain runbook for common issues

---

## 🎯 Quick Wins

1. **Use Portainer** for visual management
2. **Set up alerts** in Telegram for critical events
3. **Automate backups** with cron jobs
4. **Monitor resources** to prevent crashes
5. **Document changes** in SYSTEM_CHANGELOG.md
6. **Test recovery** procedures regularly

---

*Last Updated: 2025-08-20*
*Platform Version: Decoupled Architecture v2.0*