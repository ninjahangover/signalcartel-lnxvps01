# QUANTUM FORGE™ Admin Scripts Directory

This directory contains all administrative scripts referenced in the **QUANTUM FORGE™ Administration Playbook**.

## 🚀 Quick Execution

All scripts mentioned in the admin playbook are consolidated here for faster execution:

### Core Trading Scripts
```bash
# Start position-managed trading (RECOMMENDED)
npx tsx admin-scripts/load-database-strategies.ts

# Legacy script (DEPRECATED - DO NOT USE)
npx tsx admin-scripts/custom-paper-trading.ts
```

### System Health & Monitoring
```bash
# System health overview
npx tsx admin-scripts/system-health-check.ts

# Manual monitoring check
npx tsx admin-scripts/openstatus-monitor-runner.ts

# Service management
./admin-scripts/openstatus-monitor-service.sh start|stop|status|logs|restart

# Database backup
./admin-scripts/simple-db-backup.sh
```

### Testing & Validation
```bash
# Test position management system
npx tsx admin-scripts/test-position-management.ts

# Test order book intelligence
npx tsx admin-scripts/test-order-book-validation.ts

# Verify all strategies
npx tsx admin-scripts/verify-all-strategies.ts
```

## 🎯 Usage

Run any script from the project root directory:
```bash
cd /home/telgkb9/depot/dev-signalcartel
npx tsx admin-scripts/[script-name].ts
```

## 📚 Documentation

For complete usage instructions and workflows, see:
- `QUANTUM-FORGE-ADMIN-PLAYBOOK.md` - Comprehensive admin guide
- `CLAUDE.md` - System architecture and context