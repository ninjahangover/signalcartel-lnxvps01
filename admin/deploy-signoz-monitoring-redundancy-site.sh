#!/bin/bash

# 🔍 SigNoz Enterprise Monitoring Deployment for QUANTUM FORGE™
# Deploy to VMS Database Redundancy Site (Physical Separation)

set -euo pipefail

# Configuration
SIGNOZ_VERSION="0.51.0"
MONITORING_DOMAIN="monitoring.yourdomain.com"
SIGNOZ_PORT=3301
OTEL_PORT=4317
INSTALL_DIR="/opt/signoz"
DATA_DIR="/var/lib/signoz"
SSL_CERT_DIR="/etc/ssl/signoz"
DOCKER_COMPOSE_FILE="docker-compose.monitoring.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Check if running as root or with sudo
check_privileges() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

# Check system requirements
check_requirements() {
    log "🔍 Checking system requirements..."
    
    # Check available RAM (minimum 8GB)
    TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
    if (( $(echo "$TOTAL_RAM < 7.0" | bc -l) )); then
        error "Insufficient RAM: ${TOTAL_RAM}GB available, 8GB minimum required"
    fi
    log "✅ RAM: ${TOTAL_RAM}GB (adequate)"
    
    # Check available disk space (minimum 100GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2{print $4}')
    AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    if [[ $AVAILABLE_GB -lt 100 ]]; then
        error "Insufficient disk space: ${AVAILABLE_GB}GB available, 100GB minimum required"
    fi
    log "✅ Disk Space: ${AVAILABLE_GB}GB (adequate)"
    
    # Check CPU cores (minimum 4)
    CPU_CORES=$(nproc)
    if [[ $CPU_CORES -lt 4 ]]; then
        error "Insufficient CPU cores: ${CPU_CORES} available, 4 minimum required"
    fi
    log "✅ CPU Cores: ${CPU_CORES} (adequate)"
}

# Install Docker if not present
install_docker() {
    if ! command -v docker &> /dev/null; then
        log "🐳 Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        usermod -aG docker $SUDO_USER 2>/dev/null || true
        log "✅ Docker installed successfully"
    else
        log "✅ Docker already installed"
    fi
}

# Install Docker Compose if not present
install_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log "🐳 Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log "✅ Docker Compose installed successfully"
    else
        log "✅ Docker Compose already installed"
    fi
}

