const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // CI reports must not collect contributor identities or source diffs.
  captureGitInfo: { commit: false, diff: false },
  testDir: './tests/integration-regressions',
  timeout: 60000,
  expect: { timeout: 5000 },
  workers: 1, // Tests reset options in one disposable multisite installation.
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  outputDir: './test-results/integration-regressions',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-integration-regressions-report' }],
    ['json', { outputFile: 'test-results/integration-regressions-results.json' }],
  ],
  projects: ['chromium', 'firefox'].map(browserName => ({ name: browserName, use: { browserName } })),
  use: { baseURL: 'http://127.0.0.1', trace: 'off', screenshot: 'only-on-failure', video: 'off' },
});
