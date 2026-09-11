const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

async function login(page, username = 'admin', password = 'password') {
  await page.goto('/wp-login.php');
  await expect(page.locator('#user_login')).toBeFocused();
  await page.locator('#user_login').fill(username);
  await page.locator('#user_pass').fill(password);
  await page.locator('#wp-submit').click();
  await expect(page).toHaveURL(/\/wp-admin\//);
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { window._si = []; });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === 'http://127.0.0.1' || url.protocol === 'data:'
      ? route.continue() : route.abort();
  });
});

async function prepare(page, testInfo, mode = 'default') {
  await login(page);
  await page.goto('/wp-admin/tools.php?page=regression-test-fixtures');
  const nonce = await page.locator('#fixture-nonce').inputValue();
  const response = await page.request.post('/wp-admin/admin-post.php', {
    form: { action: 'regression_test_prepare', _wpnonce: nonce, mode },
  });
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text, 'Fixture setup must not emit PHP notices or fatal errors').not.toMatch(/(?:Warning|Notice|Fatal error)(?:<\/b>)?:/);
  const fixture = JSON.parse(text);
  const environment = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../.integration-regressions-env/.wp-env.json'), 'utf8'));
  const requestedVersion = environment.core.split('#')[1];
  if (/^\d+\.\d+(?:\.\d+)?$/.test(requestedVersion)) expect(fixture.wordpress).toBe(requestedVersion);
  expect(fixture.php.startsWith(`${environment.phpVersion}.`)).toBe(true);
  expect(fixture.multisite).toBe(true);
  expect(new Set(fixture.sites.map(site => site.id)).size, 'Fixture must create two distinct WordPress sites').toBe(2);
  expect(new URL(fixture.sites[0].home).pathname).toBe('/');
  expect(new URL(fixture.sites[1].home).pathname).toBe('/regression-subsite/');
  await testInfo.attach('runtime', { body: JSON.stringify({ wordpress: fixture.wordpress, php: fixture.php, multisite: fixture.multisite, siteCount: fixture.sites.length }, null, 2), contentType: 'application/json' });
  return fixture;
}

async function commands(page) {
  await page.waitForFunction(() => typeof window.siGetCurrentUrlAndToken === 'function');
  return page.evaluate(() => window._si.map(([method, value, token]) => ({
    method, value: typeof value === 'function' ? 'callback' : value, token,
  })));
}

for (const role of ['editor', 'custom_editor', 'network_admin']) {
  test(`${role} captures a subsite draft without a role-name allowlist`, async ({ page }, testInfo) => {
    const { sites } = await prepare(page, testInfo);
    const site = sites[1];
    expect(site.network_user_is_member).toBe(false);
    await page.context().clearCookies();
    await login(page, `regression_${role}`, 'regression-fixture-password');
    await page.goto(site.draft);
    await expect(page.locator('#regression-content')).toHaveText(`REGRESSION DRAFT SITE ${site.id}`);
    await expect(page.locator('.siteimprove-trigger-contentcheck a')).toBeVisible();
    expect(await commands(page)).toContainEqual(expect.objectContaining({ method: 'registerPrepublishCallback', value: 'callback', token: site.token }));
    const capture = await page.evaluate(async () => {
      const callback = window._si.find(command => command[0] === 'registerPrepublishCallback')[1];
      const doc = await callback();
      return { content: doc.querySelector('#regression-content')?.textContent, bar: doc.querySelector('#wpadminbar'), scripts: doc.querySelectorAll('script[src*="siteimprove/admin/js/siteimprove.js"]').length };
    });
    expect(capture).toEqual({ content: `REGRESSION DRAFT SITE ${site.id}`, bar: null, scripts: 0 });
    await expect(page.locator('#domIframe, #div_iframe, .si-overlay')).toHaveCount(0);
  });
}