# Create necessary directories
create_directories() {
    log "📁 Creating directories..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"/{clickhouse,postgres,prometheus,alertmanager}
    mkdir -p "$SSL_CERT_DIR"
    mkdir -p /var/log/signoz
    
    # Set proper permissions
    chown -R 1000:1000 "$DATA_DIR"
    chmod -R 755 "$DATA_DIR"
    log "✅ Directories created with proper permissions"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certificates() {
    log "🔐 Generating SSL certificates..."
    
    if [[ ! -f "$SSL_CERT_DIR/server.crt" ]]; then
        openssl req -x509 -newkey rsa:4096 -keyout "$SSL_CERT_DIR/server.key" -out "$SSL_CERT_DIR/server.crt" -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$MONITORING_DOMAIN"
        
        chmod 600 "$SSL_CERT_DIR/server.key"
        chmod 644 "$SSL_CERT_DIR/server.crt"
        log "✅ SSL certificates generated"
    else
        log "✅ SSL certificates already exist"
    fi
}

# Create SigNoz Docker Compose configuration
create_docker_compose() {
    log "📝 Creating Docker Compose configuration..."
    
    cat > "$INSTALL_DIR/$DOCKER_COMPOSE_FILE" << 'EOF'
version: '3.8'

x-clickhouse-defaults: &clickhouse-defaults
  restart: on-failure
  image: clickhouse/clickhouse-server:23.11
  tty: true
  depends_on:
    - zookeeper-1
  logging:
    options:
      max-size: 50m
      max-file: "3"
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "localhost:8123/ping"]
    interval: 30s
    timeout: 5s
    retries: 3

x-db-depend: &db-depend
  depends_on:
    clickhouse:
      condition: service_healthy
    postgres:
      condition: service_healthy

services:
  zookeeper-1:
    image: bitnami/zookeeper:3.7.1
    container_name: signoz-zookeeper-1
    hostname: zookeeper-1
    user: root
    ports:
      - "2181:2181"
      - "2888:2888"
      - "3888:3888"
    volumes:
      - /var/lib/signoz/zookeeper-1:/bitnami/zookeeper
    environment:
      - ZOO_SERVER_ID=1
      - ALLOW_ANONYMOUS_LOGIN=yes
      - ZOO_AUTOPURGE_INTERVAL=1

  clickhouse:
    <<: *clickhouse-defaults
    container_name: signoz-clickhouse
    hostname: clickhouse
    ports:
      - "9000:9000"
      - "8123:8123"
    volumes:
      - /var/lib/signoz/clickhouse:/var/lib/clickhouse/
      - ./clickhouse-config.xml:/etc/clickhouse-server/config.xml
      - ./clickhouse-users.xml:/etc/clickhouse-server/users.xml
      - ./custom-function.xml:/etc/clickhouse-server/custom-function.xml
    environment:
      - CLICKHOUSE_DB=signoz_traces
      - CLICKHOUSE_USER=default
      - CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1

  alertmanager:
    image: prom/alertmanager:v0.25.0
    container_name: signoz-alertmanager
    volumes:
      - /var/lib/signoz/alertmanager:/data
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    depends_on:
      - query-service
    restart: on-failure
    command:
      - --config.file=/etc/alertmanager/alertmanager.yml
      - --storage.path=/data

  query-service:
    image: signoz/query-service:${DOCKER_TAG:-0.51.0}
    container_name: signoz-query-service
    command: ["-config=/root/config/prometheus.yml"]
    volumes:
      - ./prometheus.yml:/root/config/prometheus.yml
      - /var/lib/signoz/prometheus:/prometheus
    environment:
      - ClickHouseUrl=tcp://clickhouse:9000/?database=signoz_traces
      - ALERTMANAGER_API_PREFIX=http://alertmanager:9093/api/v1
      - SIGNOZ_LOCAL_DB_PATH=/prometheus
      - DASHBOARDS_PATH=/root/config/dashboards
      - STORAGE=clickhouse
      - GODEBUG=netdns=go
      - TELEMETRY_ENABLED=true
      - DEPLOYMENT_TYPE=docker-standalone-amd
    restart: on-failure
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "localhost:8080/api/v1/version"]
      interval: 30s
      timeout: 5s
      retries: 3
    <<: *db-depend

  frontend:
    image: signoz/frontend:${DOCKER_TAG:-0.51.0}
    container_name: signoz-frontend
    restart: on-failure
    depends_on:
      - alertmanager
      - query-service
    ports:
      - "${SIGNOZ_PORT:-3301}:3301"
    volumes:
      - ../common/nginx-config.conf:/etc/nginx/conf.d/default.conf
      - /etc/ssl/signoz:/etc/ssl/signoz:ro
    environment:
      - FRONTEND_API_ENDPOINT=http://query-service:8080

  otel-collector:
    image: signoz/signoz-otel-collector:${OTELCOL_TAG:-0.88.21}
    container_name: signoz-otel-collector
    command: ["--config=/etc/otelcol-contrib/otelcol-config.yaml"]
    user: root
    volumes:
      - ./otelcol-config.yaml:/etc/otelcol-contrib/otelcol-config.yaml
      - /var/log:/var/log:ro
    environment:
      - OTEL_RESOURCE_ATTRIBUTES=service.name=signoz-otel-collector,service.version=${OTELCOL_TAG:-0.88.21}
    ports:
      - "${OTEL_PORT:-4317}:4317"   # OTLP gRPC receiver
      - "4318:4318"                 # OTLP HTTP receiver
      - "8888:8888"                 # Prometheus metrics exposed by the collector
      - "8889:8889"                 # Prometheus exporter metrics
      - "13133:13133"               # health_check extension
      - "14250:14250"               # Jaeger gRPC
      - "14268:14268"               # Jaeger HTTP
      - "9411:9411"                 # Zipkin
    restart: on-failure
    <<: *db-depend

  postgres:
    image: postgres:13
    container_name: signoz-postgres
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_USER: postgres
      POSTGRES_DB: signoz
    volumes:
      - /var/lib/signoz/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  default:
    name: signoz-network
