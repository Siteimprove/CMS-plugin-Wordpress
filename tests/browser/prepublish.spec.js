const { test, expect } = require('@playwright/test');
const path = require('node:path');
const http = require('node:http');

let CMS;
let DELIVERY;
const servers = [];
const NONCE = 'test-preview-nonce';
const TOKEN = 'test-site-token';
const pluginPath = process.env.SITEIMPROVE_TEST_SCRIPT ||
  path.resolve(__dirname, '../../siteimprove/admin/js/siteimprove.js');

// HTTP responses and PHP-localized globals are fixtures. The whole production
// script, jQuery, iframe navigation, DOM access and browser security are real.
// No request reaches WordPress, Siteimprove or a customer environment.
async function listen(handler) {
  const server = http.createServer(handler);
  servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

test.afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => {
    server.closeAllConnections();
    server.close(resolve);
  })));
});

async function setup(page, options = {}) {
  const previewPath = options.previewPath ||
    '/cms/draft/?preview=true&preview_id=42&preview_nonce=wp-test#draft-section';
  const state = { frames: [], errors: [], pageErrors: [] };
  page.on('console', message => {
    if (message.type() === 'error') state.errors.push(message.text());
  });
  page.on('pageerror', error => state.pageErrors.push(error.message));

  const handler = (request, response) => {
    const isFrame = request.headers['sec-fetch-dest'] === 'iframe';
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/assets/prepublish.css') {
      response.writeHead(200, { 'content-type': 'text/css' });
      return response.end('#style-fixture { color: rgb(20, 40, 60); }');
    }
    if (isFrame) {
      state.frames.push(url.href);
      if (options.failure === 'timeout') return; // Deliberately never respond.
      if (options.failure === 'redirect' && url.origin === CMS) {
        response.writeHead(302, { location: `${DELIVERY}/redirected/` });
        return response.end();
      }
    }

    const headers = { 'content-type': 'text/html' };
    if (isFrame && options.failure === 'xfo') headers['x-frame-options'] = 'DENY';
    else if (isFrame && options.failure === 'csp') headers['content-security-policy'] = "frame-ancestors 'none'";
    else if (url.origin === CMS) headers['x-frame-options'] = 'SAMEORIGIN';

    const preview = url.searchParams.get('preview') === 'true';
    const toolbar = '<div id="wpadminbar"><div class="siteimprove-trigger-contentcheck"><a href="#">Prepublish</a></div></div>';
    response.writeHead(200, headers);
    response.end(`<!doctype html><html><head><title>Fixture</title><link id="fixture-stylesheet" rel="stylesheet" href="/assets/prepublish.css"><style id="fixture-inline-style">#style-fixture { background-color: rgb(240, 230, 220); }</style></head><body>
        ${options.noAdminBar && isFrame ? '' : toolbar}
        <div id="style-fixture" style="border-top: 3px solid rgb(70, 80, 90)">STYLE CAPTURE MARKER</div><main id="content">${preview ? 'DRAFT ONLY CONTENT' : 'PUBLISHED CONTENT'}</main>
        ${isFrame && url.searchParams.get('si_preview_nonce') !== NONCE ? '<div id="plugin-would-load">Invalid or missing nonce</div>' : ''}
      </body></html>`);
  };
  CMS = await listen(handler);
  DELIVERY = await listen(handler);
  const publicUrl = options.sameOrigin ? `${CMS}/published/` : `${DELIVERY}/draft/`;
  await page.goto(`${CMS}${previewPath}`);
  await page.evaluate(({ publicUrl, nonce, token, version }) => {
    window._si = [];
    window.php_vars = { has_api_key: '1', prepublish_allowed: '1', prepublish_enabled: '1' };
    window.siteimprove_input = { url: publicUrl, token, version, is_content_page: true, nonce };
  }, { publicUrl, nonce: NONCE, token: TOKEN, version: options.version ?? '1' });
  await page.addScriptTag({ path: require.resolve('jquery/dist/jquery.js') });
  await page.addScriptTag({ path: pluginPath });
  await page.waitForFunction(() => typeof window.siGetCurrentUrlAndToken === 'function');
  return state;
}

