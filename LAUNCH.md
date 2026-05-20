# Ninja Money Machine — Launch Strategy

> Four products built by AI in one afternoon. This is the playbook to get them in front of people.

---

## 📊 Positioning

**Tagline:** *4 products. 1 afternoon. 0 dependencies. 1 engineer + AI.*

**Angle:** This isn't about the tools — it's about the *speed*. We built 4 working products in ~4 hours using AI agent swarms. The products are the **proof**; the story is the **hook**.

**Target Audiences:**
1. **Developers / indie hackers** — interested in AI coding workflows
2. **Productivity tool users** — people who need markdown editors, meeting tools, etc.
3. **Agency/freelance leads** — "look what we can build in a day"

---

## 🎯 Phase 1: Fix the Plumbing (This Hour)

### 1.1 Push TL;DR fix to Vercel
The bug fix (auto-run) is only on your local machine. You need to redeploy.
```bash
cd ~/ninja-money-machine/deployed/seed-dev-tool-*
# Option A: Copy fixed files to Vercel CLI
cp popup.js ~/vercel-deploy/tldr/
vercel --prod
```

### 1.2 GitHub-ize the 3 projects
They're NOT git repos. Turn them into repos so they have:
- READMEs
- Issue tracking
- GitHub Pages (if needed)

**Action:**
```bash
cd ~/ninja-money-machine/deployed/seed-dev-tool-*
git init
git add .
git commit -m "Initial: TL;DR on-device page summarizer"
gh repo create alifromtheends/tldr-summarizer --public --push

# Repeat for PostPilot and NoteNinja
```

### 1.3 Fix `alert()` → custom toast (2 min)
PostPilot and NoteNinja use `alert()` which feels cheap. Swap for inline toast.

---

## 🚀 Phase 2: The "Viral Hook" (Day 1)

### 2.1 Twitter/X Thread

**Tweet 1 (The Hook):**
```
I built 4 products in 4 hours using AI agent swarms.

Not prompts. Not chat. Full autonomous coding agents working in parallel.

Here's what they built — and how you can do it too:
🧵
```

**Tweet 2 (Markup):**
```
📝 Markup — Privacy-first markdown editor with 7 themes, cloud sync, Stripe billing, and a Chrome extension.

Built in ~60 minutes. Zero frameworks.

→ https://alifromtheends.github.io/markuptool/
```

**Tweet 3 (TL;DR):**
```
⚡ TL;DR — Chrome extension that summarizes any page into 3 bullets using on-device NLP. No API keys. Works offline.

Built in ~30 minutes.

→ https://seed-dev-tool-1779205224843.vercel.app
```

**Tweet 4 (PostPilot):**
```
📅 PostPilot — Social media scheduler with AI hashtag generation and a visual calendar.

Built in ~45 minutes.

→ https://seed-ai-automation-1779205224828.vercel.app
```

**Tweet 5 (NoteNinja):**
```
🥷 NoteNinja — Meeting notes that extract action items, deadlines, and assignees from voice transcripts.

Built in ~45 minutes.

→ https://seed-productivity-1779205224843.vercel.app
```

**Tweet 6 (The Ask):**
```
All of this was built with Kimi CLI, Claude Code, and agent swarms.

No React. No Next.js. No build step. Just vanilla JS, HTML, CSS, and AI.

Want the breakdown? RT this and I'll drop the full workflow.
```

### 2.2 Hacker News Post

**Title:** *Show HN: I built 4 products in 4 hours with AI agent swarms*

**Body:**
```
I used a swarm of AI coding agents (Kimi CLI, Claude Code) to build 4 working products this afternoon. No frameworks, no build step, just vanilla JS + AI.

The products:
- Markup — Markdown editor with Stripe billing (https://alifromtheends.github.io/markuptool/)
- TL;DR — On-device page summarizer Chrome ext (https://seed-dev-tool-1779205224843.vercel.app)
- PostPilot — Social media scheduler (https://seed-ai-automation-1779205224828.vercel.app)
- NoteNinja — Meeting notes with AI extraction (https://seed-productivity-1779205224843.vercel.app)

I'm treating this as a portfolio of what's possible with modern AI coding tools. Happy to answer questions about the workflow.
```

