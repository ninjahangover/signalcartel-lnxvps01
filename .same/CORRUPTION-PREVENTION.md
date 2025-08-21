# File Corruption Prevention System

## 🔍 Root Cause Analysis

**Problem:** Mass file corruption during deployment at 04:00:28
- Multiple files truncated to 0 bytes simultaneously
- Pattern indicates filesystem corruption during extraction/deployment
- Race condition between file operations and Next.js/Turbopack processes

## 🛡️ Prevention System

### 1. Safe File Operations (`safe-file-ops.sh`)
- Atomic file operations with backups
- Integrity verification before/after edits
- Dev server conflict detection
- Filesystem health monitoring

### 2. Real-time Monitoring (`monitor-files.sh`)
- Checksum-based integrity tracking
- Automated corruption detection
- Auto-restore from timestamped backups
- Real-time file watching

### 3. Safe Development Workflow (`safe-dev.sh`)
- Pre-development integrity checks
- Coordinated dev server management
- Background file monitoring
- Safe build processes
- Emergency restore procedures

## 📋 Usage Instructions

### Daily Development Workflow
```bash
# 1. Check system health before starting
./.same/safe-dev.sh check

# 2. Start safe development environment
./.same/safe-dev.sh start

# 3. Build safely when needed
./.same/safe-dev.sh build

# 4. Check status anytime
./.same/safe-dev.sh status
```

### Emergency Procedures
```bash
# If corruption detected
./.same/safe-dev.sh restore

# Check file integrity manually
./.same/monitor-files.sh check

# Create fresh baseline after fixes
./.same/monitor-files.sh baseline
```

### Deployment Preparation
```bash
# 1. Stop all processes
./.same/safe-dev.sh stop

# 2. Final integrity check
./.same/monitor-files.sh check

# 3. Create deployment backup
./.same/monitor-files.sh backup

# 4. Build for production
./.same/safe-dev.sh build
```

## 🎯 Key Prevention Strategies

### 1. **Process Coordination**
- Always stop dev servers before file operations
- No concurrent access to files during edits
- Proper cleanup on exit

### 2. **Backup Strategy**
- Timestamped backups before any changes
- Multiple restore points available
- Automated backup during safe workflow

### 3. **Integrity Monitoring**
- SHA256 checksums for critical files
- Real-time corruption detection
- Size validation (0-byte detection)
- Syntax validation for code files

### 4. **Filesystem Health**
- Disk space monitoring
- Inode usage tracking
- Permission verification

## 📁 File Structure
```
.same/
├── safe-file-ops.sh       # Atomic file operations
├── monitor-files.sh       # Integrity monitoring
├── safe-dev.sh           # Development workflow
├── file-checksums.txt    # Integrity baselines
├── backups/              # Timestamped backups
└── CORRUPTION-PREVENTION.md # This document
```

## 🚨 Warning Signs
- Any file showing 0 bytes
- Dev server startup during file operations
- Disk usage above 90%
- Multiple processes accessing same files
- Filesystem errors in logs

## 🔧 Recovery Procedures

### Automatic Recovery
1. Corruption detected by monitoring
2. Auto-restore from latest backup
3. Integrity verification
4. Continue development

### Manual Recovery
1. Stop all processes: `./.same/safe-dev.sh stop`
2. Check integrity: `./.same/monitor-files.sh check`
3. Restore files: `./.same/monitor-files.sh restore`
4. Verify recovery: `./.same/monitor-files.sh check`
5. Restart safely: `./.same/safe-dev.sh start`

## 📊 Monitoring Dashboard
```bash
# Quick status check
./.same/safe-dev.sh status

# Detailed integrity report
./.same/monitor-files.sh status

# Filesystem health
./.same/safe-file-ops.sh health
```

## 🎯 Best Practices
1. **Always use safe workflow scripts**
2. **Never start dev server during file operations**
3. **Check integrity before important work**
4. **Create backups before major changes**
5. **Monitor logs for filesystem errors**
6. **Use atomic operations for critical files**

This system prevents the root cause of corruption rather than just fixing symptoms.
