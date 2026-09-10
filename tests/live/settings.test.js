const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixtureLocation, loadSettings, isLivePageData } = require('./settings');

test('A crawled page maps to a local fixture without changing its query', () => {
  assert.deepEqual(fixtureLocation('https://public.example.test/site/', 'https://public.example.test/site/articles/example.html?lang=en'), {
    path:'/articles/example.html', query:'lang=en', publicBase:'https://public.example.test/site',
    crawledUrl:'https://public.example.test/site/articles/example.html?lang=en',
  });
});
test('A different host or a path outside the public base is rejected', () => {
  for (const url of ['https://other.example.test/site/page', 'https://public.example.test/site-other/page']) {
    assert.throws(() => fixtureLocation('https://public.example.test/site', url));
  }
});
test('Credentials, fragments and reserved preview parameters are rejected', () => {
  for (const url of ['https://user:pass@public.example.test/page', 'https://public.example.test/page#part', 'https://public.example.test/page?preview=true']) {
    assert.throws(() => fixtureLocation('https://public.example.test', url));
  }
});
test('Missing secrets fail before any browser or network activity', () => assert.throws(() => loadSettings({})));
test('Zero issues still counts as existing Live page data', () => {
  assert.equal(isLivePageData({authed:true,error:'None',issues:0,mainUrl:'https://contentassistant.eu.siteimprove.com/example'}),true);
});
test('Unauthenticated, missing-page and incomplete responses cannot pass as Live page data', () => {
  for (const body of [null, {}, {authed:false,error:'None',issues:3,mainUrl:'example'}, {authed:true,error:'NoPageFound',issues:0,mainUrl:'example'}, {authed:true,error:'None',issues:null,mainUrl:'example'}]) {
    assert.equal(isLivePageData(body),false);
  }
});

test('Configuration failures do not print supplied values or raw exception details', () => {
  const { spawnSync } = require('node:child_process');
  const { SECRET_NAMES } = require('./settings');
  const env = { ...process.env, SITEIMPROVE_RUN_LIVE:'1' };
  delete env.GITHUB_STEP_SUMMARY;
  for (const name of SECRET_NAMES) env[name] = 'private-sentinel-do-not-log';
  const result = spawnSync(process.execPath, [require.resolve('./run')], {env,encoding:'utf8',timeout:5000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/FAIL: configuration/);
  assert(!`${result.stdout}${result.stderr}`.includes('private-sentinel-do-not-log'));
});
