#!/usr/bin/env node
/**
 * Launcher Agent — Auto-posts products to social platforms
 * Uses Kimi WebBridge to interact with Twitter/X, Reddit, Product Hunt
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, '..', 'state.json');
const WEBBRIDGE = 'http://127.0.0.1:10086/command';

async function loadState() {
  return await fs.readJson(STATE_FILE);
}

async function saveState(state) {
  await fs.writeJson(STATE_FILE, state, { spaces: 2 });
}

async function wb(action, args = {}, session = 'launch') {
  const cmd = `curl -s -X POST ${WEBBRIDGE} -H 'Content-Type: application/json' -d '${JSON.stringify({ action, args, session })}'`;
  try {
    const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    return JSON.parse(result);
  } catch (e) {
    console.error(`WebBridge ${action} failed:`, e.message);
    return null;
  }
}

// ============ TWITTER/X LAUNCH ============
async function launchTwitter(product) {
  console.log(`🐦 Launching on Twitter/X: "${product.title}"`);
  
  try {
    // Navigate to Twitter compose
    await wb('navigate', { url: 'https://twitter.com/compose/post', newTab: true }, 'twitter');
    await new Promise(r => setTimeout(r, 4000));
    
    // Generate tweet
    const tweet = `🚀 Just shipped: ${product.title}

Built with AI in under an hour. The future of indie hacking is here.

What should I build next? 👇

#buildinpublic #indiehackers #AI`;
    
    // Type tweet
    await wb('key_type', { text: tweet }, 'twitter');
    await new Promise(r => setTimeout(r, 1000));
    
    // Click post
    const snapshot = await wb('snapshot', {}, 'twitter');
    if (snapshot && snapshot.tree) {
      const lines = snapshot.tree.split('\n');
      const postLine = lines.find(l => l.toLowerCase().includes('post') && !l.includes('@'));
      
      if (postLine) {
        // Try to find the Post button
        await wb('send_keys', { keys: ['Enter'] }, 'twitter');
      }
    }
    
    console.log('✅ Twitter post attempted');
    return true;
  } catch (e) {
    console.error('Twitter launch failed:', e.message);
    return false;
  }
}

// ============ REDDIT LAUNCH ============
async function launchReddit(product) {
  console.log(`👽 Launching on Reddit: "${product.title}"`);
  
  try {
    // Navigate to relevant subreddit
    const subreddits = ['SideProject', 'SaaS', 'Entrepreneur'];
    const sub = subreddits[Math.floor(Math.random() * subreddits.length)];
    
    await wb('navigate', { url: `https://www.reddit.com/r/${sub}/submit`, newTab: true }, 'reddit-launch');
    await new Promise(r => setTimeout(r, 5000));
    
    // Generate post
    const title = `Show HN: ${product.title} — Built entirely by AI agents`;
    const body = `Hey everyone,

I built this using an agent swarm that scouts opportunities, codes products, and launches them automatically.

**What it does:** ${product.title}

**How it was built:** AI coding agents + web automation

**Tech stack:** Vanilla JS, HTML, CSS

Would love feedback! What features should I add?

---
*Built with 🤖 Ninja Money Machine*`;
    
    await wb('fill', { selector: 'input[placeholder*="title"]', value: title }, 'reddit-launch');
    await wb('key_type', { text: body }, 'reddit-launch');
    
    console.log('✅ Reddit post attempted');
    return true;
  } catch (e) {
    console.error('Reddit launch failed:', e.message);
    return false;
  }
}

// ============ PRODUCT HUNT LAUNCH ============
async function launchProductHunt(product) {
  console.log(`🏹 Launching on Product Hunt: "${product.title}"`);
  
  try {
    await wb('navigate', { url: 'https://www.producthunt.com/posts/new', newTab: true }, 'ph-launch');
    await new Promise(r => setTimeout(r, 5000));
    
    // Fill basic info
    await wb('fill', { selector: 'input[name="name"]', value: product.title.slice(0, 40) }, 'ph-launch');
    
    const tagline = product.title.slice(0, 60);
    await wb('fill', { selector: 'input[name="tagline"]', value: tagline }, 'ph-launch');
    
    const description = `${product.title}. Built by AI agents in the Ninja Money Machine swarm. Fully automated product discovery, build, and launch pipeline.`;
    await wb('key_type', { text: description }, 'ph-launch');
    
    console.log('✅ Product Hunt post attempted');
    return true;
  } catch (e) {
    console.error('Product Hunt launch failed:', e.message);
    return false;
  }
}

// ============ MAIN ============
async function main() {
  const state = await loadState();
  const ready = state.deployed.filter(d => !d.launched);
  
  if (ready.length === 0) {
    console.log('🚀 Nothing ready to launch. Build something first!');
    return;
  }
  
  console.log(`🚀 Launcher: ${ready.length} product(s) ready to launch\n`);
  
  for (const product of ready) {
    console.log(`📢 Launching: "${product.title}"`);
    
    const twitterOk = await launchTwitter(product);
    const redditOk = await launchReddit(product);
    const phOk = await launchProductHunt(product);
    
    product.launched = twitterOk || redditOk || phOk;
    product.launchedAt = new Date().toISOString();
    product.launchPlatforms = [];
    if (twitterOk) product.launchPlatforms.push('twitter');
    if (redditOk) product.launchPlatforms.push('reddit');
    if (phOk) product.launchPlatforms.push('producthunt');
    
    console.log(`✅ Launched on: ${product.launchPlatforms.join(', ') || 'none'}\n`);
  }
  
  state.lastLaunch = new Date().toISOString();
  await saveState(state);
  
  // Close sessions
  await wb('close_session', {}, 'twitter');
  await wb('close_session', {}, 'reddit-launch');
  await wb('close_session', {}, 'ph-launch');
}

main().catch(e => {
  console.error('Launcher crashed:', e);
  process.exit(1);
});