for (const role of ['subscriber', 'custom_reader']) {
  test(`${role} cannot load the frontend overlay or read a private draft`, async ({ page }, testInfo) => {
    const { sites } = await prepare(page, testInfo);
    await page.context().clearCookies();
    await login(page, `regression_${role}`, 'regression-fixture-password');
    const published = await page.goto(sites[1].public);
    expect(published.status()).toBe(200);
    await expect(page.locator('#regression-content')).toHaveText(`REGRESSION PUBLISHED SITE ${sites[1].id}`);
    await expect(page.locator('script[src*="siteimprove/admin/js/siteimprove.js"]')).toHaveCount(0);
    const draft = await page.request.get(sites[1].draft);
    expect(await draft.text()).not.toContain(`REGRESSION DRAFT SITE ${sites[1].id}`);
  });
}

test('path filtering maps exact segments and keeps each subsite token', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo, 'mapping');
  for (const site of sites) {
    await page.goto(site.public);
    const input = await page.evaluate(() => window.siteimprove_input);
    expect(input.url).toBe(`https://delivery.example.test/site-${site.id}/published`);
    expect(input.token).toBe(site.token);
    expect(await commands(page)).toContainEqual({ method: 'input', value: input.url, token: site.token });
    await page.goto(site.similar);
    expect(await page.evaluate(() => window.siteimprove_input.url)).toBe(`https://delivery.example.test/site-${site.id}/content-root-guide`);
  }
});

test('static homepage has the same Live page identity in edit and preview', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo, 'home');
  const site = sites[1];
  await page.goto(site.edit);
  const editInput = await page.evaluate(() => window.siteimprove_input);
  await page.goto(site.preview);
  const previewInput = await page.evaluate(() => window.siteimprove_input);
  expect(previewInput.url).toBe(editInput.url);
  expect(previewInput.url).toBe(`https://delivery.example.test/site-${site.id}/regression-subsite/`);
  expect(await commands(page)).toContainEqual({ method: 'input', value: editInput.url, token: site.token });
  expect(await commands(page)).toContainEqual(expect.objectContaining({ method: 'registerPrepublishCallback', value: 'callback' }));
});

test('block editor initializes the overlay with the published page URL', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo);
  await page.goto(sites[0].edit);
  await expect(page.locator('script[src*="siteimprove/admin/js/siteimprove.js"]')).toHaveCount(1);
  await expect(page.locator('script[src*="overlay-latest.js"]')).toHaveCount(1);
  expect(await commands(page)).toContainEqual({ method: 'input', value: 'https://delivery.example.test/site-1/content-root/published/', token: sites[0].token });
});

test('dashboard initializes an empty overlay without preview parameters', async ({ page }, testInfo) => {
  await prepare(page, testInfo);
  const response = await page.goto('/wp-admin/index.php');
  expect(await response.text()).not.toMatch(/(?:Warning|Notice|Fatal error)(?:<\/b>)?:/);
  const queue = await commands(page);
  expect(queue).toContainEqual(expect.objectContaining({ method: 'clear' }));
  expect(queue.some(command => ['registerPrepublishCallback', 'input'].includes(command.method))).toBe(false);
  await expect(page.locator('.siteimprove-trigger-contentcheck a')).toHaveCount(0);
});

for (const mode of ['no-key', 'disallowed', 'disabled']) {
  test(`${mode} disables both Prepublish entry points while retaining Live page input`, async ({ page }, testInfo) => {
    const { sites } = await prepare(page, testInfo, mode);
    await page.goto(sites[0].preview);
    const queue = await commands(page);
    expect(queue).toContainEqual(expect.objectContaining({ method: 'input' }));
    expect(queue).toContainEqual(expect.objectContaining({ method: 'registerPrepublishCallback', value: null }));
    await expect(page.locator('.siteimprove-trigger-contentcheck a')).toHaveCount(0);
  });
}

