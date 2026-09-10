const { test, expect } = require('@playwright/test');

// Environment readiness only. These tests do not claim a Siteimprove scan ran.
test('WordPress loads the plugin, lets an administrator preview a draft, and keeps the draft private', async ({ page, browser }) => {
  // The smoke test does not need the external overlay or an authenticated account.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === 'localhost' || url.protocol === 'data:'
      ? route.continue() : route.abort();
  });
  await test.step('Given an administrator signs in to the local WordPress test site', async () => {
    await page.goto('/wp-login.php');
    // WordPress focuses the username after a timer; wait before typing.
    await expect(page.locator('#user_login')).toBeFocused();
    await page.locator('#user_login').fill('admin');
    await page.locator('#user_pass').fill('password');
    await page.locator('#wp-submit').click();
    await expect(page).toHaveURL(/\/wp-admin\//);
  });
  await test.step('And the Siteimprove plugin is active', async () => {
    await page.goto('/wp-admin/plugins.php');
    await expect(page.locator('#deactivate-siteimprove')).toHaveCount(1);
  });
  const previewUrl = await test.step('When the administrator opens the draft preview', async () => {
    await page.goto('/wp-admin/edit.php?post_type=page');
    const row = page.locator('tr').filter({ has: page.locator('.row-title', { hasText: 'Prepublish draft fixture' }) });
    const previewUrl = await row.locator('.view a').getAttribute('href');
    expect(previewUrl).toContain('preview=true');
    await page.goto(previewUrl);
    return previewUrl;
  });
  await test.step('Then WordPress renders the draft content and loads the plugin script', async () => {
    await expect(page.getByText('SITEIMPROVE DRAFT ONLY MARKER', { exact: true })).toBeVisible();
    await expect(page.locator('script[src*="siteimprove/admin/js/siteimprove.js"]')).toHaveCount(1);
  });
  await test.step('And a visitor who is not signed in cannot retrieve that draft content', async () => {
    const anonymous = await browser.newContext();
    try {
      const response = await anonymous.request.get(previewUrl);
      expect((await response.text()).includes('SITEIMPROVE DRAFT ONLY MARKER'), 'Anonymous response must exclude the private draft').toBe(false);
    } finally {
      await anonymous.close();
    }
  });
  await test.step('And the published control page contains published content without the draft marker', async () => {
    await page.goto('/wp-admin/edit.php?post_type=page');
    const published = page.locator('tr').filter({ has: page.locator('.row-title', { hasText: 'Prepublish published control' }) });
    const publishedUrl = await published.locator('.view a').getAttribute('href');
    await page.goto(publishedUrl);
    await expect(page.getByText('SITEIMPROVE PUBLISHED CONTROL', { exact: true })).toBeVisible();
    await expect(page.getByText('SITEIMPROVE DRAFT ONLY MARKER', { exact: true })).toHaveCount(0);
  });
});
