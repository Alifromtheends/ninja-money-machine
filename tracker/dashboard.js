#!/usr/bin/env node
/**
 * Tracker Dashboard — Generates HTML dashboard showing machine status
 */

const fs = require('fs-extra');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'state.json');
const DASHBOARD_FILE = path.join(__dirname, 'dashboard.html');

async function loadState() {
  if (await fs.pathExists(STATE_FILE)) {
    return await fs.readJson(STATE_FILE);
  }
  return { opportunities: [], deployed: [], revenue: 0 };
}

function generateDashboard(state) {
  const totalOpp = state.opportunities?.length || 0;
  const built = state.deployed?.length || 0;
  const launched = state.deployed?.filter(d => d.launched)?.length || 0;
  const revenue = state.revenue || 0;
  const monetizationActive = state.monetization?.active || false;
  const priceIdsConfigured = (state.monetization?.products || 0) > 0;
  const lastScout = state.lastScout || 'Never';
  const lastBuild = state.lastBuild || 'Never';
  const lastLaunch = state.lastLaunch || 'Never';
  
  const topOpportunities = (state.opportunities || [])
    .filter(o => !o.built && !o.rejected)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);
  
  const recentDeployed = (state.deployed || [])
    .sort((a, b) => new Date(b.builtAt || 0) - new Date(a.builtAt || 0))
    .slice(0, 5);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🥷 Ninja Money Machine — Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 40px 20px;
      text-align: center;
      border-bottom: 2px solid #00ff88;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(0,255,136,0.3);
    }
    .header p {
      color: #888;
      font-size: 1.1em;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .stat-card {
      background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
      border-radius: 12px;
      padding: 25px;
      text-align: center;
      border: 1px solid rgba(0,255,136,0.2);
      transition: transform 0.3s;
    }
    .stat-card:hover {
      transform: translateY(-5px);
      border-color: #00ff88;
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: bold;
      color: #00ff88;
      margin: 10px 0;
    }
    .stat-label {
      color: #888;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 30px 30px;
    }
    .section h2 {
      color: #00ff88;
      margin-bottom: 20px;
      font-size: 1.5em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .opportunity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .opportunity-item {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 18px 20px;
      border-left: 3px solid #00ff88;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .opportunity-item .title {
      font-weight: 500;
      font-size: 1.05em;
    }
    .opportunity-item .meta {
      color: #666;
      font-size: 0.85em;
      margin-top: 4px;
    }
    .score-badge {
      background: linear-gradient(135deg, #00ff88, #00cc6a);
      color: #0a0a0a;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.9em;
    }
    .deployed-item {
      border-left-color: #ff6b6b;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }
    .status-built {
      background: #ffd93d;
      color: #0a0a0a;
    }
    .status-launched {
      background: #00ff88;
      color: #0a0a0a;
    }
    .footer {
      text-align: center;
      padding: 40px;
      color: #555;
      border-top: 1px solid #222;
    }
    .auto-refresh {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #00ff88;
      color: #0a0a0a;
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: bold;
      cursor: pointer;
      border: none;
    }
    .timeline {
      display: flex;
      gap: 30px;
      justify-content: center;
      padding: 20px;
      flex-wrap: wrap;
    }
    .timeline-item {
      text-align: center;
    }
    .timeline-item .time {
      color: #00ff88;
      font-family: monospace;
    }
  </style>
  <meta http-equiv="refresh" content="30">
</head>
<body>
  <div class="header">
    <h1>🥷 Ninja Money Machine <span style="display:inline-block;padding:4px 14px;background:linear-gradient(135deg,#00ff88,#00cc6a);color:#0a0a0a;border-radius:20px;font-size:14px;font-weight:700;margin-left:12px;vertical-align:middle;">💰 MONETIZED</span></h1>
    <p>AI-Powered Business Factory — Autonomous Opportunity → Build → Launch Pipeline</p>
  </div>
  
  <div class="timeline">
    <div class="timeline-item">
      <div>Last Scout</div>
      <div class="time">${lastScout}</div>
    </div>
    <div class="timeline-item">
      <div>Last Build</div>
      <div class="time">${lastBuild}</div>
    </div>
    <div class="timeline-item">
      <div>Last Launch</div>
      <div class="time">${lastLaunch}</div>
    </div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Opportunities Found</div>
      <div class="stat-number">${totalOpp}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Products Built</div>
      <div class="stat-number">${built}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Launched</div>
      <div class="stat-number">${launched}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Revenue Tracked</div>
      <div class="stat-number">$${revenue}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>🎯 Top Opportunities (Ready to Build)</h2>
    <div class="opportunity-list">
      ${topOpportunities.length > 0 ? topOpportunities.map(o => `
      <div class="opportunity-item">
        <div>
          <div class="title">${o.title}</div>
          <div class="meta">Source: ${o.source} | Type: ${o.recommendedBuild || 'micro-saas'}</div>
        </div>
        <div class="score-badge">${o.score}/100</div>
      </div>
      `).join('') : '<div style="color: #666; text-align: center; padding: 20px;">No opportunities yet. Run the scout agent!</div>'}
    </div>
  </div>
  
  <div class="section">
    <h2>🚀 Recently Built</h2>
    <div class="opportunity-list">
      ${recentDeployed.length > 0 ? recentDeployed.map(d => `
      <div class="opportunity-item deployed-item">
        <div>
          <div class="title">${d.title}</div>
          <div class="meta">Built: ${d.builtAt || 'N/A'} | ${d.launchPlatforms?.join(', ') || 'Not launched'}</div>
        </div>
        <div class="status-badge ${d.launched ? 'status-launched' : 'status-built'}">${d.launched ? 'LIVE' : 'BUILT'}</div>
      </div>
      `).join('') : '<div style="color: #666; text-align: center; padding: 20px;">No products built yet. Run the builder agent!</div>'}
    </div>
  </div>
  
  <div class="footer">
    <p>🥷 Built by Ninja for Lia | Auto-refreshes every 30 seconds</p>
  </div>
  
  <button class="auto-refresh" onclick="location.reload()">🔄 Refresh Now</button>
</body>
</html>`;
}

async function main() {
  const state = await loadState();
  const html = generateDashboard(state);
  
  await fs.writeFile(DASHBOARD_FILE, html);
  
  console.log(`📊 Dashboard generated: ${DASHBOARD_FILE}`);
  console.log(`   Open in browser: open ${DASHBOARD_FILE}`);
}

main().catch(e => {
  console.error('Tracker error:', e);
  process.exit(1);
});