async function start(page, entry) {
  if (entry === 'toolbar') {
    await page.getByRole('link', { name: 'Prepublish', exact: true }).click();
  } else {
    await page.evaluate(() => {
      const callback = window._si.find(command => command[0] === 'registerPrepublishCallback')[1];
      // Invoke with no receiver, as the external overlay is allowed to do.
      window.callbackResult = { status: 'pending' };
      callback().then(
        dom => { window.callbackResult = { status: 'resolved', dom }; },
        error => { window.callbackResult = { status: 'rejected', message: error.message }; },
      );
    });
  }
}

async function readResult(page, entry) {
  await page.waitForFunction(entry => entry === 'toolbar'
    ? window._si.some(command => command[0] === 'contentcheck-flat-dom')
    : window.callbackResult?.status === 'resolved', entry);
  return page.evaluate(entry => {
    const command = window._si.find(command => command[0] === 'contentcheck-flat-dom');
    const dom = entry === 'toolbar' ? command[1] : window.callbackResult.dom;
    return {
      content: dom.querySelector('#content')?.textContent,
      disabledBar: dom.querySelector('#wpadminbar-disabled')?.innerHTML,
      activeBar: Boolean(dom.querySelector('#wpadminbar')),
      invalidNonce: Boolean(dom.querySelector('#plugin-would-load')),
      url: entry === 'toolbar' ? command[2] : window._si.find(command => command[0] === 'input')[1],
      token: entry === 'toolbar' ? command[3] : window._si.find(command => command[0] === 'registerPrepublishCallback')[2],
    };
  }, entry);
}

async function expectCleanup(page) {
  await expect(page.locator('#div_iframe, #domIframe, .si-overlay')).toHaveCount(0);
}

