const btn = document.getElementById("summarize-btn");
const status = document.getElementById("status");
const bulletsEl = document.getElementById("bullets");
const metaEl = document.getElementById("meta");
const metaSource = document.getElementById("meta-source");
const copyBtn = document.getElementById("copy-btn");

const SENTENCE_DELIM = "|||SENT_BREAK|||";

const STOPWORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are",
  "as","at","be","because","been","before","being","below","between","both","but","by","can",
  "cannot","could","did","do","does","doing","down","during","each","few","for","from",
  "further","had","has","have","having","he","her","here","hers","herself","him","himself",
  "his","how","if","in","into","is","it","its","itself","just","let","like","me","more",
  "most","my","myself","no","nor","not","now","of","off","on","once","only","or","other",
  "ought","our","ours","ourselves","out","over","own","said","same","says","she","should",
  "since","so","some","such","than","that","the","their","theirs","them","themselves","then",
  "there","these","they","this","those","through","to","too","under","until","up","very",
  "was","we","were","what","when","where","which","while","who","whom","why","will","with",
  "would","you","your","yours","yourself","yourselves","also","one","two","three","get",
  "got","make","made","many","much","new"
]);

btn.addEventListener("click", run);
copyBtn.addEventListener("click", copySummary);

async function run() {
  resetUI();
  setLoading(true);
  setStatus("Reading page…");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("No active tab.");
    if (!isSummarizable(tab.url)) {
      throw new Error("This page can't be summarized. Try a normal http(s) page.");
    }

    const injection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent
    });

    const result = injection && injection[0] && injection[0].result;

    if (!result || !result.text || result.text.length < 200) {
      throw new Error("Couldn't find enough readable text on this page.");
    }

    setStatus("Summarizing…");
    const bullets = summarize(result.text, 3);

    if (bullets.length === 0) {
      throw new Error("Couldn't build a summary for this page.");
    }

    renderBullets(bullets);
    showMeta(result.title || tab.title || "");
    setStatus("");
  } catch (err) {
    setError(err && err.message ? err.message : "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

function isSummarizable(url) {
  return !!url && /^https?:\/\//i.test(url);
}

function resetUI() {
  bulletsEl.hidden = true;
  bulletsEl.innerHTML = "";
  metaEl.hidden = true;
  metaSource.textContent = "";
  copyBtn.classList.remove("copied");
  copyBtn.textContent = "Copy";
  status.textContent = "";
  status.classList.remove("error");
}

function setLoading(loading) {
  btn.disabled = loading;
  btn.dataset.loading = loading ? "true" : "false";
}

function setStatus(msg) {
  status.classList.remove("error");
  status.textContent = msg;
}

function setError(msg) {
  status.classList.add("error");
  status.textContent = msg;
}

function renderBullets(bullets) {
  bulletsEl.innerHTML = "";
  for (const b of bullets) {
    const li = document.createElement("li");
    li.textContent = b;
    bulletsEl.appendChild(li);
  }
  bulletsEl.hidden = false;
}

function showMeta(title) {
  metaSource.textContent = title;
  metaSource.title = title;
  metaEl.hidden = false;
}

async function copySummary() {
  const items = Array.from(bulletsEl.querySelectorAll("li"))
    .map((li, i) => (i + 1) + ". " + li.textContent);
  if (items.length === 0) return;
  try {
    await navigator.clipboard.writeText(items.join("\n"));
    copyBtn.textContent = "Copied";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 1400);
  } catch (e) {
    setError("Copy failed.");
  }
}

/* ----------------------------------------------------------------------
 * Extractive summarizer. Splits the page text into sentences, scores each
 * by sum of TF of non-stopword tokens (normalized by length, with mild
 * position bias), and returns the top N in document order.
 * ---------------------------------------------------------------------- */
function summarize(text, n) {
  if (!n) n = 3;
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = splitSentences(cleaned);
  if (sentences.length === 0) return [];
  if (sentences.length <= n) return sentences;

  const tf = Object.create(null);
  for (const s of sentences) {
    for (const w of tokenize(s)) {
      tf[w] = (tf[w] || 0) + 1;
    }
  }

  const scored = sentences.map((s, idx) => {
    const words = tokenize(s);
    if (words.length === 0) return { idx: idx, s: s, score: 0 };
    let score = 0;
    for (const w of words) score += tf[w] || 0;
    const lenPenalty = words.length < 5 ? 0.5 : words.length > 40 ? 0.7 : 1;
    const positionBias = 1 + Math.max(0, 1 - idx / Math.max(20, sentences.length)) * 0.1;
    return { idx: idx, s: s, score: (score / words.length) * lenPenalty * positionBias };
  });

  return scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .sort((a, b) => a.idx - b.idx)
    .map(x => x.s);
}

function splitSentences(text) {
  const tagged = text.replace(
    /([.!?])\s+(?=["'(\[]?[A-Z0-9])/g,
    "$1" + SENTENCE_DELIM
  );
  const parts = tagged.split(SENTENCE_DELIM).map(s => s.trim()).filter(Boolean);
  return parts.filter(s => {
    if (s.length < 30 || s.length > 400) return false;
    if (!/[A-Za-z]/.test(s)) return false;
    if (!/[.!?]["')\]]?$/.test(s)) return false;
    return true;
  });
}

function tokenize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w && w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/* ----------------------------------------------------------------------
 * Runs inside the page via chrome.scripting.executeScript.
 * Must be self-contained (no closure captures from popup.js).
 * ---------------------------------------------------------------------- */
function extractPageContent() {
  const SKIP = new Set([
    "SCRIPT","STYLE","NOSCRIPT","NAV","HEADER","FOOTER","ASIDE","FORM",
    "BUTTON","INPUT","SELECT","TEXTAREA","SVG","CANVAS","IFRAME"
  ]);

  function visibleText(el) {
    if (!el) return "";
    let out = "";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        const txt = node.nodeValue;
        if (!txt || !txt.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      out += node.nodeValue + " ";
    }
    return out;
  }

  const candidates = [
    document.querySelector("article"),
    document.querySelector("main"),
    document.querySelector('[role="main"]'),
    document.querySelector(".post, .article, .entry, .content, #content, #main"),
    document.body
  ].filter(Boolean);

  let best = "";
  for (const el of candidates) {
    const t = visibleText(el).replace(/\s+/g, " ").trim();
    if (t.length > best.length) best = t;
    if (best.length > 4000) break;
  }

  if (best.length > 20000) best = best.slice(0, 20000);

  return {
    title: document.title || "",
    url: location.href,
    text: best
  };
}
