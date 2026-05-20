#!/usr/bin/env node
/**
 * Scout Agent — Hunts for business opportunities using WebBridge + web scraping
 * Sources: Reddit, Product Hunt, Hacker News, Twitter/X, IndieHackers
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, '..', 'state.json');
const WEBBRIDGE = 'http://127.0.0.1:10086/command';

// Opportunity scoring rubric
function scoreOpportunity(title, upvotes, comments, category) {
  let score = 0;
  
  // Engagement score (0-40)
  score += Math.min(upvotes / 100, 40);
  
  // Discussion score (0-20)
  score += Math.min(comments / 50, 20);
  
  // Category bonus (0-40)
  const hotCategories = {
    'developer tools': 35,
    'productivity': 30,
    'automation': 35,
    'ai': 40,
    'api': 30,
    'saas': 25,
    'chrome extension': 30,
    'bot': 28,
    'open source': 20,
    'tutorial': 15
  };
  
  for (const [cat, bonus] of Object.entries(hotCategories)) {
    if (title.toLowerCase().includes(cat) || (category && category.toLowerCase().includes(cat))) {
      score += bonus;
      break;
    }
  }
  
  return Math.round(score);
}

// Call WebBridge
async function wb(action, args = {}, session = 'scout') {
  const cmd = `curl -s -X POST ${WEBBRIDGE} -H 'Content-Type: application/json' -d '${JSON.stringify({ action, args, session })}'`;
  try {
    const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    return JSON.parse(result);
  } catch (e) {
    console.error(`WebBridge ${action} failed:`, e.message);
    return null;
  }
}

// ============ REDDIT SCOUTING ============
async function scoutReddit() {
  console.log('🔍 Scouting Reddit...');
  const results = [];
  
  const subreddits = [
    'SideProject',
    'SaaS',
    ' Entrepreneur',
    'programming',
    'webdev',
    'startups',
    'indiehackers',
    'LocalLLaMA',
    'machinelearning',
    'OpenAI'
  ];
  
  for (const sub of subreddits) {
    try {
      await wb('navigate', { url: `https://www.reddit.com/r/${sub}/hot/`, newTab: true }, 'reddit');
      await new Promise(r => setTimeout(r, 3000)); // Let page load
      
      const snapshot = await wb('snapshot', {}, 'reddit');
      if (!snapshot || !snapshot.tree) continue;
      
      // Parse posts from accessibility tree
      const posts = snapshot.tree.split('\n').filter(line => line.includes('upvote') || line.includes('points'));
      
      for (const post of posts.slice(0, 5)) {
        const title = post.replace(/\d+\s*(upvotes?|points?)/, '').trim();
        const upvotes = parseInt(post.match(/(\d+)\s*(upvotes?|points?)/)?.[1] || '0');
        
        if (title.length > 10 && upvotes > 50) {
          const score = scoreOpportunity(title, upvotes, upvotes / 3, sub);
          if (score > 50) {
            results.push({
              id: `reddit-${sub}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'reddit',
              subreddit: sub,
              title,
              url: `https://reddit.com/r/${sub}`,
              upvotes,
              comments: Math.floor(upvotes / 3),
              score,
              timestamp: new Date().toISOString(),
              built: false,
              rejected: false,
              launched: false
            });
          }
        }
      }
    } catch (e) {
      console.error(`Reddit ${sub} failed:`, e.message);
    }
  }
  
  return results;
}

// ============ PRODUCT HUNT SCOUTING ============
async function scoutProductHunt() {
  console.log('🔍 Scouting Product Hunt...');
  const results = [];
  
  try {
    await wb('navigate', { url: 'https://www.producthunt.com/', newTab: true }, 'ph');
    await new Promise(r => setTimeout(r, 4000));
    
    const snapshot = await wb('snapshot', {}, 'ph');
    if (!snapshot || !snapshot.tree) return results;
    
    const lines = snapshot.tree.split('\n').filter(l => l.trim().length > 5);
    
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      // Look for product names + vote counts
      if (line.includes('upvote') || line.match(/\d+\s*votes?/)) {
        const votes = parseInt(line.match(/(\d+)\s*votes?/)?.[1] || '0');
        const title = lines[i - 1] || lines[i + 1] || 'Unknown Product';
        
        if (title.length > 5 && votes > 20) {
          const score = scoreOpportunity(title, votes, votes * 2, 'saas');
          if (score > 45) {
            results.push({
              id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'producthunt',
              title: title.trim().slice(0, 100),
              url: 'https://producthunt.com',
              upvotes: votes,
              comments: votes * 2,
              score,
              timestamp: new Date().toISOString(),
              built: false,
              rejected: false,
              launched: false
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Product Hunt failed:', e.message);
  }
  
  return results;
}

// ============ HACKER NEWS SCOUTING ============
async function scoutHN() {
  console.log('🔍 Scouting Hacker News...');
  const results = [];
  
  try {
    await wb('navigate', { url: 'https://news.ycombinator.com/', newTab: true }, 'hn');
    await new Promise(r => setTimeout(r, 3000));
    
    const snapshot = await wb('snapshot', {}, 'hn');
    if (!snapshot || !snapshot.tree) return results;
    
    // HN structure is simpler — titles are prominent
    const lines = snapshot.tree.split('\n').filter(l => l.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for score patterns (e.g., "123 points")
      const match = line.match(/(\d+)\s*points?/);
      if (match) {
        const points = parseInt(match[1]);
        const title = lines[i - 1] || 'Unknown';
        const comments = parseInt((lines[i + 1] || '').match(/(\d+)\s*comments?/)?.[1] || '0');
        
        if (title.length > 10 && points > 30) {
          const score = scoreOpportunity(title, points, comments, 'tech');
          if (score > 40) {
            results.push({
              id: `hn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              source: 'hackernews',
              title: title.trim().slice(0, 100),
              url: 'https://news.ycombinator.com',
              upvotes: points,
              comments,
              score,
              timestamp: new Date().toISOString(),
              built: false,
              rejected: false,
              launched: false
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('HN failed:', e.message);
  }
  
  return results;
}

// ============ AI ANALYSIS OF OPPORTUNITIES ============
async function analyzeWithAI(opportunities) {
  // For now, simple heuristics. In v2, we could call an LLM API.
  return opportunities.map(o => {
    // Boost score for action-oriented titles
    const actionWords = ['tool', 'app', 'generator', 'automation', 'bot', 'api', 'builder', 'creator'];
    const hasAction = actionWords.some(w => o.title.toLowerCase().includes(w));
    
    if (hasAction) {
      o.score += 15;
      o.recommendedBuild = 'micro-saas';
    } else {
      o.recommendedBuild = 'chrome-extension';
    }
    
    // Cap at 100
    o.score = Math.min(o.score, 100);
    
    return o;
  }).sort((a, b) => b.score - a.score);
}

// ============ MAIN ============
async function main() {
  console.log('🕵️  Ninja Scout Agent starting...');
  
  let state = { opportunities: [] };
  if (await fs.pathExists(STATE_FILE)) {
    state = await fs.readJson(STATE_FILE);
  }
  
  // Scout all sources
  const redditOps = await scoutReddit();
  const phOps = await scoutProductHunt();
  const hnOps = await scoutHN();
  
  const allNew = [...redditOps, ...phOps, ...hnOps];
  console.log(`Found ${allNew.length} raw opportunities`);
  
  if (allNew.length === 0) {
    console.log('⚠️  No opportunities found. WebBridge may need manual help.');
    // Fallback: use curated seed opportunities
    const seedOpportunities = [
      {
        id: `seed-ai-automation-${Date.now()}`,
        source: 'seed',
        title: 'AI-powered social media content scheduler with auto-hashtag generation',
        url: 'https://example.com',
        upvotes: 200,
        comments: 80,
        score: 85,
        recommendedBuild: 'micro-saas',
        timestamp: new Date().toISOString(),
        built: false,
        rejected: false,
        launched: false
      },
      {
        id: `seed-dev-tool-${Date.now()}`,
        source: 'seed',
        title: 'Browser extension that summarizes any webpage in 3 bullet points',
        url: 'https://example.com',
        upvotes: 350,
        comments: 120,
        score: 90,
        recommendedBuild: 'chrome-extension',
        timestamp: new Date().toISOString(),
        built: false,
        rejected: false,
        launched: false
      },
      {
        id: `seed-productivity-${Date.now()}`,
        source: 'seed',
        title: 'Voice-to-text meeting notes with action item extraction',
        url: 'https://example.com',
        upvotes: 180,
        comments: 65,
        score: 78,
        recommendedBuild: 'micro-saas',
        timestamp: new Date().toISOString(),
        built: false,
        rejected: false,
        launched: false
      }
    ];
    allNew.push(...seedOpportunities);
  }
  
  // Analyze
  const analyzed = await analyzeWithAI(allNew);
  
  // Merge with existing (dedupe by title similarity)
  const existingTitles = state.opportunities.map(o => o.title.toLowerCase());
  const uniqueNew = analyzed.filter(o => !existingTitles.some(et => et.includes(o.title.toLowerCase().slice(0, 20))));
  
  state.opportunities = [...state.opportunities, ...uniqueNew];
  state.lastScout = new Date().toISOString();
  
  await fs.writeJson(STATE_FILE, state, { spaces: 2 });
  
  console.log(`\n✅ Scout complete: ${uniqueNew.length} new opportunities`);
  console.log(`📊 Total opportunities: ${state.opportunities.length}`);
  console.log(`🏆 Top opportunity: "${analyzed[0]?.title || 'N/A'}" (score: ${analyzed[0]?.score || 0})`);
  
  // Close WebBridge sessions
  await wb('close_session', {}, 'reddit');
  await wb('close_session', {}, 'ph');
  await wb('close_session', {}, 'hn');
}

main().catch(e => {
  console.error('Scout crashed:', e);
  process.exit(1);
});
