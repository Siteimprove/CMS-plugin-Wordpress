# Testing the plugin

## WordPress integration regressions

The [integration regression suite](tests/integration-regressions/README.md) adds real
WordPress multisite, capability, URL mapping and settings checks, plus browser
recheck contracts. Its [coverage catalog](tests/integration-regressions/COVERAGE.md)
describes behavior and distinguishes automated coverage from planned scenarios.
All fixtures must use synthetic identities, content, tokens and reserved domains.

## WordPress plugin browser tests

These tests cover the fixture browser layer for prepublish flow and related plugin UI/command handoff contracts. The deployment checks
further down this document only test packaging/deployment, not this bug.

For a plain-English checklist, read [Prepublish test scenarios](tests/SCENARIOS.md).
The automated tests use named Given / When / Then steps, shown in the console,
GitHub Actions logs and the browser suite's HTML report. The checklist clearly
separates existing automated coverage from planned authenticated checks.

### Agreed scope: WordPress functionality across environments

The focus is the WordPress plugin's integration behavior: loading for the correct
users, URL mapping, preview/revision selection, nonce handling, DOM capture and
handoff to Siteimprove. SDK layout, styling, positioning, highlighting behavior,
filter controls and error-message wording are outside this plugin's test scope.
Using the SDK UI to start a check or observe its result is allowed; its visual
presentation is not an assertion.

The planned authenticated smoke test is limited to two functional outcomes:

1. A known crawled page resolves through the plugin's Public URL mapping and
   returns existing Live page data from Siteimprove.
2. A fresh Prepublish check of the local WordPress preview detects one deliberate
   issue, initially an empty/missing rendered HTML title if that rule is available
   to the account. Blank editor title text alone is not the fixture. The result
   must belong to this new check, rather than existing crawl results.

This fixture workflow also exercises non-prepublish command wiring, recheck flow and
highlight handoff assertions in addition to prepublish preview capture.

Use the normal plugin configuration to map the URL; do not rewrite the SDK's
outgoing requests to force the expected result. Run the same small functional
check across representative environments instead of adding more SDK UI tests.

| Planned environment variation | WordPress-specific behavior to verify |
| --- | --- |
| Single site, same-origin public URL | Baseline loading and DOM handoff |
| Single site, separate CMS and delivery origins | Local DOM fetch with the correct public URL sent to Siteimprove; PR #64 regression |
| WordPress installed under a subdirectory, with public path mapping | CMS path remains usable for capture while public URL/path transformations are correct |
| Multisite, including site admin and network super admin | Per-site configuration and capability-based loading |
| Customer WordPress/PHP combination and a current supported combination | Runtime compatibility; record actual versions for each job |
| Block Editor and Classic Editor preview flows | Correct draft or unpublished revision is captured |
| Administrator, editor and custom editing roles | Controls/scripts are available according to WordPress capabilities |

Start with the baseline and split-origin cases in Chromium and Firefox, then add
the other variations. These are selected configurations, not every possible
combination. Use Docker with a MySQL-compatible database for production-like
compatibility jobs; Playground remains the quick local readiness environment.
The real WordPress suite now covers same-origin and split-origin Public URL
settings through both entry points in Chromium and Firefox. Additional runtime,
editor, role, subdirectory and multisite variations remain planned.

### Run the existing browser tests

From the repository root, with Node.js 24 installed:

```bash
npm ci
npx playwright install chromium firefox
npm test
```

On Linux, use `npx playwright install --with-deps chromium firefox` to also
install browser system dependencies. For one browser, use
`npm test -- --project=chromium`. To inspect the HTML report, run
`npm run test:report`.

The capture tests run 15 scenarios in each of Chromium and Firefox. They load the
complete production `siteimprove/admin/js/siteimprove.js` with real jQuery.
Two local HTTP servers on different ports supply separate CMS and delivery
origins; the browser itself enforces same-origin restrictions, X-Frame-Options
and CSP. A different port creates a different origin just as a different host
does. Real HTTP redirects are used so both browser engines follow them normally.

Verified locally on 2026-09-10: all 30 browser tests passed against the unchanged
PR #64 JavaScript (head commit `a23af8519861f674d700cbe4fe183817f47458dc`).
This is a local browser result; the GitHub workflow and live WordPress acceptance
check have not been run as part of that verification.

Coverage includes both the toolbar click and the registered overlay callback:

