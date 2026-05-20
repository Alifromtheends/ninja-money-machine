#!/usr/bin/env node
/**
 * Ninja Money Machine — Orchestrator
 * Coordinates the agent swarm: Scout → Builder → Launcher → Tracker
 */

const cron = require('node-cron');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');
const LOG_FILE = path.join(__dirname, 'tracker', 'operations.log');

// Default state
const defaultState = {
  opportunities: [],      // Found by Scout
  inBuild: [],            // Currently building
  deployed: [],           // Live products
  revenue: 0,             // Tracked revenue
  lastScout: null,
  lastBuild: null,
  lastLaunch: null
};

async function loadState() {
  if (await fs.pathExists(STATE_FILE)) {
    return await fs.readJson(STATE_FILE);
  }
  return { ...defaultState };
}

async function saveState(state) {
  await fs.writeJson(STATE_FILE, state, { spaces: 2 });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

// ============ SCOUT PHASE ============
async function runScout() {
  log('🕵️  SCOUT: Hunting for opportunities...');
  try {
    const result = execSync('node agents/scout.js', { 
      cwd: __dirname, 
      encoding: 'utf8',
      timeout: 300000 
    });
    log('🕵️  SCOUT: ' + result.trim().split('\n').pop());
  } catch (e) {
    log('🕵️  SCOUT ERROR: ' + e.message);
  }
}

// ============ BUILD PHASE ============
async function runBuilder() {
  const state = await loadState();
  const opportunities = state.opportunities.filter(o => !o.built && !o.rejected);
  
  if (opportunities.length === 0) {
    log('🔨 BUILDER: No opportunities to build. Scout first.');
    return;
  }

  // Pick the highest-scored opportunity
  const target = opportunities.sort((a, b) => b.score - a.score)[0];
  log(`🔨 BUILDER: Building "${target.title}" (score: ${target.score})`);

  try {
    const result = execSync(`node agents/builder.js "${target.id}"`, {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 600000
    });
    log('🔨 BUILDER: ' + result.trim().split('\n').pop());
  } catch (e) {
    log('🔨 BUILDER ERROR: ' + e.message);
  }
}

// ============ LAUNCH PHASE ============
async function runLauncher() {
  const state = await loadState();
  const ready = state.deployed.filter(d => !d.launched);
  
  if (ready.length === 0) {
    log('🚀 LAUNCHER: Nothing ready to launch.');
    return;
  }

  log(`🚀 LAUNCHER: Launching ${ready.length} product(s)...`);
  try {
    const result = execSync('node agents/launcher.js', {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 300000
    });
    log('🚀 LAUNCHER: ' + result.trim().split('\n').pop());
  } catch (e) {
    log('🚀 LAUNCHER ERROR: ' + e.message);
  }
}

// ============ TRACKER PHASE ============
async function runTracker() {
  log('📊 TRACKER: Updating dashboard...');
  try {
    execSync('node tracker/dashboard.js', {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 30000
    });
  } catch (e) {
    // Dashboard errors are non-fatal
  }
}

// ============ MAIN CYCLES ============
async function cycle() {
  log('========== NINJA MONEY MACHINE CYCLE ==========');
  await runScout();
  await runBuilder();
  await runLauncher();
  await runTracker();
  log('========== CYCLE COMPLETE ==========\n');
}

// CLI mode
const command = process.argv[2];
if (command === 'once') {
  cycle().then(() => process.exit(0));
} else if (command === 'scout') {
  runScout().then(() => process.exit(0));
} else if (command === 'build') {
  runBuilder().then(() => process.exit(0));
} else if (command === 'launch') {
  runLauncher().then(() => process.exit(0));
} else if (command === 'tracker') {
  runTracker().then(() => process.exit(0));
} else {
  // Daemon mode — run every hour
  log('🥷 Ninja Money Machine started in DAEMON mode');
  log('Cycles every hour. Press Ctrl+C to stop.');
  
  // Run immediately
  cycle();
  
  // Then every hour
  cron.schedule('0 * * * *', cycle);
}
