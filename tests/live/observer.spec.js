const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');

// The live runner uses Chromium; this validates its browser instrumentation.
test('Read-only observers recognize a captured preview and its cross-origin SDK handoff', async ({ browser }) => {
  const { observeCapture } = require('./run');
  const context = await browser.newContext();
  const evidence = {};
  const marker = `SI-LIVE-${randomUUID()}`;
  try {
    await observeCapture(context, marker, evidence);
    const page = await context.newPage();
    // Synthetic HTTP documents; no request reaches WordPress or Siteimprove.
    await page.route('**/*', route => route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><title></title></head><body>${marker}</body></html>`}));
    await page.goto('http://localhost:8888/observer-parent');
    await page.evaluate(async () => {
      for (const url of ['http://localhost:8888/observer-preview?si_preview_nonce=synthetic', 'https://contentassistant.eu.siteimprove.com/observer']) {
        const frame = document.createElement('iframe');
        const loaded = new Promise(resolve => { frame.onload = resolve; });
        frame.src = url;
        document.body.appendChild(frame);
        await loaded;
      }
    });
    await expect.poll(() => evidence.preview).toEqual({kind:'preview',marker:true,emptyTitle:true,excludesPublished:true,excludesPlugin:true});
    await page.evaluate(marker => {
      window.frames[1].postMessage({si:'contentcheck-flat-dom',data:{dom:{strings:[marker,'rgb(20, 40, 60)']}}},'https://contentassistant.eu.siteimprove.com');
    },marker);
    await expect.poll(() => evidence.handoff).toEqual({kind:'handoff',marker:true,style:true,excludesPublished:true});
  } finally { await context.close(); }
});
