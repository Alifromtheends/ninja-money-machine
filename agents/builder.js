#!/usr/bin/env node
/**
 * Builder Agent — Uses Claude Code & Pi to build MVPs from scout opportunities
 * Spawns coding agents to create micro-products
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const STATE_FILE = path.join(__dirname, '..', 'state.json');
const DEPLOYED_DIR = path.join(__dirname, '..', 'deployed');

// Read opportunity ID from CLI
const targetId = process.argv[2];

async function loadState() {
  return await fs.readJson(STATE_FILE);
}

async function saveState(state) {
  await fs.writeJson(STATE_FILE, state, { spaces: 2 });
}

// ============ BUILD MICRO-SAAS ============
async function buildMicroSaaS(opportunity) {
  console.log(`🔨 Building micro-SaaS: "${opportunity.title}"`);
  
  const projectDir = path.join(DEPLOYED_DIR, opportunity.id);
  await fs.ensureDir(projectDir);
  
  // Write the build spec for the coding agent
  const specPath = path.join(projectDir, 'BUILD_SPEC.md');
  const spec = `# Build Spec: ${opportunity.title}

## Product Idea
${opportunity.title}

## Type
Micro-SaaS (single-page app or simple web service)

## Requirements
1. Clean, modern UI (Tailwind CSS or similar)
2. Core functionality working
3. Ready to deploy (static files or simple server)
4. Include pricing page ($5-29/month suggestion)
5. Contact/CTA section

## Tech Stack
- HTML + vanilla JS (fastest to build)
- Or Next.js if more complex
- Deploy-ready

## Build Notes
- Focus on ONE core feature
- Make it visually polished
- Add fake testimonials if needed
- Include "Coming Soon" or "Beta" badge
`;
  
  await fs.writeFile(specPath, spec);
  
  // Spawn Claude to build it
  console.log('🤖 Spawning Claude Code to build the product...');
  
  try {
    const claudeCmd = `cd ${projectDir} && claude --permission-mode bypassPermissions --print 'Build a micro-SaaS landing page and core functionality based on BUILD_SPEC.md. Create a complete, working product in this directory. Include index.html, styles, and any needed JS. Make it look professional and ready to show investors or customers. When done, create a README.md explaining what it does and how to run it.'`;
    
    const result = execSync(claudeCmd, { 
      encoding: 'utf8', 
      timeout: 600000,
      maxBuffer: 50 * 1024 * 1024
    });
    
    console.log('✅ Claude build complete');
    console.log(result.slice(-500)); // Show last 500 chars
    
    return true;
  } catch (e) {
    console.error('❌ Claude build failed:', e.message);
    
    // Fallback: spawn Pi
    console.log('🤖 Falling back to Pi...');
    try {
      const piCmd = `cd ${projectDir} && pi -p 'Build a complete micro-SaaS product based on this idea: "${opportunity.title}". Create index.html, css, and js files. Make it professional and functional.'`;
      
      const result = execSync(piCmd, {
        encoding: 'utf8',
        timeout: 600000,
        maxBuffer: 50 * 1024 * 1024
      });
      
      console.log('✅ Pi build complete');
      return true;
    } catch (e2) {
      console.error('❌ Pi also failed:', e2.message);
      return false;
    }
  }
}

// ============ BUILD CHROME EXTENSION ============
async function buildChromeExtension(opportunity) {
  console.log(`🔨 Building Chrome Extension: "${opportunity.title}"`);
  
  const projectDir = path.join(DEPLOYED_DIR, opportunity.id);
  await fs.ensureDir(projectDir);
  
  const specPath = path.join(projectDir, 'BUILD_SPEC.md');
  const spec = `# Build Spec: ${opportunity.title}

## Product Idea
${opportunity.title}

## Type
Chrome Extension

## Requirements
1. manifest.json (v3)
2. Popup UI (HTML + CSS + JS)
3. Content script if needed
4. Background service worker if needed
5. Ready to load as unpacked extension

## Tech Stack
- Vanilla JS
- Simple CSS
- Chrome Extension APIs
`;
  
  await fs.writeFile(specPath, spec);
  
  console.log('🤖 Spawning coding agent...');
  
  try {
    const claudeCmd = `cd ${projectDir} && claude --permission-mode bypassPermissions --print 'Build a complete Chrome Extension based on BUILD_SPEC.md. Create manifest.json, popup.html, popup.js, popup.css, and any other needed files. Make it functional and polished. When done, create README.md with installation instructions.'`;
    
    const result = execSync(claudeCmd, {
      encoding: 'utf8',
      timeout: 600000,
      maxBuffer: 50 * 1024 * 1024
    });
    
    console.log('✅ Extension build complete');
    return true;
  } catch (e) {
    console.error('❌ Build failed:', e.message);
    return false;
  }
}

// ============ MAIN ============
async function main() {
  if (!targetId) {
    console.error('Usage: node builder.js <opportunity-id>');
    process.exit(1);
  }
  
  const state = await loadState();
  const opportunity = state.opportunities.find(o => o.id === targetId);
  
  if (!opportunity) {
    console.error(`Opportunity ${targetId} not found`);
    process.exit(1);
  }
  
  console.log(`🎯 Target: "${opportunity.title}" (${opportunity.recommendedBuild || 'micro-saas'})`);
  
  let success = false;
  
  if (opportunity.recommendedBuild === 'chrome-extension') {
    success = await buildChromeExtension(opportunity);
  } else {
    success = await buildMicroSaaS(opportunity);
  }
  
  if (success) {
    opportunity.built = true;
    opportunity.builtAt = new Date().toISOString();
    opportunity.projectDir = path.join(DEPLOYED_DIR, opportunity.id);
    
    state.inBuild = state.inBuild.filter(id => id !== targetId);
    state.deployed.push(opportunity);
    
    console.log(`\n✅ BUILD SUCCESS: "${opportunity.title}"`);
    console.log(`📁 Location: ${opportunity.projectDir}`);
  } else {
    opportunity.failedBuilds = (opportunity.failedBuilds || 0) + 1;
    state.inBuild = state.inBuild.filter(id => id !== targetId);
    
    console.log(`\n❌ BUILD FAILED: "${opportunity.title}"`);
  }
  
  state.lastBuild = new Date().toISOString();
  await saveState(state);
}

main().catch(e => {
  console.error('Builder crashed:', e);
  process.exit(1);
});
