const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // Keep contributor identities and source diffs out of reports.
  captureGitInfo: { commit: false, diff: false },
  testDir: path.join(root, './tests/wordpress'),
  timeout: 60000,
  outputDir: path.join(root, './test-results/wordpress'),
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [
    ['list', { printSteps: true }],
    ['html', { open: 'never', outputFolder: path.join(root, 'playwright-wordpress-report') }],
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
  use: {
    baseURL: 'http://localhost:8888',
    // This suite uses only disposable local fixtures and placeholder credentials.
    // A future authenticated suite needs its own recording/privacy configuration.
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
