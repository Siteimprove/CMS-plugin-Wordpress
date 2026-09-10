const { test, expect } = require('@playwright/test');

// Real WordPress/PHP, sessions, autosaves, preview nonces and plugin code.
// Only the external SDK is replaced by its queue/callback contract. No scan runs.
for (const origin of ['same', 'split']) {
  for (const entry of ['toolbar', 'overlay']) {
    for (const scenario of ['draft', 'revision']) {
      const title = scenario === 'draft' ? 'a never-published draft' : 'unpublished changes instead of the published version';
      test(`${origin} origin, ${entry}: Prepublish captures ${title} with its styles`, async ({ page, browser }) => {
        // The real SDK normally owns this queue. Install it before plugin startup.
        await page.addInitScript(() => { window._si = []; });
        const externalRequests = [];
        await page.route('**/*', route => {
          const url = new URL(route.request().url());
          if (url.hostname === 'localhost' || url.protocol === 'data:') return route.continue();
          externalRequests.push(url.href);
          return route.abort();
        });
        const urls = await test.step('Given an administrator prepares real WordPress drafts and the plugin configuration', async () => {
          await page.goto('/wp-login.php');
          // WordPress focuses the username after a timer; wait before typing.
          await expect(page.locator('#user_login')).toBeFocused();
          await page.locator('#user_login').fill('admin');
          await page.locator('#user_pass').fill('password');
          await page.locator('#wp-submit').click();
          await expect(page).toHaveURL(/\/wp-admin\//);
          await page.goto('/wp-admin/tools.php?page=siteimprove-test-fixtures');
          await page.locator('select[name="origin"]').selectOption(origin);
          await page.locator('select[name="entry"]').selectOption(entry);
          await page.getByRole('button', { name: 'Prepare fixtures' }).click();
          await expect(page.locator('#configured')).toBeVisible();
          return {
            preview: await page.locator(`#${scenario}-preview`).getAttribute('href'),
            published: await page.locator('#revision-public').getAttribute('href'),
          };
        });
        const marker = scenario === 'draft' ? 'SITEIMPROVE DRAFT ONLY MARKER' : 'SITEIMPROVE VERSION B UNPUBLISHED';
        await test.step('And an anonymous visitor cannot retrieve the unpublished content', async () => {
          const anonymous = await browser.newContext();
          try {
            const response = await anonymous.request.get(scenario === 'draft' ? urls.preview : urls.published);
            const html = await response.text();
            expect(html).not.toContain(marker);
            if (scenario === 'revision') expect(html).toContain('SITEIMPROVE VERSION A PUBLISHED');
          } finally { await anonymous.close(); }
        });
        await test.step('When the administrator opens the preview, WordPress renders the unpublished content and styles', async () => {
          await page.goto(urls.preview);
          await expect(page.getByText(marker, { exact: true })).toBeVisible();
          await expect(page.getByText('SITEIMPROVE VERSION A PUBLISHED', { exact: true })).toHaveCount(0);
          const styled = page.locator('#siteimprove-style-fixture');
          await expect(styled).toHaveCSS('color', 'rgb(20, 40, 60)');
          await expect(styled).toHaveCSS('background-color', 'rgb(240, 230, 220)');
          await expect(styled).toHaveCSS('border-top-width', '3px');
        });
        const input = await page.evaluate(() => window.siteimprove_input);
        const preview = new URL(page.url());
        const publicOrigin = origin === 'split' ? 'https://delivery.example.test' : preview.origin;
        expect(new URL(input.url).origin).toBe(publicOrigin);
        const frames = [];
        page.on('request', request => {
          if (request.isNavigationRequest() && request.frame().parentFrame()) frames.push(request.url());
        });
        await test.step(`And Prepublish starts through the ${entry === 'toolbar' ? 'WordPress toolbar' : 'registered Siteimprove callback'}`, async () => {
          if (entry === 'toolbar') {
            await page.locator('.siteimprove-trigger-contentcheck a').click();
            await page.waitForFunction(() => window._si.some(command => command[0] === 'contentcheck-flat-dom'));
          } else {
            await page.evaluate(async () => {
              const callback = window._si.find(command => command[0] === 'registerPrepublishCallback')[1];
              window.capturedDocument = await callback();
            });
          }
        });
        await test.step('Then the document handed to Siteimprove contains the unpublished content and usable style references', async () => {
          const captured = await page.evaluate(entry => {
            const command = window._si.find(command => command[0] === 'contentcheck-flat-dom');
            const doc = entry === 'toolbar' ? command[1] : window.capturedDocument;
            const link = doc.querySelector('#siteimprove-test-style-css');
            return {
              text: doc.body.textContent,
              stylesheet: link?.href,
              inlineStyles: doc.querySelector('#siteimprove-test-style-inline-css')?.textContent,
              inlineBorder: doc.querySelector('#siteimprove-style-fixture')?.style.borderTop,
              pluginScripts: doc.querySelectorAll('script[src*="siteimprove/admin/js/siteimprove.js"]').length,
              url: entry === 'toolbar' ? command[2] : window._si.find(command => command[0] === 'input')[1],
              token: entry === 'toolbar' ? command[3] : window._si.find(command => command[0] === 'registerPrepublishCallback')[2],
            };
          }, entry);
          expect(captured.text).toContain(marker);
          expect(captured.text).not.toContain('SITEIMPROVE VERSION A PUBLISHED');
          expect(captured.stylesheet).toBe(`${preview.origin}/wp-content/mu-plugins/prepublish-fixture.css?ver=1`);
          expect(captured.inlineStyles).toContain('background-color: rgb(240, 230, 220)');
          expect(captured.inlineBorder).toBe('3px solid rgb(70, 80, 90)');
          expect(captured.pluginScripts, 'PHP must validate the preview nonce and omit the recursive plugin script').toBe(0);
          expect(captured.url).toBe(input.url);
          expect(captured.token).toBe('local-test-token');
          expect(frames).toHaveLength(1);
          const frameUrl = new URL(frames[0]);
          expect(frameUrl.origin).toBe(preview.origin);
          expect(frameUrl.pathname).toBe(preview.pathname);
          for (const [key, value] of preview.searchParams) expect(frameUrl.searchParams.get(key)).toBe(value);
          expect(frameUrl.searchParams.getAll('si_preview_nonce')).toEqual([input.nonce]);
          expect(externalRequests.some(url => new URL(url).hostname === 'delivery.example.test')).toBe(false);
          await expect(page.locator('#domIframe, #div_iframe, .si-overlay')).toHaveCount(0);
        });
      });
    }
  }
}
