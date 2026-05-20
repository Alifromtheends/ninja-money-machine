# TL;DR — 3 Bullet Summary

A Chrome extension that distills any webpage into 3 clear bullet points. Runs **entirely offline** — no API keys, no servers, no data leaves your browser.

## How it works

1. Click the toolbar icon on any article, blog post, or documentation page.
2. Press **Summarize this page**.
3. Get three bullets in document order. Copy them with one click.

Summaries are produced by an extractive algorithm (term-frequency scoring over non-stopword tokens, with length normalization and a mild position bias) — fast, deterministic, and private.

## Install (unpacked)

1. Open `chrome://extensions` in Chrome (or any Chromium browser: Edge, Brave, Arc).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Select the folder containing this `manifest.json`.
5. Pin the extension to your toolbar for easy access.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 declaration, permissions, popup wiring |
| `popup.html` | Extension popup markup |
| `popup.css` | Popup styling (dark, minimal) |
| `popup.js` | UI logic, content extraction trigger, summarization |
| `icons/` | 16/48/128 px toolbar icons |

No background service worker or persistent content script is needed — the page is read on-demand via `chrome.scripting.executeScript` only when you click the button.

## Permissions

- `activeTab` — read the current tab's contents when you invoke the extension.
- `scripting` — inject the text-extraction function into the active page.

No host permissions, no network access, no storage.

## Limitations

- Works on standard `http(s)://` pages. Chrome's internal pages (`chrome://`, the Web Store, etc.) cannot be summarized.
- Pages that render their content entirely in client-side JS may need to finish loading before you summarize.
- Extractive summarization picks existing sentences — it doesn't paraphrase. Quality scales with how well-structured the page's prose is.

## Develop

The code is plain vanilla JS with no build step. Edit any file and click the reload icon on the extension card at `chrome://extensions` to pick up changes.
