const { chromium } = require('playwright');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const { loadSettings, isLivePageData } = require('./settings');
const CMS = 'http://localhost:8888';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function requireCondition(condition) { if (!condition) throw new Error('Live test condition was not met'); }
async function until(condition, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await condition()) return; await sleep(200); }
  throw new Error('Live test condition timed out');
}
async function visibleOne(locators, timeout = 30000) {
  let result;
  await until(async () => {
    for (const locator of locators) {
      const count = await locator.count();
      for (let index = 0; index < count; index++) {
        if (await locator.nth(index).isVisible()) { result = locator.nth(index); return true; }
      }
    }
    return false;
  }, timeout);
  return result;
}

// Read-only observers: no SDK queue replacement and no modification of submitted
// content or URLs. Only booleans leave the page; account data is never logged.
async function observeCapture(context, marker, evidence) {
  await context.exposeBinding('__siLiveEvidence', (source, result) => {
    const origin = new URL(source.frame.url()).origin;
    if (result.kind === 'preview' && origin === CMS && source.frame.parentFrame()) evidence.preview = result;
    if (result.kind === 'handoff' && /^https:\/\/contentassistant\.[a-z]+\.siteimprove\.com$/.test(origin)) evidence.handoff = result;
  });
  await context.addInitScript(({ marker, cms }) => {
    document.addEventListener('DOMContentLoaded', () => {
      if (location.origin === cms && new URL(location.href).searchParams.has('si_preview_nonce')) {
        window.__siLiveEvidence({ kind:'preview', marker:document.body.textContent.includes(marker),
          emptyTitle:document.querySelectorAll('head > title').length === 1 && document.title.trim() === '',
          excludesPublished:!document.body.textContent.includes('SI-LIVE-PUBLISHED-CONTROL'),
          excludesPlugin:document.querySelectorAll('script[src*="siteimprove/admin/js/siteimprove.js"]').length === 0,
        });
      }
    });
    window.addEventListener('message', event => {
      if (event.origin !== cms || event.source !== window.parent || event.data?.si !== 'contentcheck-flat-dom') return;
      const serialized = JSON.stringify(event.data.data?.dom ?? null);
      window.__siLiveEvidence({ kind:'handoff', marker:serialized.includes(marker),
        style:serialized.includes('rgb(20, 40, 60)'),
        excludesPublished:!serialized.includes('SI-LIVE-PUBLISHED-CONTROL') });
    });
  }, { marker, cms:CMS });
}

