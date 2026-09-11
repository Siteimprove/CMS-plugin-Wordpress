const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

const pluginPath = process.env.SITEIMPROVE_TEST_SCRIPT || path.resolve(__dirname, '../../siteimprove/admin/js/siteimprove.js');
const publicUrl = 'https://delivery.example.test/article/';
const token = 'regression-fixture-token';

async function boot(page, globals, body = '<main>Fixture content</main>') {
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><title>Regression fixture</title></head><body>${body}</body></html>` }));
  await page.goto('http://wordpress.example.test/wp-admin/post.php?post=42&action=edit');
  await page.evaluate(globals => { window._si = []; Object.assign(window, globals); }, globals);
  await page.addScriptTag({ path: require.resolve('jquery/dist/jquery.js') });
  await page.addScriptTag({ path: pluginPath });
  await page.waitForFunction(() => typeof window.siGetCurrentUrlAndToken === 'function');
}

for (const placement of ['classic', 'taxonomy', 'legacy-taxonomy']) {
  test(`${placement} recheck submits once per click and can be repeated after completion`, async ({ page }) => {
    const markup = {
      classic: '<div id="publishing-action"><button>Update</button></div>',
      taxonomy: '<div class="edit-tag-actions"><button>Update</button></div>',
      'legacy-taxonomy': '<input id="submit" type="submit" value="Update">',
    };
    await boot(page, { siteimprove_recheck_button: { url: publicUrl, token, txt: 'Siteimprove Recheck' } }, markup[placement]);
    const button = page.getByRole('button', { name: 'Siteimprove Recheck' });
    await expect(button).toHaveCount(1);
    for (let count = 1; count <= 2; count++) {
      await button.click();
      await expect(button).toBeDisabled();
      const queued = await page.evaluate(() => window._si.filter(command => command[0] === 'recheck').map(command => ({ url: command[1], token: command[2], callback: typeof command[3] })));
      expect(queued).toHaveLength(count);
      expect(queued[count - 1]).toEqual({ url: publicUrl, token, callback: 'function' });
      await page.evaluate(() => window._si.filter(command => command[0] === 'recheck').at(-1)[3]());
      await expect(button).toBeEnabled();
    }
    await expect(page.getByRole('button', { name: 'Update', exact: true })).toBeEnabled();
  });
}

test('a WordPress update notification queues a recheck for the updated page', async ({ page }) => {
  await boot(page, { siteimprove_recheck: { url: publicUrl, token } });
  expect(await page.evaluate(() => window._si.filter(command => command[0] === 'recheck').map(command => command.slice(0, 3))))
    .toEqual([['recheck', publicUrl, token]]);
});

for (const version of ['0', '1']) {
  test(`experience ${version} initializes one non-content view without a Prepublish callback`, async ({ page }) => {
    await boot(page, { siteimprove_domain: { url: 'https://delivery.example.test', token, version } });
    const methods = await page.evaluate(() => window._si.map(command => command[0]));
    expect(methods.filter(method => ['domain', 'clear', 'input'].includes(method))).toEqual([version === '0' ? 'domain' : 'clear']);
    expect(methods).not.toContain('registerPrepublishCallback');
  });
}

// This verifies the WordPress-to-SDK handoff. Rendering and removing the actual
// highlight belongs to CMS-plugin-v2 and is explicitly left open in the catalog.
test('highlighting is delegated once without rewriting inline content', async ({ page }) => {
  await boot(page, {
    siteimprove_input: { url: publicUrl, token, version: '1', is_content_page: true, nonce: 'fixture-nonce' },
    php_vars: { has_api_key: '1', prepublish_allowed: '1', prepublish_enabled: '1' },
  }, '<main><p id="city"><strong><em>Example town</em></strong><br>Example country</p></main>');
  const before = await page.locator('#city').innerHTML();
  const result = await page.evaluate(() => {
    const handlers = window._si.filter(command => command[0] === 'onHighlight');
    const info = { selector: '#city', text: 'Example town' };
    handlers[0][1](info);
    const calls = window._si.filter(command => command[0] === 'applyDefaultHighlighting');
    return { handlers: handlers.length, calls: calls.length, info: calls[0][1], document: calls[0][2] === document, window: calls[0][3] === window };
  });
  expect(result).toEqual({ handlers: 1, calls: 1, info: { selector: '#city', text: 'Example town' }, document: true, window: true });
  expect(await page.locator('#city').innerHTML()).toBe(before);
});

test('the distributed CMS plugin has the approved display name', () => {
  const entry = path.resolve(path.dirname(pluginPath), '../../siteimprove.php');
  expect(fs.readFileSync(entry, 'utf8')).toMatch(/Plugin Name:\s+Siteimprove\s*\r?\n/);
});