// These names and steps appear in the console and the downloadable HTML report.
for (const entry of ['toolbar', 'overlay']) {
  const startDescription = entry === 'toolbar'
    ? 'When the editor starts Prepublish from the WordPress toolbar'
    : 'When Siteimprove requests the page through the registered callback';

  test(`${entry}: split-domain preview checks the draft and keeps the public URL`, async ({ page }) => {
    const state = await test.step('Given the draft and the public website use different origins', () =>
      setup(page, { version: entry === 'toolbar' ? '0' : '1' }));
    await test.step(startDescription, () => start(page, entry));
    await test.step('Then the plugin hands over draft content with the public URL and site token', async () => {
      expect(await readResult(page, entry)).toEqual({
        content: 'DRAFT ONLY CONTENT', disabledBar: '<div></div>', activeBar: false,
        invalidNonce: false, url: `${DELIVERY}/draft/`, token: TOKEN,
      });
    });
    await test.step('And it loads the preview from WordPress with its preview parameters and current nonce', async () => {
      expect(state.frames).toHaveLength(1);
      const frameUrl = new URL(state.frames[0]);
      expect(frameUrl.origin).toBe(CMS);
      expect(frameUrl.pathname).toBe('/cms/draft/');
      expect(Object.fromEntries(frameUrl.searchParams)).toEqual({
        preview: 'true', preview_id: '42', preview_nonce: 'wp-test', si_preview_nonce: NONCE,
      });
      expect(frameUrl.hash).toBe('');
      expect(state.pageErrors).toEqual([]);
    });
    await test.step('And it removes the temporary frame and loading indicator', () => expectCleanup(page));
  });

  test(`${entry}: same-origin published page works without a WordPress toolbar in the captured page`, async ({ page }) => {
    const state = await test.step('Given a published page on the WordPress origin with no toolbar in its frame', () =>
      setup(page, { previewPath: '/published/', sameOrigin: true, noAdminBar: true }));
    await test.step(startDescription, () => start(page, entry));
    await test.step('Then the plugin captures the published content using the current nonce', async () => {
      expect(await readResult(page, entry)).toMatchObject({ content: 'PUBLISHED CONTENT', activeBar: false, invalidNonce: false });
      expect(new URL(state.frames[0]).searchParams.get('si_preview_nonce')).toBe(NONCE);
    });
    await test.step('And it removes the temporary frame and loading indicator', () => expectCleanup(page));
  });

  test(`${entry}: draft capture preserves styles and resolves relative assets against WordPress`, async ({ page }) => {
    await test.step('Given a styled preview with a separate public website', () => setup(page));
    await test.step('And the preview stylesheet loads in the browser', async () => {
      await expect(page.locator('#style-fixture')).toHaveCSS('color', 'rgb(20, 40, 60)');
    });
    await test.step(startDescription, () => start(page, entry));
    await readResult(page, entry);
    await test.step('Then the captured document retains its stylesheet link, style block and inline style', async () => {
      const styles = await page.evaluate(entry => {
        const doc = entry === 'toolbar'
          ? window._si.find(command => command[0] === 'contentcheck-flat-dom')[1]
          : window.callbackResult.dom;
        return {
          href: doc.querySelector('#fixture-stylesheet')?.href,
          block: doc.querySelector('#fixture-inline-style')?.textContent,
          border: doc.querySelector('#style-fixture')?.style.borderTop,
        };
      }, entry);
      expect(styles.href).toBe(`${CMS}/assets/prepublish.css`);
      expect(styles.block).toContain('background-color: rgb(240, 230, 220)');
      expect(styles.border).toBe('3px solid rgb(70, 80, 90)');
    });
    await test.step('And it removes the temporary frame and loading indicator', () => expectCleanup(page));
  });

  const failures = {
    xfo: 'the server blocks framing with X-Frame-Options',
    csp: 'the server blocks framing with Content Security Policy',
    redirect: 'the preview redirects to another origin',
    timeout: 'the preview never finishes loading',
  };
  for (const [failure, description] of Object.entries(failures)) {
    test(`${entry}: capture fails safely when ${description}`, async ({ page }) => {
      const state = await test.step(`Given ${description}`, async () => {
        const state = await setup(page, { failure });
        if (failure === 'timeout') {
          await page.clock.install();
          await page.clock.pauseAt(new Date());
        }
        return state;
      });
      await test.step(startDescription, () => start(page, entry));
      if (failure === 'timeout') {
        await test.step('And the 30-second loading limit passes', async () => {
          await expect.poll(() => state.frames.length).toBe(1);
          await page.clock.fastForward(31000);
        });
      }
      await test.step('Then the plugin reports capture failure without submitting content or throwing an unhandled error', async () => {
        if (entry === 'overlay') {
          await expect.poll(() => page.evaluate(() => window.callbackResult.status)).toBe('rejected');
          if (failure === 'timeout') {
            expect(await page.evaluate(() => window.callbackResult.message)).toContain('timed out after 30000ms');
          }
        } else {
          await expect.poll(() => state.errors.some(message => message.includes('could not read the page'))).toBe(true);
        }
        expect(await page.evaluate(() => window._si.filter(command => command[0] === 'contentcheck-flat-dom').length)).toBe(0);
        expect(state.pageErrors).toEqual([]);
      });
      await test.step('And it removes the temporary frame and loading indicator', () => expectCleanup(page));
    });
  }
}

test('An old Siteimprove preview nonce is replaced with exactly one current nonce', async ({ page }) => {
  const state = await test.step('Given the preview URL already contains an old Siteimprove nonce', () =>
    setup(page, { previewPath: '/draft/?preview=true&si_preview_nonce=old#section' }));
  await test.step('When Siteimprove requests the page through the registered callback', () => start(page, 'overlay'));
  await test.step('Then capture succeeds and the frame URL contains only the current Siteimprove nonce', async () => {
    await readResult(page, 'overlay');
    expect(new URL(state.frames[0]).searchParams.getAll('si_preview_nonce')).toEqual([NONCE]);
  });
  await test.step('And it removes the temporary frame and loading indicator', () => expectCleanup(page));
});