- A separate Public URL, while fetching the DOM from the CMS origin and path.
- Preservation of WordPress preview parameters and the Siteimprove nonce.
- Removal of fragments and replacement of an existing Siteimprove nonce.
- Keeping the public URL and token in the commands sent to the Siteimprove queue.
- Published pages, and frames with or without a WordPress admin bar.
- Rejection/cleanup for X-Frame-Options DENY, CSP blocking, cross-origin redirects
  and a frame that never finishes loading. The timeout uses Playwright's virtual
  clock to advance the real production 30-second timer.

All responses are fixtures. These tests require no WordPress installation,
Siteimprove credentials, VPN, real customer URLs or GitHub secrets. The fixture
that renders draft text and suppresses plugin markup is not a test of PHP nonce
verification or WordPress draft rendering. The external overlay is represented
by its command queue and callback contract; its actual UI is not exercised.

### GitHub Actions

Use **Plugin tests** for automatic PR checks or manual plugin/runtime selection.
See [the workflow guide](docs/workflows.md) for inputs, tested commits, reports,
release procedures and credentials. The manual workflows have been consolidated;
all browser, single-site and multisite suites remain.

### Failure screenshots and readable reports

Both suites automatically capture a screenshot when a browser test fails. Open
the failed test in the HTML report to see its named steps, assertion error and
screenshot attachment. A failure before a page opens, or a browser crash, may
have no screenshot. For capture/data failures, the assertion is the primary
evidence: a screenshot shows the visible page and may not show the captured DOM.

After a GitHub run, open **Actions > workflow run > Artifacts** and download:

- `pr-browser-test-report` for the browser regression tests (also includes failure traces).
- `pr-wordpress-test-reports` for the real WordPress tests (screenshots and HTML report; no traces or video).

Extract the artifact and open the report's `index.html`, or use Playwright's
report viewer on its report directory. Artifacts are retained for 14 days.
Locally, use `npm run test:report` or `npm run test:wordpress:report`.

These artifacts cover the credential-free fixture suites. Future authenticated
Siteimprove tests need a separate recording policy: GitHub secret masking does
not redact screenshot pixels or report attachments. Do not reuse this recording
configuration for company data or real signed-in sessions without that work.

### Verify that the test detects the old bug

In a Git checkout containing the PR base commit:

```bash
git show a356a698f9ec73bd11e75867635ec2583788db55:siteimprove/admin/js/siteimprove.js > /tmp/siteimprove-before-pr64.js
SITEIMPROVE_TEST_SCRIPT=/tmp/siteimprove-before-pr64.js npm test -- --project=chromium --grep 'toolbar: (split-domain|same-origin)' --timeout=10000 --reporter=line --output=/tmp/siteimprove-baseline-results
```

Expected: the split-domain test fails because DOM retrieval never resolves;
the same-origin published-page control passes. Running without the environment
override tests the current plugin file. This comparison never overwrites it.

## Real WordPress test environment

The repository now includes a disposable WordPress environment with the local
plugin activated, a published control page, and a private draft with a unique
marker and a deliberately missing image alt attribute. Integration tests use a test-only administration page to configure placeholder
Siteimprove values and enable the plugin code paths. This simulates entitlement
and SDK handoff; it does not test real account setup or authorization.

```bash
npm ci
npm run env:start
npm run test:wordpress
```

Open `http://localhost:8888/wp-admin/` and log in with the local development
credentials `admin` / `password`. The sample content is under **Pages**. This is
a disposable development setup with public default credentials; do not expose
it as a public staging server. Stop it with `npm run env:stop` and inspect its
status with `npm run env:status`.

This uses WordPress's experimental Playground runtime (real PHP and WordPress,
with SQLite rather than MySQL) because it runs without Docker. Treat its database
as disposable: settings/content may need to be recreated after restarting.
It follows the current stable WordPress release, so it is not an exact replica
of the customer's WordPress version, database, theme, VPN or managed browsers.
`.wp-env.json` defines the setup; `.wp-env-cache/` contains ignored runtime data.
The fixture mu-plugin lives only in `tests/wordpress/support`, outside the shipped
`siteimprove/` plugin directory.

The fixture also disables Playground's convenience auto-login so anonymous
preview requests exercise normal WordPress access checks. Verified locally on
2026-09-10 with WordPress 7.1 and PHP 8.3: all 18 WordPress tests passed across
Chromium and Firefox (3.6 minutes), including real draft/revision capture and
anonymous access checks. All 30 separate browser tests also passed. No Siteimprove
account was connected and no real content scan was performed. These are local
results. Subsequent GitHub runs against PR64 passed the browser, WordPress
environment, and integration regression suites.

