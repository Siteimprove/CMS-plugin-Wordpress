# Prepublish test scenarios

The automated tests use named **Given / When / Then** steps. These appear in
the console output, including GitHub Actions logs. The browser suite also includes
them in its HTML report (`npm run test:report`). A failed step identifies which
part of the scenario failed; technical assertion details remain available below it.
Both suites attach failure screenshots. The WordPress HTML report is available
with `npm run test:wordpress:report`. GitHub runs upload the reports as
`prepublish-test-report` and `prepublish-wordpress-report`, retained for 14 days.

## Automated today: browser capture

These tests run the plugin's JavaScript in Chromium and Firefox using local test
pages. Siteimprove is represented by a command queue and callback. No account is
required, and no real Siteimprove scan is performed.

### Capture a draft when WordPress and the public website use different origins

- **Given** an editor is viewing a WordPress draft and the public website uses a different origin.
- **When** Prepublish starts from the WordPress toolbar or the registered Siteimprove callback.
- **Then** the plugin captures the draft from WordPress, preserving its preview parameters and current preview nonce.
- **And** it hands over the draft content with the public URL and site token.
- **And** it removes the temporary frame and loading indicator.

### Capture a published page

- **Given** a published page uses the WordPress origin and its captured page has no WordPress toolbar.
- **When** either entry point starts Prepublish.
- **Then** capture succeeds with the published content and current preview nonce.
- **And** the temporary frame and loading indicator are removed.

### Handle an unreadable preview

Each condition below is a separate test, exercised through both entry points:

| Given | Then |
| --- | --- |
| The server blocks framing with X-Frame-Options | Capture fails, no content is submitted, and temporary elements are removed |
| The server blocks framing with Content Security Policy | Capture fails, no content is submitted, and temporary elements are removed |
| The preview redirects to another origin | Capture fails, no content is submitted, and temporary elements are removed |
| The preview never finishes loading | Capture fails after the 30-second limit, no content is submitted, and temporary elements are removed |

These checks cover the plugin's failure handling, not the SDK's error presentation.

### Replace an old preview nonce

- **Given** the preview URL already contains an old Siteimprove nonce (a preview security value).
- **When** the registered Siteimprove callback requests the page.
- **Then** capture succeeds and the frame URL contains exactly one current Siteimprove nonce.
- **And** the temporary frame and loading indicator are removed.

### Preserve page styles

- **Given** a styled preview uses a different origin from the public website.
- **When** either entry point captures the preview.
- **Then** the captured document retains its stylesheet link, style block and inline element style.
- **And** the stylesheet URL still resolves against WordPress, after the temporary frame is removed.

There are 15 scenarios per browser: seven through each entry point, plus nonce replacement.

## Automated today: WordPress environment readiness

This test uses the local WordPress installation. External browser requests are
blocked; it does not sign in to Siteimprove or request a scan.

- **Given** an administrator signs in and the plugin is active.
- **When** the administrator opens a draft preview.
- **Then** WordPress renders the draft content and loads the plugin script.
- **And** a visitor who is not signed in cannot retrieve that draft content.
- **And** the published control page contains its published content without the draft marker.

## Automated today: real WordPress draft capture

These tests connect real WordPress previews to the document handed over by the
plugin. They use placeholder service settings and a simulated SDK queue, with
external requests blocked. They do not perform a Siteimprove scan.

### Capture a never-published draft

- **Given** an administrator has a private WordPress draft.
- **And** an anonymous visitor cannot retrieve its content.
- **When** the administrator opens the preview and starts Prepublish.
- **Then** the document handed over contains the draft marker and preserves its styles.

### Capture an unpublished change to a published page

- **Given** the published page contains Version A and a real WordPress autosave contains Version B.
- **And** an anonymous visitor still receives Version A.
- **When** the administrator opens the autosave preview and starts Prepublish.
- **Then** the document handed over contains Version B and excludes Version A.
- **And** its styles are preserved.

Each scenario runs with same-origin and separate-origin Public URL settings,
through the toolbar and callback, in Chromium and Firefox. Each capture verifies
preview arguments, the PHP-validated Siteimprove nonce, the mapped public URL,
the site token and cleanup. CSS must apply in the original preview; the captured
document must retain its stylesheet URL and inline styles. Remote report rendering
is still unverified. The suite has 18 tests including readiness in each browser.

## Planned: authenticated Siteimprove checks

These scenarios are **not implemented or verified yet**. They require account
access, working authentication and URL mapping. The missing-title fixture also
still needs to be added. Run the small checks across selected WordPress setups;
the environment matrix is described in [TESTING.md](../TESTING.md).

### Retrieve existing Live page data

- **Given** the plugin's normal Public URL mapping identifies a known crawled page accessible to the account.
- **When** the editor opens that page's Live view through the plugin.
- **Then** Siteimprove returns existing data for the mapped page.

### Detect a missing title in a new Prepublish check

- **Given** an unpublished WordPress preview renders an empty or missing HTML title, and the account supports that check.
- **When** the editor starts Prepublish through the plugin.
- **Then** the plugin captures the current preview and hands it to Siteimprove.
- **And** the result for that new check reports the missing-title issue.
- **And** the report rerender contains the current draft marker and correctly renders one deliberately styled element (initially checked manually).

A blank editor title alone is insufficient: the rendered preview must contain the
deliberate issue. Existing crawl results do not prove that a new Prepublish check
worked. Layout, styling, highlighting and other SDK UI details are outside scope.