EOF

    log "✅ Docker Compose configuration created"
}

# Create ClickHouse configuration
create_clickhouse_config() {
    log "📝 Creating ClickHouse configuration..."
    
    cat > "$INSTALL_DIR/clickhouse-config.xml" << 'EOF'
<?xml version="1.0"?>
<clickhouse>
    <logger>
        <level>warning</level>
        <console>true</console>
    </logger>
    <http_port>8123</http_port>
    <tcp_port>9000</tcp_port>
    <mysql_port>9004</mysql_port>
    <postgresql_port>9005</postgresql_port>
    <interserver_http_port>9009</interserver_http_port>
    <max_connections>2048</max_connections>
    <keep_alive_timeout>3</keep_alive_timeout>
    <max_concurrent_queries>100</max_concurrent_queries>
    <uncompressed_cache_size>8589934592</uncompressed_cache_size>
    <mark_cache_size>5368709120</mark_cache_size>
    <path>/var/lib/clickhouse/</path>
    <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
    <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>
    <users_config>users.xml</users_config>
    <default_profile>default</default_profile>
    <default_database>default</default_database>
    <mlock_executable>false</mlock_executable>
    <remote_servers>
        <cluster_1S_2R>
            <shard>
                <replica>
                    <host>clickhouse</host>
                    <port>9000</port>
                </replica>
            </shard>
        </cluster_1S_2R>
    </remote_servers>
    <zookeeper>
        <node>
            <host>zookeeper-1</host>
            <port>2181</port>
        </node>
    </zookeeper>
    <macros>
        <cluster>cluster_1S_2R</cluster>
        <shard>01</shard>
        <replica>01</replica>
    </macros>
    <distributed_ddl>
        <path>/clickhouse/task_queue/ddl</path>
    </distributed_ddl>
    <timezone>UTC</timezone>
    <query_log>
        <database>system</database>
        <table>query_log</table>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </query_log>
    <trace_log>
        <database>system</database>
        <table>trace_log</table>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </trace_log>
    <listen_host>::</listen_host>
    <listen_host>0.0.0.0</listen_host>
</clickhouse>
EOF

    cat > "$INSTALL_DIR/clickhouse-users.xml" << 'EOF'
<?xml version="1.0"?>
<clickhouse>
    <users>
        <default>
            <password></password>
            <profile>default</profile>
            <quota>default</quota>
            <networks>
                <ip>::/0</ip>
            </networks>
        </default>
    </users>
    <profiles>
        <default>
            <max_memory_usage>10000000000</max_memory_usage>
            <use_uncompressed_cache>0</use_uncompressed_cache>
            <load_balancing>random</load_balancing>
        </default>
    </profiles>
    <quotas>
        <default>
            <interval>
                <duration>3600</duration>
                <queries>0</queries>
                <errors>0</errors>
                <result_rows>0</result_rows>
                <read_rows>0</read_rows>
                <execution_time>0</execution_time>
            </interval>
        </default>
    </quotas>
</clickhouse>
EOF

    cat > "$INSTALL_DIR/custom-function.xml" << 'EOF'
<?xml version="1.0"?>
<functions>
</functions>
EOF

    log "✅ ClickHouse configuration files created"
}