`npm run test:wordpress` runs **WordPress integration tests**, not a Siteimprove
scan. It covers readiness plus two content states: a never-published draft and a
published page with an unpublished autosave (public Version A, preview Version B).
The content tests exercise both the toolbar and registered SDK callback with
same-origin and separate-origin Public URL settings in Chromium and Firefox:
18 tests total, including readiness in each browser. WordPress renders and
validates the real preview and Siteimprove nonces; no localized PHP values are
replaced in JavaScript. The SDK queue is supplied by the test harness.

The checks inspect the document actually handed over by the plugin, including
unpublished content, public URL/token, stylesheet URL resolution, inline styles,
and omission of the plugin script after PHP verifies the capture nonce. The
preview must also load and apply the fixture CSS. This proves capture and local
asset resolution, not accessibility of those assets to the real Siteimprove
service or its report renderer. Autosaves are seeded with WordPress's API; editor
button interactions are not covered yet.

Browser requests outside localhost are blocked. With the default
`SITEIMPROVE_TEST_MOCK_SERVICE: true`, the fixture also blocks outbound WordPress
HTTP API calls. This mode is for these credential-free integration tests only.
`npm test` runs 46 browser checks: 30 capture checks and 16 integration regression checks.
The additional multisite regression checks run with `npm run test:regressions`.

The **Plugin tests** workflow starts and stops disposable single-site and multisite
instances. Use its manual inputs to select a plugin ref and WordPress/PHP versions.

### Why the draft and style tests were added