Post timing: **Tuesday 9am PT** (peak HN traffic).

### 2.3 Indie Hackers Post
Same content as HN but with a product-focus angle.

### 2.4 Reddit (r/webdev, r/ArtificialInteligence, r/SideProject)
Adapt the thread for each subreddit. r/webdev → focus on no-frameworks. r/SideProject → focus on speed.

---

## 🎯 Phase 3: Product Hunt (Day 2-3)

### Product Hunt Launch Strategy

**Product:** Launch Markup first (most polished, has Stripe, has extension). Bundle the others as "from the same maker."

**Tagline:** *A markdown editor that exports beautiful websites — built in 1 hour by AI.*

**Thumbnail:** Use the existing PH assets from the markuptool folder.

**First Comment (The Story):**
```
Hey PH! 👋

I built Markup using AI agent swarms in about an hour this week.

What started as a "can AI actually build a full product?" experiment turned into a real tool I now use daily.

Markup is a privacy-first markdown editor that:
- Works offline
- Has 7 themes (including a hacker terminal theme)
- Exports single-file websites
- Cloud-saves your docs with shareable URLs
- Has a Chrome extension for quick editing
- And a $5/mo Pro tier via Stripe

All vanilla JS. Zero frameworks. Zero build step.

It's part of a bigger experiment: I built 4 products in 4 hours. The other 3 are linked in my profile.

Would love your feedback — especially on the themes and export quality.
```

**Launch Day Actions:**
1. Post at **12:01am PT** (midnight Pacific) for max visibility
2. Share in your networks immediately after
3. Reply to every comment within the first 2 hours
4. Cross-post to Twitter, LinkedIn, Discord

---

## 🎯 Phase 4: Long-Tail (Week 1-2)

### 4.1 LinkedIn Post
Professional angle. Focus on "AI-augmented engineering" and "what's possible now."

### 4.2 Dev.to Article
Write a deep-dive: *"How I Built 4 Products in 4 Hours Using AI Agent Swarms"*

Structure:
1. The problem (slow dev cycles)
2. The experiment (4 products, 4 hours)
3. The stack (Kimi CLI, Claude Code, vanilla JS)
4. The results (each product breakdown)
5. The lessons (what AI got wrong, what it got right)
6. The future (this changes everything)

### 4.3 YouTube Short / TikTok
Screen record the building process. Show:
- Typing a prompt
- Watching code generate
- Refreshing browser to see working product
- Final demo of all 4 tools

**Hook:** *"I built 4 products in 4 hours. Here's proof."*

### 4.4 Newsletter Pitch
Pitch the story to:
- The Pragmatic Engineer
- Ben's Bites (AI newsletter)
- TLDR Newsletter (ironic!)
- Console.dev

Subject: *"Built 4 products in 4 hours with AI — here's what worked"*

---

## 📈 Metrics to Track

| Metric | Tool |
|--------|------|
| Page views | Vercel analytics (built-in) |
| Stripe conversions | Stripe Dashboard |
| GitHub stars | GitHub |
| Social engagement | Twitter/LinkedIn native |
| HN ranking | hn.algolia.com |
| PH ranking | producthunt.com |

---

## 🛠 Immediate Action Items

**Right now:**
- [ ] Push TL;DR fix to Vercel
- [ ] Git init + push all 3 non-git projects
- [ ] Deploy this portfolio page to `ninja-money-machine` GitHub Pages
- [ ] Post the Twitter thread

**Today:**
- [ ] Post to HN + Indie Hackers
- [ ] Set up Product Hunt page for Markup

**This week:**
- [ ] Write Dev.to article
- [ ] Record YouTube Short
- [ ] Pitch to newsletters

---

*The products are the proof. The story is the hook. Let's go.*
