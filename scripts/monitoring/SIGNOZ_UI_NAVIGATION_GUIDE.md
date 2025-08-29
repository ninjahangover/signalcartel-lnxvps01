# 🧭 SigNoz UI Navigation Guide

## 🎯 **Quick Access**
- **URL**: https://monitor.pixelraidersystems.com
- **Login**: gaylen@signalcartel.io / admin123

---

## 📊 **Main Navigation Areas**

### **Left Sidebar Navigation:**
```
📊 Services          <- View all monitored applications
📈 Metrics           <- Custom metric queries and exploration  
🔍 Traces            <- Distributed tracing and spans
📋 Logs              <- Log aggregation and search
📊 Dashboards        <- Custom dashboards (IMPORT HERE)
🚨 Alerts            <- Alert rules and notifications
⚙️  Settings          <- Configuration and users
```

---

## 📊 **Dashboard Import Location**

### **Step-by-Step UI Path:**
1. **Login** to SigNoz at https://monitor.pixelraidersystems.com
2. Click **"📊 Dashboards"** in the left sidebar
3. Look for **"+ New Dashboard"** button (top-right area)
4. Click the **dropdown arrow** next to "New Dashboard"  
5. Select **"Import Dashboard"** from dropdown menu

### **Alternative Paths if Above Doesn't Work:**
- **Path A**: Dashboards → "Import" button (may be separate button)
- **Path B**: Dashboards → "+" icon → "Import from file"
- **Path C**: Settings → Import/Export → Dashboard Import
- **Path D**: Dashboards → "⚙️" gear icon → Import

---

## 🎛️ **Dashboard Import Interface**

### **What You'll See:**
```
┌─────────────────────────────────────┐
│  Import Dashboard                   │
├─────────────────────────────────────┤
│                                     │
│  [Browse Files] [Choose File]       │
│  Drag and drop JSON file here       │
│                                     │
│  Or paste JSON content below:       │
│  ┌─────────────────────────────────┐ │
│  │                                 │ │
│  │  {...paste JSON here...}       │ │  
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│           [Import]  [Cancel]        │
└─────────────────────────────────────┘
```

### **Files to Import (in order):**
1. **quantum-forge-dashboard.json** → Creates "QUANTUM FORGE™ Trading Performance"
2. **ai-systems-dashboard.json** → Creates "AI Systems Performance"  
3. **infrastructure-dashboard.json** → Creates "Infrastructure Health"

---

## 📈 **After Import - Dashboard Locations**

### **Finding Your Imported Dashboards:**
1. Go to **📊 Dashboards** in sidebar
2. Look for these dashboard names:
   - **QUANTUM FORGE™ Trading Performance**
   - **AI Systems Performance** 
   - **Infrastructure Health**

### **Dashboard Features You'll See:**
- **Quantum Forge Dashboard**:
  - Current Trading Phase indicator
  - Trades Per Hour chart
  - Win Rate by Strategy pie chart
  - Cumulative P&L timeline

- **AI Systems Dashboard**:
  - AI Response Times (P95/P99)
  - AI Confidence Levels gauge  
  - Multi-source Sentiment timeline
  - Mathematical Intuition metrics

- **Infrastructure Dashboard**:
  - Database Query Latency (P95/P99)
  - Memory/CPU usage graphs
  - Active Strategies counter
  - System health indicators

---

## 🚨 **Alert Setup Location**

### **Setting Up Alerts:**
1. Click **🚨 Alerts** in left sidebar
2. Click **"+ New Alert"** button
3. **Import our pre-configured alerts**:
   - Copy content from `scripts/monitoring/signoz-configs/alerts.json`
   - Paste into alert creation form

### **Alert Categories We've Pre-configured:**
- **Critical**: Low Trading Volume, Database Down
- **High**: High Latency, AI System Failures
- **Medium**: Memory Usage, Win Rate Below Target

---

## 🔧 **Settings Areas**

### **Important Settings Sections:**
- **🔔 Notification Channels**: Set up email/Slack alerts
- **👥 Users**: Manage access (change password here)
- **🔗 Integrations**: External service connections
- **📊 Data Sources**: Verify data ingestion

---

## 🧪 **Testing Dashboard Data**

### **Verify Dashboards Work:**
1. **Start SignalCartel with monitoring**:
   ```bash
   ./scripts/monitoring/start-with-signoz.sh
   ```

2. **Wait 2-3 minutes** for data to flow

3. **Refresh dashboards** - you should see:
   - Real trading metrics
   - Live AI performance data  
   - Database performance graphs
   - System resource usage

### **No Data? Check These:**
- ✅ SigNoz containers running: `docker ps | grep signoz`
- ✅ OTEL endpoints accessible: `curl http://localhost:4318/v1/traces`
- ✅ SignalCartel running with telemetry enabled
- ✅ Environment variables set correctly

---

## 📱 **Mobile/Responsive Access**

SigNoz works on mobile devices:
- **Portrait mode**: Stacked dashboard panels
- **Landscape mode**: Side-by-side layout
- **Touch navigation**: Swipe between dashboards
- **Zoom support**: Pinch to zoom on graphs

---

## 🎨 **Customization Options**

### **After Import, You Can:**
- **Edit panel queries**: Modify PromQL queries
- **Adjust time ranges**: Change from 1h to 24h, etc.
- **Rename dashboards**: Click pencil icon next to name
- **Add new panels**: Use "+" button on dashboard
- **Export dashboards**: Download as JSON for backup

---

## 🚀 **Quick Success Verification**

### **You'll Know It Worked When:**
- ✅ 3 dashboards appear in dashboard list
- ✅ Panels show "No Data" initially (normal)
- ✅ After starting trading: Live metrics appear  
- ✅ Graphs update every few seconds
- ✅ AI confidence levels show 60%+ values
- ✅ Database latency shows <50ms typically

---

🎉 **You're now ready to monitor your QUANTUM FORGE™ trading system with enterprise-grade observability!**