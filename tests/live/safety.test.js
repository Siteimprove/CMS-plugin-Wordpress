const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loginToSiteimprove } = require('./run');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const delayedFailure = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Synthetic event failure')), 10));
const settings = {SITEIMPROVE_USERNAME:'synthetic-user',SITEIMPROVE_PASSWORD:'synthetic-password'};

test('A failed login click also handles the later popup timeout', async () => {
  const page = {
    waitForEvent: delayedFailure,
    locator: () => ({click:async () => { throw new Error('Synthetic click failure'); }}),
  };
  await assert.rejects(loginToSiteimprove(page, settings), /Synthetic click failure/);
  // node:test fails this test if the second promise becomes an unhandled rejection.
  await pause(30);
});

test('A failed password submit also handles the later popup-close failure', async () => {
  let clicks = 0;
  const button = {
    click:async () => { if (++clicks === 2) throw new Error('Synthetic submit failure'); },
    count:async () => 1, nth:() => button, isVisible:async () => true,
  };
  const popup = {
    locator:() => ({fill:async () => {}}), getByRole:() => button,
    waitForEvent: delayedFailure,
  };
  const page = {waitForEvent:async () => popup, locator:() => ({click:async () => {}})};
  await assert.rejects(loginToSiteimprove(page, settings), /Synthetic submit failure/);
  await pause(30);
});

test('The live runner and workflow do not capture or upload account artifacts', () => {
  const root = path.resolve(__dirname, '../..');
  const runner = fs.readFileSync(path.join(__dirname, 'run.js'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/prepublish-live.yml'), 'utf8');
  // The authenticated runner uses raw Playwright, which has no automatic failure
  // screenshots. Guard against introducing explicit capture or recording here.
  assert.doesNotMatch(runner, /\.screenshot\s*\(|\.tracing\s*\.|\brecordVideo\s*:|\brecordHar\s*:|\.storageState\s*\(/);
  assert.doesNotMatch(workflow, /uses:\s*[^\n]*(?:upload-artifact|upload-pages-artifact)/);
  assert.match(workflow, /run: npm run test:live\s/);
  assert.doesNotMatch(workflow, /run:\s*(?:npx playwright test|npm run test:live:fixture)/);
  const fixtureConfig = require('../../playwright.live-fixture.config');
  assert.equal(fixtureConfig.use.screenshot, 'off');
  assert.equal(fixtureConfig.use.trace, 'off');
  assert.equal(fixtureConfig.use.video, 'off');
});