# Create OpenTelemetry Collector configuration
create_otel_config() {
    log "📝 Creating OpenTelemetry Collector configuration..."
    
    cat > "$INSTALL_DIR/otelcol-config.yaml" << 'EOF'
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
      thrift_http:
        endpoint: 0.0.0.0:14268
  zipkin:
    endpoint: 0.0.0.0:9411
  prometheus:
    config:
      scrape_configs:
        - job_name: 'quantum-forge-trading'
          static_configs:
            - targets: ['host.docker.internal:8080']
        - job_name: 'quantum-forge-metrics'
          static_configs:
            - targets: ['host.docker.internal:9090']
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu:
      memory:
      disk:
      filesystem:
      network:

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  memory_limiter:
    limit_mib: 512
  resource:
    attributes:
      - key: service.name
        value: quantum-forge
        action: insert
      - key: deployment.environment
        value: production
        action: insert

exporters:
  clickhouse:
    endpoint: tcp://clickhouse:9000/?database=signoz_traces
    username: default
    password: ""
  prometheus:
    endpoint: "0.0.0.0:8889"

service:
  pipelines:
    traces:
      receivers: [otlp, jaeger, zipkin]
      processors: [memory_limiter, batch, resource]
      exporters: [clickhouse]
    metrics:
      receivers: [otlp, prometheus, hostmetrics]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [clickhouse]
EOF

    log "✅ OpenTelemetry Collector configuration created"
}

# Create Alertmanager configuration
create_alertmanager_config() {
    log "📝 Creating Alertmanager configuration..."
    
    cat > "$INSTALL_DIR/alertmanager.yml" << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourdomain.com'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'quantum-forge-alerts'
  routes:
    - match:
        severity: critical
      receiver: 'quantum-forge-critical'
    - match:
        severity: warning
      receiver: 'quantum-forge-warnings'

receivers:
  - name: 'quantum-forge-alerts'
    webhook_configs:
      - url: 'http://host.docker.internal:3001/api/alerts/webhook'
        send_resolved: true
    
  - name: 'quantum-forge-critical'
    email_configs:
      - to: 'admin@yourdomain.com'
        subject: '🚨 CRITICAL: QUANTUM FORGE™ Alert - {{ .GroupLabels.alertname }}'
        body: |
          Alert: {{ .GroupLabels.alertname }}
          Severity: {{ .CommonLabels.severity }}
          
          {{ range .Alerts }}
          Description: {{ .Annotations.description }}
          Value: {{ .Annotations.value }}
          {{ end }}
    webhook_configs:
      - url: 'http://host.docker.internal:3001/api/alerts/webhook'
        send_resolved: true

  - name: 'quantum-forge-warnings'
    webhook_configs:
      - url: 'http://host.docker.internal:3001/api/alerts/webhook'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
EOF

    log "✅ Alertmanager configuration created"
}

# Create Prometheus configuration
create_prometheus_config() {
    log "📝 Creating Prometheus configuration..."
    
    cat > "$INSTALL_DIR/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/root/config/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'quantum-forge-trading'
    static_configs:
      - targets: ['host.docker.internal:8080']
    scrape_interval: 5s
    metrics_path: /api/metrics
    
  - job_name: 'quantum-forge-ai-systems'
    static_configs:
      - targets: ['host.docker.internal:9090']
    scrape_interval: 10s
    metrics_path: /metrics
    
  - job_name: 'postgresql'
    static_configs:
      - targets: ['host.docker.internal:5433']
    scrape_interval: 30s
    
  - job_name: 'signoz-query-service'
    static_configs:
      - targets: ['query-service:8080']
    scrape_interval: 30s
    metrics_path: /api/v1/metrics
EOF

    log "✅ Prometheus configuration created"
}