async function run() {
  let browser;
  let phase = 'configuration';
  const step = async (name, callback) => {
    phase = name;
    console.log(`START: ${name}`);
    const result = await callback();
    console.log(`PASS: ${name}`);
    return result;
  };
  try {
    requireCondition(process.env.SITEIMPROVE_RUN_LIVE === '1');
    const settings = loadSettings(process.env);
    const marker = `SI-LIVE-${randomUUID()}`;
    await step('API access and existing Prepublish entitlement', async () => {
      const authorization = `Basic ${Buffer.from(`${settings.SITEIMPROVE_API_USERNAME}:${settings.SITEIMPROVE_API_KEY}`).toString('base64')}`;
      const response = await fetch('https://api.siteimprove.com/v2/settings/content_checking', {
        headers:{Authorization:authorization}, signal:AbortSignal.timeout(30000), redirect:'error',
      });
      requireCondition(response.ok && (await response.json()).is_ready === true);
    });
    browser = await step('Browser startup', () => chromium.launch());
    const context = await browser.newContext(); // No saved session, trace, video or screenshots.
    context.setDefaultTimeout(30000);
    const evidence = {};
    await observeCapture(context, marker, evidence);
    const page = await context.newPage();
    // The internal crawled website is a mapping context, never a browser target.
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(settings.fixture.crawledUrl).origin
      ? route.abort() : route.continue());
    await step('WordPress administrator login', async () => {
      await page.goto(`${CMS}/wp-login.php`);
      await until(() => page.locator('#user_login').evaluate(element => element === document.activeElement));
      await page.locator('#user_login').fill('admin');
      await page.locator('#user_pass').fill('password');
      await page.locator('#wp-submit').click();
      await page.waitForURL(`${CMS}/wp-admin/**`);
    });
    await step('Normal plugin configuration and credential validation', async () => {
      await page.goto(`${CMS}/wp-admin/admin.php?page=siteimprove&devmode=1`);
      await page.locator('#siteimprove_public_url_field').fill(settings.fixture.publicBase);
      await page.locator('#siteimprove_ignore_path_segments_field').fill('');
      await page.locator('#siteimprove_disable_new_version_field').check();
      await page.locator('#siteimprove_overlayjs_file_field').fill('overlay-latest.js');
      if (!(await page.locator('#siteimprove_token_field').inputValue())) {
        await page.locator('#siteimprove_token_request').click();
        await until(async () => Boolean(await page.locator('#siteimprove_token_field').inputValue()));
      }
      await page.locator('#submit').click();
      // Save the URL before API validation, which reads the stored Public URL.
      await page.goto(`${CMS}/wp-admin/admin.php?page=siteimprove`);
      await page.locator('#siteimprove_api_username_field').fill(settings.SITEIMPROVE_API_USERNAME);
      await page.locator('#siteimprove_api_key_field').fill(settings.SITEIMPROVE_API_KEY);
      await page.locator('#submit').click();
      await page.getByText('Prepublish feature is already enabled for the current website.', { exact:false }).waitFor();
    });
    const previewUrl = await step('Create a mapped unpublished preview with an empty HTML title', async () => {
      await page.goto(`${CMS}/wp-admin/tools.php?page=siteimprove-live-fixture`);
      await page.locator('[name=fixture_path]').fill(settings.fixture.path);
      await page.locator('[name=fixture_query]').fill(settings.fixture.query);
      await page.locator('[name=fixture_marker]').fill(marker);
      await page.getByRole('button', {name:'Create live test fixture',exact:true}).click();
      return page.locator('#live-preview').getAttribute('href');
    });
    let liveDataReceived = false;
    page.on('response', async response => {
      try {
        const url = new URL(response.url());
        if (/^contentassistant\.[a-z]+\.siteimprove\.com$/.test(url.hostname) && url.pathname === '/cms/poll' &&
            url.searchParams.get('url') === settings.fixture.crawledUrl && response.ok()) {
          if (isLivePageData(await response.json())) liveDataReceived = true;
        }
      } catch { /* Login redirects and non-JSON responses cannot satisfy the check. */ }
    });
    await step('Verify draft privacy and normal public URL mapping', async () => {
      await page.goto(previewUrl);
      requireCondition(await page.title() === '');
      requireCondition(await page.locator('head > title').count() === 1);
      requireCondition((await page.locator('main').innerText()).includes(marker));
      const input = await page.evaluate(() => ({ url:window.siteimprove_input?.url, enabled:window.php_vars }));
      requireCondition(input.url === settings.fixture.crawledUrl);
      requireCondition(Number(input.enabled?.prepublish_allowed) === 1 && Number(input.enabled?.prepublish_enabled) === 1);
      const anonymous = await browser.newContext();
      try { requireCondition(!(await (await anonymous.request.get(previewUrl)).text()).includes(marker)); }
      finally { await anonymous.close(); }
    });
    await step('Direct Siteimprove login through the plugin', async () => {
      const popupPromise = page.waitForEvent('popup');
      await page.locator('.si-smallbox button.si-button').click();
      const popup = await popupPromise;
      await popup.locator('input[name=loginId]').fill(settings.SITEIMPROVE_USERNAME);
      await popup.getByRole('button', {name:'Continue',exact:true}).click();
      await popup.locator('input[type=password]').fill(settings.SITEIMPROVE_PASSWORD);
      const submit = await visibleOne([popup.getByRole('button', {name:/^(Sign in|Log in|Continue)$/i})]);
      const closed = popup.waitForEvent('close', {timeout:60000});
      await submit.click();
      await closed;
      // Terms, MFA, CAPTCHA or entitlement failures stop here; never bypass them.
    });
    let overlay;
    await step('Existing Live page data arrives for the exact mapped URL', async () => {
      await until(() => liveDataReceived, 60000);
      await page.locator('.si-smallbox button.si-button').click();
      await page.locator('iframe.si-iframe-element').waitFor({state:'visible'});
      overlay = page.frameLocator('iframe.si-iframe-element');
      const liveTab = await visibleOne([overlay.getByRole('tab',{name:/Live page/i}), overlay.getByText('Live page',{exact:true})]);
      await liveTab.click();
    });
    await step('Start a fresh Prepublish check of the current draft', async () => {
      const prepublishTab = await visibleOne([overlay.getByRole('tab',{name:/Prepublish/i}), overlay.getByText('Prepublish view',{exact:true})]);
      await prepublishTab.click();
      const start = await visibleOne([overlay.getByRole('button',{name:/^(Run content check|Recheck draft)$/i})]);
      // Clear evidence only when starting this new check.
      delete evidence.preview;
      delete evidence.handoff;
      await start.click();
      // Observe a running state so a previous result cannot satisfy completion.
      await overlay.getByRole('button',{name:/Cancel content check/i}).waitFor({state:'visible',timeout:30000});
      await until(() => evidence.preview?.marker && evidence.handoff?.marker, 60000);
      requireCondition(evidence.preview.emptyTitle && evidence.preview.excludesPublished && evidence.preview.excludesPlugin);
      requireCondition(evidence.handoff.style && evidence.handoff.excludesPublished);
    });
    await step('The new check completes and reports the missing title', async () => {
      // A new submission was observed above. Require the terminal recheck control,
      // no active cancellation control, and the expected issue in Prepublish view.
      await overlay.getByRole('button',{name:/^Recheck draft$/i}).waitFor({state:'visible',timeout:180000});
      await until(async () => !(await overlay.getByRole('button',{name:/Cancel content check/i}).isVisible()),180000);
      const missingTitle = await visibleOne([
        overlay.getByText(/^(Page has no title|Page title is missing|Missing page title|Page does not have a title|Page is missing a title)$/i),
      ],30000);
      requireCondition(await missingTitle.isVisible());
    });
    console.log('PASS: Live page data and fresh Prepublish missing-title check');
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      'Live page data and a fresh Prepublish missing-title check passed. Page-report styling still requires manual inspection. No account data or screenshots were retained.\n');
    return 0;
  } catch {
    // Never print raw Playwright/API errors: they may include URLs, form values,
    // account content, request headers or authentication tokens.
    console.error(`FAIL: ${phase}. Account details and raw diagnostics were suppressed.`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Live test failed during: ${phase}. No sensitive diagnostics were retained.\n`);
    return 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
if (require.main === module) run().then(code => { process.exitCode = code; });
module.exports = { observeCapture, run };
