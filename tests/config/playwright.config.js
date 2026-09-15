const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // CI reports must not collect contributor identities or source diffs.
  captureGitInfo: { commit: false, diff: false },
  testDir: path.join(root, './tests/browser'),
  timeout: 45000,
  outputDir: path.join(root, './test-results/browser'),
  expect: { timeout: 5000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list', { printSteps: true }], ['html', { open: 'never', outputFolder: path.join(root, 'playwright-report') }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
