# 📊 How to Import SigNoz Dashboards - Step by Step

## 🎯 **Method 1: SigNoz UI Import (Recommended)**

### Step 1: Access SigNoz Dashboard
1. Open your browser and go to: **http://localhost:3301**
2. Login with:
   - **Email:** gaylen@signalcartel.io
   - **Password:** admin123

### Step 2: Navigate to Dashboard Import
1. In the SigNoz interface, look for the **left sidebar**
2. Click on **"Dashboards"** (📊 icon)
3. Click the **"+ New Dashboard"** button or **"Import"** button
4. If you see **"Import Dashboard"** option, click it

### Step 3: Import Each Dashboard File

**You need to import these 3 files:**
- `scripts/monitoring/signoz-configs/quantum-forge-dashboard.json`
- `scripts/monitoring/signoz-configs/ai-systems-dashboard.json` 
- `scripts/monitoring/signoz-configs/infrastructure-dashboard.json`

**For each file:**
1. Click **"Browse"** or **"Choose File"** button
2. Navigate to your SignalCartel directory
3. Go to `scripts/monitoring/signoz-configs/`
4. Select the JSON file
5. Click **"Import"** or **"Upload"**

### Step 4: Verify Import
After importing, you should see:
- **QUANTUM FORGE™ Trading Performance** dashboard
- **AI Systems Performance** dashboard  
- **Infrastructure Health** dashboard

---

## 🎯 **Method 2: Manual Dashboard Creation (If Import Doesn't Work)**

If the import feature isn't available in your SigNoz version, you can create dashboards manually:

### Step 1: Create New Dashboard
1. Go to **Dashboards** → **"+ New Dashboard"**
2. Give it a name (e.g., "QUANTUM FORGE Trading")
3. Click **"Create"**

### Step 2: Add Panels Using Our Queries
I'll show you the key queries to add as panels:

**For Trading Performance Dashboard:**
1. Click **"+ Add Panel"**
2. Select **"Time Series"** or **"Graph"**
3. In the query field, enter: `rate(trades_executed_total[1h]) * 3600`
4. Set title: "Trades Per Hour"
5. Click **"Save"**

**For AI Systems Dashboard:**
1. Add panel with query: `histogram_quantile(0.95, ai_response_time_ms) by (ai_system)`
2. Title: "AI Response Times (P95)"

**For Infrastructure Dashboard:**
1. Add panel with query: `histogram_quantile(0.99, database_query_latency_ms)`
2. Title: "Database Latency (P99)"

---

## 🎯 **Method 3: Copy-Paste JSON Content**

If file upload doesn't work, you can copy-paste the JSON:

### Step 1: View Dashboard JSON Content
```bash
# Show the content of each dashboard file
cat scripts/monitoring/signoz-configs/quantum-forge-dashboard.json
```

### Step 2: Create Dashboard from JSON
1. In SigNoz, look for **"Import from JSON"** option
2. Paste the entire JSON content
3. Click **"Load"** or **"Import"**

---

## 🎯 **Method 4: Direct API Import (Advanced)**

For automated import or if UI methods fail:

### Step 1: Use SigNoz API
```bash
# Import via API (replace with your SigNoz URL)
SIGNOZ_URL="https://monitor.pixelraidersystems.com"

# Import quantum-forge dashboard
curl -X POST "${SIGNOZ_URL}/api/v1/dashboards" \
  -H "Content-Type: application/json" \
  -d @scripts/monitoring/signoz-configs/quantum-forge-dashboard.json

# Import AI systems dashboard  
curl -X POST "${SIGNOZ_URL}/api/v1/dashboards" \
  -H "Content-Type: application/json" \
  -d @scripts/monitoring/signoz-configs/ai-systems-dashboard.json

# Import infrastructure dashboard
curl -X POST "${SIGNOZ_URL}/api/v1/dashboards" \
  -H "Content-Type: application/json" \
  -d @scripts/monitoring/signoz-configs/infrastructure-dashboard.json
```

---

## 🔍 **Troubleshooting Dashboard Import**

### Issue: "Import" Button Not Found
**SigNoz UI varies by version. Try these locations:**
- **Dashboards** → **"+"** → **"Import"**
- **Dashboards** → **"New"** → **"Import Dashboard"**  
- **Settings** → **"Import/Export"** → **"Import Dashboard"**

### Issue: Import Fails with Error
**Try this alternative:**
1. Create a new blank dashboard
2. Add panels manually using our pre-written queries
3. Use the queries from the JSON files

### Issue: No Dashboards Menu
**Your SigNoz might be a different version:**
1. Look for **"Monitoring"**, **"Observability"**, or **"Analytics"**
2. Check the top navigation bar
3. Look for a **"+"** button anywhere in the interface

---

## 📋 **Dashboard Import Checklist**

- [ ] SigNoz accessible at http://localhost:3301
- [ ] Logged in with gaylen@signalcartel.io / admin123
- [ ] Found the Dashboards section
- [ ] Located Import or New Dashboard option
- [ ] Successfully imported quantum-forge-dashboard.json
- [ ] Successfully imported ai-systems-dashboard.json  
- [ ] Successfully imported infrastructure-dashboard.json
- [ ] Can see all 3 dashboards in the dashboard list
- [ ] Dashboards display properly (even if no data yet)

---

## 🎯 **What You Should See After Import**

### QUANTUM FORGE™ Trading Performance Dashboard:
- Current Trading Phase indicator
- Trades Per Hour chart
- Win Rate by Strategy pie chart  
- Cumulative P&L display

### AI Systems Performance Dashboard:
- AI Response Times graph
- AI Confidence Levels gauge
- Sentiment Score timeline

### Infrastructure Health Dashboard:
- Database Latency chart
- System Resources (Memory/CPU) 
- Active Strategies counter

**Note:** Dashboards might be empty initially until you start SignalCartel with telemetry enabled!

---

## 🚀 **Next Steps After Import**

1. **Start monitoring:** `./scripts/monitoring/start-with-signoz.sh`
2. **Wait 2-3 minutes** for data to flow
3. **Refresh dashboards** to see live metrics
4. **Set up alerts** using `scripts/monitoring/signoz-configs/alerts.json`

---

**Need help?** The dashboard JSON files are in `scripts/monitoring/signoz-configs/` and contain all the panel configurations ready to import!