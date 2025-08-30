# SignalCartel Professional PostgreSQL Backup System

This directory contains the **OFFICIAL** backup scripts for the SignalCartel QUANTUM FORGE™ trading platform.

## ✅ ACTIVE BACKUP SCRIPTS (Use These)

### Professional PostgreSQL Backup System
1. **postgresql-professional-backup.sh** - Enterprise-grade PostgreSQL backup using pg_dump/pg_dumpall
   - Logical backups (custom + SQL formats)
   - Cluster-wide backups with roles and global objects
   - Automatic integrity verification
   - 30-day retention policy

2. **setup-automated-postgresql-backups.sh** - Automated backup scheduling via cron
   - Hourly incremental backups
   - Daily full backups at midnight
   - Weekly deep backups on Sundays

### VMS Infrastructure Backups (For VMS deployments)
1. **vms-database-backup.sh** - VMS containerized PostgreSQL backup
2. **vms-database-backup-simple.sh** - Simplified VMS backup script
3. **setup-vms-automated-backups.sh** - VMS backup automation

## 📁 Backup Storage Location

Backups are stored in: `/home/telgkb9/signalcartel-enterprise-backups/`

Directory structure:
```
signalcartel-enterprise-backups/
├── YYYY-MM-DD/
│   ├── logical/     # pg_dump backups (.dump + .sql.gz)
│   ├── cluster/     # pg_dumpall cluster-wide backups
│   └── physical/    # pg_basebackup physical backups
```

## 🕐 Automated Backup Schedule

Current cron schedule:
- **Every Hour**: Incremental logical + cluster backup
- **Daily (Midnight)**: Full comprehensive backup  
- **Weekly (Sunday 3AM)**: Deep backup with full analysis

## 🔧 Manual Backup Commands

```bash
# Run immediate backup
./scripts/backup/postgresql-professional-backup.sh

# Run full comprehensive backup
./scripts/backup/postgresql-professional-backup.sh full

# Check backup status
ls -la /home/telgkb9/signalcartel-enterprise-backups/
```

## 📊 Monitoring

Check backup logs at:
- `/tmp/signalcartel-postgresql-backup.log` (hourly)
- `/tmp/signalcartel-postgresql-backup-full.log` (daily)
- `/tmp/signalcartel-postgresql-backup-weekly.log` (weekly)

## ⚠️ DEPRECATED SCRIPTS

Old backup scripts have been moved to `./deprecated/` folder. DO NOT USE THESE:
- enterprise-backup-system.sh ❌
- simple-db-backup.sh ❌  
- database-backup.sh ❌
- simple-backup.sh ❌

**Always use the professional PostgreSQL backup system for production.**