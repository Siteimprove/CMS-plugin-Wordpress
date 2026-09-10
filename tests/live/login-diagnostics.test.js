const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loginPageState, loginToSiteimprove } = require('./run');
const sentinel = 'synthetic-private-value';

function popupFixture(failPassword = false) {
  const button = {click:async () => {},count:async () => 1,nth:() => button,isVisible:async () => true};
  return {
    isClosed:() => false,
    url:() => `https://identity.siteimprove.com/login?private=${sentinel}`,
    locator:selector => ({
      fill:async () => { if (failPassword && selector.includes('password')) throw new Error(sentinel); },
      first:() => ({isVisible:async () => selector.includes('password')}),
    }),
    getByRole:() => button, waitForEvent:async () => {},
  };
}

test('Login diagnostics return only fixed boolean fields, never account values or URLs', async () => {
  const state = await loginPageState(popupFixture());
  assert.deepEqual(state, {popup_open:true,identity_origin:true,username_visible:false,
    password_visible:true,alert_visible:false,one_time_code_visible:false,captcha_frame_visible:false});
  assert.doesNotMatch(JSON.stringify(state), new RegExp(sentinel));
  assert.deepEqual(await loginPageState(undefined), {popup_open:false,identity_origin:false,username_visible:false,
    password_visible:false,alert_visible:false,one_time_code_visible:false,captcha_frame_visible:false});
});

test('A password-entry failure reports its precise phase and safe state', async () => {
  const popup = popupFixture(true);
  const page = {waitForEvent:async () => popup,locator:() => ({click:async () => {}})};
  let phase;
  const reports = [];
  await assert.rejects(loginToSiteimprove(page, {SITEIMPROVE_USERNAME:sentinel,SITEIMPROVE_PASSWORD:sentinel},
    async (name, callback) => { phase = name; return callback(); }, state => reports.push(state)));
  assert.equal(phase, 'Login: enter password');
  assert.equal(reports.length, 1);
  assert.equal(reports[0].password_visible, true);
  assert.doesNotMatch(JSON.stringify({phase,reports}), new RegExp(sentinel));
});

test('Successful login completes each stage without collecting failure diagnostics', async () => {
  const popup = popupFixture();
  const page = {waitForEvent:async () => popup,locator:() => ({click:async () => {}})};
  const phases = [];
  let reports = 0;
  await loginToSiteimprove(page, {SITEIMPROVE_USERNAME:sentinel,SITEIMPROVE_PASSWORD:sentinel},
    async (name, callback) => { phases.push(name); return callback(); }, () => reports++);
  assert.equal(phases.length, 6);
  assert.equal(phases.at(-1), 'Login: submit credentials and await popup close');
  assert.equal(reports, 0);
});
