const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // CI reports must not collect contributor identities or source diffs.
  captureGitInfo: { commit: false, diff: false },
  testDir: './tests/browser',
  timeout: 45000,
  outputDir: './test-results/browser',
  expect: { timeout: 5000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list', { printSteps: true }], ['html', { open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
  ],
});