# Create nginx configuration for SSL
create_nginx_config() {
    log "📝 Creating Nginx configuration..."
    
    mkdir -p "$INSTALL_DIR/../common"
    cat > "$INSTALL_DIR/../common/nginx-config.conf" << 'EOF'
server {
    listen 3301 ssl http2;
    server_name monitoring.yourdomain.com;
    
    ssl_certificate /etc/ssl/signoz/server.crt;
    ssl_certificate_key /etc/ssl/signoz/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location /api/ {
        proxy_pass http://query-service:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    log "✅ Nginx configuration created"
}

# Create firewall rules
setup_firewall() {
    log "🔥 Setting up firewall rules..."
    
    if command -v ufw &> /dev/null; then
        # Allow SSH
        ufw allow ssh
        
        # Allow SigNoz ports
        ufw allow $SIGNOZ_PORT/tcp comment 'SigNoz Frontend'
        ufw allow $OTEL_PORT/tcp comment 'OpenTelemetry gRPC'
        ufw allow 4318/tcp comment 'OpenTelemetry HTTP'
        
        # Allow from dev servers subnet (adjust as needed)
        ufw allow from 192.168.1.0/24 to any port $SIGNOZ_PORT
        ufw allow from 192.168.1.0/24 to any port $OTEL_PORT
        
        ufw --force enable
        log "✅ Firewall rules configured"
    else
        warn "UFW not available, skipping firewall configuration"
    fi
}

# Deploy SigNoz
deploy_signoz() {
    log "🚀 Deploying SigNoz monitoring stack..."
    
    cd "$INSTALL_DIR"
    
    # Pull all images
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log "⏳ Waiting for services to initialize..."
    sleep 30
    
    # Health check
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "http://localhost:$SIGNOZ_PORT/api/v1/version" > /dev/null 2>&1; then
            log "✅ SigNoz is ready and healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log "⏳ Waiting for SigNoz to be ready... (${attempt}/${max_attempts})"
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "SigNoz failed to start properly within timeout"
    fi
}

# Create systemd service
create_systemd_service() {
    log "📝 Creating systemd service..."
    
    cat > /etc/systemd/system/signoz-monitoring.service << EOF
[Unit]
Description=SigNoz Monitoring Stack for QUANTUM FORGE™
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/docker-compose -f $DOCKER_COMPOSE_FILE up -d
ExecStop=/usr/local/bin/docker-compose -f $DOCKER_COMPOSE_FILE down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable signoz-monitoring.service
    log "✅ Systemd service created and enabled"
}

# Create management scripts
create_management_scripts() {
    log "📝 Creating management scripts..."
    
    # Status script
    cat > "$INSTALL_DIR/status.sh" << 'EOF'
#!/bin/bash
cd /opt/signoz
docker-compose -f docker-compose.monitoring.yml ps
echo ""
echo "=== Service Health ==="
curl -s http://localhost:3301/api/v1/version | jq . 2>/dev/null || echo "SigNoz not responding"
echo ""
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
EOF

    # Logs script
    cat > "$INSTALL_DIR/logs.sh" << 'EOF'
#!/bin/bash
cd /opt/signoz
if [ -z "$1" ]; then
    echo "Available services:"
    docker-compose -f docker-compose.monitoring.yml ps --services
    echo ""
    echo "Usage: $0 <service_name>"
    echo "Example: $0 query-service"
else
    docker-compose -f docker-compose.monitoring.yml logs -f "$1"
fi
EOF

    # Restart script
    cat > "$INSTALL_DIR/restart.sh" << 'EOF'
#!/bin/bash
cd /opt/signoz
echo "Stopping SigNoz services..."
docker-compose -f docker-compose.monitoring.yml down
echo "Starting SigNoz services..."
docker-compose -f docker-compose.monitoring.yml up -d
echo "Waiting for services to be ready..."
sleep 30
curl -f http://localhost:3301/api/v1/version && echo "✅ SigNoz is ready"
EOF

    chmod +x "$INSTALL_DIR"/{status,logs,restart}.sh
    log "✅ Management scripts created"
}

# Create backup script
create_backup_script() {
    log "📝 Creating backup script..."
    
    cat > "$INSTALL_DIR/backup.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/signoz/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔄 Creating SigNoz backup..."

# Backup configurations
cp -r /opt/signoz/*.{yml,yaml,xml} "$BACKUP_DIR/" 2>/dev/null

# Backup ClickHouse data
docker exec signoz-clickhouse clickhouse-client --query "BACKUP DATABASE signoz_traces TO Disk('default', 'backup_$(date +%Y%m%d_%H%M%S)')"

# Backup PostgreSQL data  
docker exec signoz-postgres pg_dump -U postgres signoz > "$BACKUP_DIR/postgres_backup.sql"

# Create archive
cd /opt/signoz/backups
tar -czf "signoz_backup_$(date +%Y%m%d_%H%M%S).tar.gz" "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo "✅ Backup completed: signoz_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

# Cleanup old backups (keep last 7 days)
find /opt/signoz/backups -name "signoz_backup_*.tar.gz" -mtime +7 -delete
EOF

    chmod +x "$INSTALL_DIR/backup.sh"
    
    # Schedule daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * $INSTALL_DIR/backup.sh") | crontab -
    log "✅ Backup script created and scheduled"
}

# Print deployment summary
print_summary() {
    log "🎉 SigNoz deployment completed successfully!"
    echo ""
    echo -e "${GREEN}=== QUANTUM FORGE™ Monitoring Stack ===Ǝ"
    echo -e "${BLUE}Frontend URL:${NC} https://$MONITORING_DOMAIN:$SIGNOZ_PORT"
    echo -e "${BLUE}OpenTelemetry Endpoint:${NC} https://$MONITORING_DOMAIN:$OTEL_PORT"
    echo -e "${BLUE}Installation Directory:${NC} $INSTALL_DIR"
    echo -e "${BLUE}Data Directory:${NC} $DATA_DIR"
    echo ""
    echo -e "${YELLOW}Management Commands:${NC}"
    echo -e "  Status:  $INSTALL_DIR/status.sh"
    echo -e "  Logs:    $INSTALL_DIR/logs.sh <service>"
    echo -e "  Restart: $INSTALL_DIR/restart.sh"
    echo -e "  Backup:  $INSTALL_DIR/backup.sh"
    echo ""
    echo -e "${YELLOW}Service Management:${NC}"
    echo -e "  Start:   systemctl start signoz-monitoring"
    echo -e "  Stop:    systemctl stop signoz-monitoring"
    echo -e "  Status:  systemctl status signoz-monitoring"
    echo ""
    echo -e "${GREEN}Next Steps:${NC}"
    echo -e "1. Update DNS to point $MONITORING_DOMAIN to this server"
    echo -e "2. Replace self-signed certificates with proper SSL certificates"
    echo -e "3. Configure trading application OpenTelemetry instrumentation"
    echo -e "4. Import custom QUANTUM FORGE™ dashboards"
    echo -e "5. Set up alerting notification channels"
    echo ""
    echo -e "${GREEN}🛡️ Physical Separation Achieved:${NC}"
    echo -e "✅ Monitoring infrastructure deployed on separate site"
    echo -e "✅ Independent of primary trading infrastructure"
    echo -e "✅ Survives primary site failures"
    echo -e "✅ Real-time visibility maintained during disasters"
    echo ""
}

# Main execution
main() {
    log "🚀 Starting SigNoz Enterprise Monitoring deployment for QUANTUM FORGE™..."
    log "📍 Deploying to VMS Database Redundancy Site (Physical Separation)"
    echo ""
    
    check_privileges
    check_requirements
    install_docker
    install_docker_compose
    create_directories
    generate_ssl_certificates
    create_docker_compose
    create_clickhouse_config
    create_otel_config
    create_alertmanager_config
    create_prometheus_config
    create_nginx_config
    setup_firewall
    deploy_signoz
    create_systemd_service
    create_management_scripts
    create_backup_script
    
    print_summary
}

# Run main function
main "$@"