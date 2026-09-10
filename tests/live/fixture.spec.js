const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');

// Synthetic data only: validates the new PHP fixture, not a live Siteimprove scan.
for (const fixture of [{path:'/test-live/story.html',query:'lang=en'}, {path:'/',query:''}]) {
  test(`The live fixture preserves ${fixture.path} and renders a private, styled preview with no title`, async ({ page, browser }) => {
    await page.route('**/*', route => new URL(route.request().url()).hostname === 'localhost' ? route.continue() : route.abort());
    await page.goto('/wp-login.php');
    await expect(page.locator('#user_login')).toBeFocused();
    await page.locator('#user_login').fill('admin');
    await page.locator('#user_pass').fill('password');
    await page.locator('#wp-submit').click();
    await expect(page).toHaveURL(/\/wp-admin\//);
    const marker = `SI-LIVE-${randomUUID()}`;
    const urls = await test.step('Given a published control and a distinct unpublished autosave at the mapped local path', async () => {
      await page.goto('/wp-admin/tools.php?page=siteimprove-live-fixture');
      await page.locator('[name=fixture_path]').fill(fixture.path);
      await page.locator('[name=fixture_query]').fill(fixture.query);
      await page.locator('[name=fixture_marker]').fill(marker);
      await page.getByRole('button',{name:'Create live test fixture'}).click();
      return {preview:await page.locator('#live-preview').getAttribute('href'), published:await page.locator('#live-published').getAttribute('href')};
    });
    await test.step('Then the mapped path and query are preserved and the preview has an empty title', async () => {
      expect(new URL(urls.published).pathname).toBe(fixture.path);
      expect(new URL(urls.published).search.slice(1)).toBe(fixture.query);
      await page.goto(urls.preview);
      expect(new URL(page.url()).pathname).toBe(fixture.path);
      await expect(page.locator('head > title')).toHaveCount(1);
      await expect(page).toHaveTitle('');
      await expect(page.getByText(marker,{exact:true})).toBeVisible();
      await expect(page.getByText('SI-LIVE-PUBLISHED-CONTROL',{exact:true})).toHaveCount(0);
      await expect(page.locator('#si-live-style')).toHaveCSS('color','rgb(20, 40, 60)');
    });
    await test.step('And an anonymous visitor sees only the published control', async () => {
      const anonymous = await browser.newContext();
      try {
        const published = await anonymous.request.get(urls.published);
        expect(await published.text()).toContain('<title>Live test published control</title>');
        expect(await published.text()).toContain('SI-LIVE-PUBLISHED-CONTROL');
        expect(await published.text()).not.toContain(marker);
        const preview = await anonymous.request.get(urls.preview);
        expect(await preview.text()).not.toContain(marker);
      } finally { await anonymous.close(); }
    });
  });
}