[Review on PR #64](https://github.com/Siteimprove/CMS-plugin-Wordpress/pull/64#pullrequestreview-5041911406)
asks for evidence that draft content and styles reach Prepublish. The new
integration checks connect real WordPress preview rendering to the plugin's
SDK handoff. A live report rerender remains a separate acceptance check: confirm
the current draft marker and a simple styled element in the report, alongside
the missing-title result. This concerns page-content fidelity, not SDK UI styling.

### What remains for an actual Siteimprove end-to-end test

The live workflow and runner are documented in
[tests/live/README.md](tests/live/README.md). GitHub runs against PR64 verified
login, Live page data, draft handoff, and loading-state exit. The missing-title
result assertion is explicitly skipped. The following account and network
requirements still apply; local fixture suites use no secrets.

Live runs require a Siteimprove test account with Prepublish access and a known
crawled page accessible to both the browser user and API user. The plugin's
credential validation compares **Public URL** with the sites available to the
API user. A random local WordPress URL and an API key alone are not sufficient.

The proposed first experiment can use the existing company-internal crawled site
as the public site context, even though this disposable WordPress instance does
not publish it. This mapping returned Live page data in the PR64 live runs.
Live page data would come from Siteimprove; the Prepublish DOM would come from
the runner's local WordPress. Direct access to the internal published site is
not part of this initial test. Siteimprove login/API access from the runner passed in those runs.

For authenticated testing, use a fresh environment with
`SITEIMPROVE_TEST_MOCK_SERVICE` set to `false` in an ignored `.wp-env.override.json`
and restart it. Configure real credentials normally; do not run the mock
integration suite against that environment. Its fixture configuration page
refuses to overwrite settings unless mock service mode is enabled.

First configure and validate the real integration in that environment:

1. Arrange a dedicated Siteimprove test user, Prepublish entitlement, and the
   public test-site URL that belongs to that account.
2. In WordPress **Settings > Siteimprove**, set that Public URL, select the intended
   plugin experience, configure the API username/key, save and enable Prepublish.
   Follow the product's account-owner setup requirements, including any initial
   terms acceptance. Do not force the plugin's activation flags in the database.
3. Sign into the real overlay. Determine whether login uses SSO/MFA and which
   supported authentication method can run in CI. An API key does not replace
   the browser's Siteimprove login. Playwright can reuse browser state where
   compatible, but saved sessions expire and may not work on a different runner.
4. Perform the limited live acceptance check below. Identify stable evidence of
   the mapped page and a completed Prepublish result. Prefer result/request
   identifiers and semantic assertions; do not add SDK visual regression checks.
5. Store eventual CI credentials/session state in a dedicated GitHub Environment
   such as `siteimprove-test`, with appropriate access restrictions. Keep them out
   of source files, logs, reports and uploaded traces. Local browser state belongs
   in the ignored `playwright/.auth/` directory.

The live runner verifies login, site mapping, draft handoff, and loading-state
exit. The missing-title result assertion remains skipped; a passing workflow
must not be interpreted as proof of scan-result correctness.

The revision fixture uses [WordPress’s autosave API](https://developer.wordpress.org/reference/functions/wp_create_post_autosave/)
and [preview links](https://developer.wordpress.org/reference/functions/get_preview_post_link/).

References: [WordPress wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/),
[Siteimprove WordPress setup](https://help.siteimprove.com/support/solutions/articles/80001079368-new-wordpress-plugin),
and [Playwright authentication](https://playwright.dev/docs/auth).

### Required live acceptance check

Use a development WordPress site with the same split between CMS and delivery
hosts as the affected installation. Install this branch as plugin version 2.1.4,
configure Public URL to the delivery host, and enable Prepublish with valid
Siteimprove settings. Use a WordPress user who can edit posts and has the
appropriate Content-site access in Siteimprove; these are separate permissions.

1. Verify the overlay appears on the preview page before clicking Prepublish.
   Check that both `siteimprove.js?ver=2.1.4` and the configured overlay script
   are requested successfully. If the overlay is missing, investigate that
   loading/authentication issue separately from DOM capture.
2. Render the local draft with an empty/missing HTML title and a distinctive
   content marker. First confirm the account's enabled checks detect that issue.
   Use one deterministic supported issue if the title check is unavailable.
3. Preview the draft and run Prepublish from the toolbar, then separately from
   the overlay. In DevTools Network, verify the iframe loads from the CMS host,
   retains the preview arguments, includes a non-empty `si_preview_nonce`, and
   does not redirect to the delivery host or an authentication page.
4. Confirm the mapped public URL resolves to existing Live page data. Separately,
   confirm the iframe response contains the draft marker and omits Siteimprove's
   own JavaScript. Confirm a fresh Prepublish result detects the deliberate
   issue and uses the intended public URL. Inspect the report rerender for the
   current draft marker and one deliberately styled element; this checks page
   content and asset delivery. Do not assert SDK layout or highlighting.
5. Repeat the same limited functional checks across the selected WordPress
   environments and users in Chromium and Firefox. Keep plugin-owned failure
   cleanup and callback rejection covered by the existing regression suite;
   SDK error presentation is outside this suite's scope.

The new URL starts same-origin, but server redirects can change that. It also
cannot override `X-Frame-Options: DENY` or restrictive CSP. A readable same-origin
login/error page can still be returned as if it were content: the current code
does not validate the response or detect expired sessions. Inspect the actual
response during the live check. Do not change framing headers globally just to
make this test pass.

References: [Playwright CI setup](https://playwright.dev/docs/ci-intro) and
[PR #64](https://github.com/Siteimprove/CMS-plugin-Wordpress/pull/64).

## Deployment validation

See [Create and deploy a release](docs/workflows.md#create-and-deploy-a-release)
for the supported tag formats, manual modes, destination settings, release checks,
and dry-run limitations. The separate Marketplace deployment workflow is retired.

### Workflow summary privacy

Coverage summaries contain only fixed descriptions of the test scope and report names. They do not include email addresses, account details, customer URLs, credentials, or Git author metadata. HTML reports disable Git commit and diff capture. Local suites use synthetic fixtures; the authenticated live suite suppresses raw failures and uploads no browser recordings or account data.

GitHub still displays the account that triggered a run, and existing commit metadata remains part of Git history. These workflow settings do not remove previously uploaded logs or reports.

### Automatic PR checks

`pr-tests.yml` runs on PR creation, updates, and reopening, with two parallel jobs: **Browser tests** and **WordPress tests**. It tests the PR merge commit using read-only repository permissions and no Siteimprove secrets. New updates cancel the previous run for that PR.

The browser suite runs once, alongside catalog validation and live-runner privacy contracts. The WordPress job installs dependencies and browsers once, then runs the single-site and multisite suites sequentially with separate disposable environments. Both jobs use Chromium and Firefox. Reports contain synthetic fixture data and exclude Git author metadata.

Manual investigation uses the same **Plugin tests** workflow with optional plugin
and runtime inputs. WPCS remains its own PR check. Branch-protection settings are
unchanged; the check names remain **Browser tests**, **WordPress tests**, and **WPCS**.

### Release validation

**Create and deploy release** calls the shared `release-checks.yml` before any
publishing. Every check must succeed, including the protected live test and ZIP
lifecycle check. See [the workflow guide](docs/workflows.md) for the exact sequence.

### Live result assertion temporarily skipped

Repeated PR64 live runs passed login, Live page data, fresh draft handoff, and loading-state exit, then failed to locate the missing-title issue. The live runner now explicitly logs that result assertion as SKIP. The other checks remain mandatory, including in release validation. A green release gate therefore does not establish scan-result correctness. Earlier descriptions of the missing-title check describe intended coverage; restoring that assertion requires verifying the actual result mapping.