test('missing and invalid settings nonces cannot replace the public URL', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo);
  await page.goto(sites[0].settings);
  const before = await page.locator('#siteimprove_public_url_field').inputValue();
  for (const nonce of [undefined, 'invalid-nonce']) {
    const response = await page.request.post('/wp-admin/options.php', {
      form: { option_page: 'siteimprove', action: 'update', siteimprove_public_url: 'https://wrong.example.test', ...(nonce ? { _wpnonce: nonce } : {}) },
    });
    expect(response.status()).toBe(403);
    await page.reload();
    await expect(page.locator('#siteimprove_public_url_field')).toHaveValue(before);
  }
  // Positive control: the actual settings form issues a nonce WordPress accepts.
  await page.locator('#siteimprove_public_url_field').fill('https://updated.example.test');
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await expect(page.locator('#siteimprove_public_url_field')).toHaveValue('https://updated.example.test');
});

test('devmode persists a custom overlay URL', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo);
  await page.goto(`${sites[0].settings}&devmode`);
  await page.locator('#siteimprove_overlayjs_file_field').fill('https://overlay.example.test/overlay-custom.js');
  await page.getByRole('button', { name: 'Save Settings' }).click();
  await page.goto(sites[0].public);
  await expect(page.locator('script[src*="overlay.example.test/overlay-custom.js"]')).toHaveCount(1);
});

test('token requests require both an administrator and a current nonce', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo);
  await page.goto(sites[0].settings);
  const nonce = await page.locator('#_wpnonce').inputValue();
  for (const invalid of [undefined, 'invalid-nonce']) {
    const response = await page.request.post('/wp-admin/admin-ajax.php', {
      form: { action: 'siteimprove_request_token', ...(invalid ? { _wpnonce: invalid } : {}) },
    });
    expect(await response.text()).not.toContain('regression-test-token');
  }
  await page.goto('/wp-admin/tools.php?page=regression-test-fixtures');
  await expect(page.locator('#token-requests')).toHaveText('0');
  const valid = await page.request.post('/wp-admin/admin-ajax.php', {
    form: { action: 'siteimprove_request_token', _wpnonce: nonce },
  });
  expect(await valid.text()).toBe('regression-test-token');
  await page.reload();
  await expect(page.locator('#token-requests')).toHaveText('1');
  await page.context().clearCookies();
  await login(page, 'regression_subscriber', 'regression-fixture-password');
  const denied = await page.request.post('/wp-admin/admin-ajax.php', {
    form: { action: 'siteimprove_request_token', _wpnonce: nonce },
  });
  expect(await denied.text()).not.toContain('regression-test-token');
  await page.context().clearCookies();
  await login(page);
  await page.goto('/wp-admin/tools.php?page=regression-test-fixtures');
  await expect(page.locator('#token-requests')).toHaveText('1');
});

test('an unset experience option selects and loads the latest experience', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo, 'fresh');
  await page.goto(sites[0].settings);
  await testInfo.attach('experience-script-selection', {
    body: JSON.stringify(await page.locator('script[src*="overlay-"]').evaluateAll(nodes => nodes.map(node => node.src))),
    contentType: 'application/json',
  });
  await expect(page.locator('input[name="siteimprove_disable_new_version"]')).toBeChecked();
  await expect(page.locator('script[src*="overlay-latest.js"]')).toHaveCount(1);
  await expect(page.locator('script[src*="overlay-v1.js"]')).toHaveCount(0);
});

test('the overlay loads after the plugin and its localized configuration', async ({ page }, testInfo) => {
  const { sites } = await prepare(page, testInfo);
  await page.goto(sites[0].public);
  const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => ({ src: node.src, parent: node.parentElement.tagName })));
  const plugin = scripts.findIndex(script => script.src.includes('/siteimprove/admin/js/siteimprove.js'));
  const overlay = scripts.findIndex(script => script.src.includes('/overlay-latest.js'));
  expect(plugin).toBeGreaterThanOrEqual(0);
  expect(overlay).toBeGreaterThan(plugin);
  expect(scripts[overlay].parent).toBe('BODY');
  expect(await commands(page)).toContainEqual(expect.objectContaining({ method: 'input' }));
});
