# Testing the plugin

## Prepublish test

Run these tests for the cross-origin Prepublish issue. The deployment checks
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

The suite runs 15 scenarios in each of Chromium and Firefox. It loads the
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

Both new Prepublish workflows run only by manual dispatch; pushing a commit or
opening/updating a PR does not trigger them. Commit the workflows, package files
(including the lockfile), Playwright configs, tests, and documentation to the PR
branch. A manually started **Prepublish test** run attaches an HTML report plus
failure traces/screenshots. It has read-only repository permissions and does not deploy.
The manual **Run workflow** button is available once the workflow exists on the
repository's default branch. Both workflows accept `plugin_ref`: enter a branch,
tag or commit such as `refs/pull/64/head`. The workflow records the resolved
plugin commit and checks it out separately under `.plugin-under-test/`; the tests
and configuration come from the workflow branch. Blank means this workflow's
commit. Before PR #64 is merged, running against the unchanged default-branch
plugin is expected to fail the regression scenarios. Select PR #64 explicitly to
verify its fix.

The WordPress workflow writes an ignored `.wp-env.override.json` to install the
selected plugin. It does not overwrite or commit production plugin files.

The existing WPCS workflow still runs on pull requests. For a review-only upload,
`[skip ci]` in the head commit message skips GitHub Actions `push` and
`pull_request` runs for that commit, including WPCS. Required skipped checks may
remain pending and block merging. It does not block manual runs or other event
types. To prevent a workflow from running at all, a maintainer can disable it in
GitHub Actions. Push a feature branch without release tags; the existing release
and deployment workflows have their own triggers.

See [GitHub skip instructions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)
and [disabling workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).

### Failure screenshots and readable reports

Both suites automatically capture a screenshot when a browser test fails. Open
the failed test in the HTML report to see its named steps, assertion error and
screenshot attachment. A failure before a page opens, or a browser crash, may
have no screenshot. For capture/data failures, the assertion is the primary
evidence: a screenshot shows the visible page and may not show the captured DOM.

After a GitHub run, open **Actions > workflow run > Artifacts** and download:

- `prepublish-test-report` for the browser regression tests (also includes failure traces).
- `prepublish-wordpress-report` for the real WordPress tests (screenshots and HTML report; no traces or video).

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
results; the GitHub workflows have not been run.

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
The existing `npm test` still runs the separate 30 browser regression checks.

The manual **Prepublish WordPress environment** GitHub workflow starts a fresh
instance on the selected branch, runs the integration tests in both browsers and
stops it. The site
exists only on the runner while the job executes; GitHub does not host a lasting,
public test site. As with the other manual workflow, it must first be added to
the default branch, and the selected workflow branch must contain its supporting files. Use
`plugin_ref` to select a different plugin version, including PR #64.

### Why the draft and style tests were added

[Morten’s review on PR #64](https://github.com/Siteimprove/CMS-plugin-Wordpress/pull/64#pullrequestreview-5041911406)
asks for evidence that draft content and styles reach Prepublish. The new
integration checks connect real WordPress preview rendering to the plugin's
SDK handoff. A live report rerender remains a separate acceptance check: confirm
the current draft marker and a simple styled element in the report, alongside
the missing-title result. This concerns page-content fidelity, not SDK UI styling.

### What remains for an actual Siteimprove end-to-end test

A first manual live workflow and runner are now prepared in
[tests/live/README.md](tests/live/README.md). They have not been authenticated or
run against Siteimprove. The following account and network requirements still
apply; PR #65’s existing tests continue to use no secrets.

We still need a Siteimprove test account with Prepublish access and a known
crawled page accessible to both the browser user and API user. The plugin's
credential validation compares **Public URL** with the sites available to the
API user. A random local WordPress URL and an API key alone are not sufficient.

The proposed first experiment can use the existing company-internal crawled site
as the public site context, even though this disposable WordPress instance does
not publish it. Whether that mapping works with the real SDK/backend is unverified.
Live page data would come from Siteimprove; the Prepublish DOM would come from
the runner's local WordPress. Direct access to the internal published site is
not part of this initial test. Siteimprove login/API access from the runner still
needs verification; use approved corporate network access if required.

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

The initial live runner and authenticated GitHub job are **prepared but unverified
against the account**. The first authorized run must verify the actual login,
site mapping and fresh scan results. The integration workflow must not be interpreted
as proof that a Siteimprove scan passed.

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

# Testing WordPress Deployment Action

This guide covers how to test the unified WordPress deployment action safely.

## 🧪 Testing Options

### 1. **Local Testing Script (Recommended for Quick Tests)**

The fastest way to test the deployment process locally:

```bash
# Make script executable (if not already)
chmod +x scripts/test-deploy.sh

# Run with default values
./scripts/test-deploy.sh

# Run with custom values
./scripts/test-deploy.sh "2.0.9-test" "siteimprove" "wordpress-assets"

# Clean up after testing
rm -rf deploy
```

**What it does:**
- Simulates the file preparation process (dry-run mode)
- Uses the same deployment script as GitHub Actions
- Shows exactly what files would be deployed
- No network connections or external dependencies
- Creates only the `deploy/` directory (no SVN operations)

### 2. **GitHub Actions Dry Run (Recommended for CI/CD Testing)**

Use the unified action with dry-run enabled:

1. Go to **Actions** tab in your GitHub repository
2. Select **"Deploy to WordPress Marketplace"**
3. Click **"Run workflow"**
4. Set **dry-run** to `true`
5. Set **test-mode** to `true` (optional)
6. Enter test version (e.g., `2.0.8-test`)
7. Click **"Run workflow"**

**What it does:**
- Runs the actual GitHub Action
- Performs all deployment steps except SVN commit
- Shows detailed preview of what would be deployed
- Uses the same logic as production deployment

### 3. **Test SVN Repository (Recommended for Full Testing)**

Set up a test SVN repository to test the complete deployment process:

#### Option A: Use GitHub as SVN Repository
```bash
# Create a test repository on GitHub
# Then use GitHub's SVN interface
# URL: https://github.com/your-username/test-wordpress-deploy
```

#### Option B: Use a Local SVN Repository
```bash
# Install SVN locally
brew install subversion  # macOS
sudo apt-get install subversion  # Ubuntu

# Create local SVN repository
svnadmin create test-svn-repo
svn mkdir file:///path/to/test-svn-repo/trunk -m "Create trunk"
svn mkdir file:///path/to/test-svn-repo/tags -m "Create tags"
svn mkdir file:///path/to/test-svn-repo/assets -m "Create assets"
```

#### Option C: Use a Cloud SVN Service
- **Assembla**: Free SVN hosting
- **Beanstalk**: SVN hosting with free tier
- **Visual Studio Team Services**: Free SVN repositories

## 🔧 Configuration for Testing

### GitHub Secrets for Testing
Add these to your repository secrets:

```
TEST_SVN_USERNAME=your-test-username
TEST_SVN_PASSWORD=your-test-password
```

### GitHub Variables for Testing
Add these to your repository variables:

```
TEST_SVN_URL=https://your-test-svn-repo.com/siteimprove-test/
WP_PLUGIN_SLUG=siteimprove
WP_ASSETS_DIR=wordpress-assets
```

## 📋 Testing Checklist

### Before Testing
- [ ] Plugin files are in the `siteimprove/` directory
- [ ] Main plugin file (`siteimprove.php`) has correct header
- [ ] Version number is properly formatted
- [ ] Assets directory exists (if using assets)
- [ ] No sensitive data in plugin files

### During Testing
- [ ] Files are copied correctly
- [ ] Development files are removed
- [ ] Version is updated in main file
- [ ] Assets are copied (if present)
- [ ] No errors in the process

### After Testing
- [ ] Review generated files
- [ ] Check file permissions
- [ ] Verify version numbers
- [ ] Test plugin functionality
- [ ] Clean up test files

## 🚨 Common Issues and Solutions

### Issue: "Permission denied" on script
```bash
chmod +x scripts/test-deploy.sh
```

### Issue: "SVN checkout failed"
- Check SVN credentials
- Verify SVN repository URL
- Ensure repository exists and is accessible

### Issue: "Files not found"
- Run script from project root directory
- Ensure `siteimprove/` directory exists
- Check file paths in the action

## 🔄 Testing Workflow

### Recommended Testing Sequence:

1. **Local Script Test** (5 minutes)
   ```bash
   ./scripts/test-deploy.sh
   ```
   - Tests file preparation only (dry-run mode)
   - Creates `deploy/` directory with prepared files

2. **GitHub Actions Dry Run** (10 minutes)
   - Run unified action with dry-run=true
   - Review output and artifacts
   - Tests complete deployment logic without SVN operations

3. **Test SVN Repository** (30 minutes)
   - Set up test SVN repo
   - Run full deployment with test-mode=true, dry-run=false
   - Verify complete deployment process

4. **Production Deployment** (when ready)
   - Update to real SVN credentials
   - Run actual deployment with dry-run=false, test-mode=false

## 📊 What to Look For

### Successful Test Results:
- ✅ All plugin files copied
- ✅ Development files removed
- ✅ Version updated correctly
- ✅ No error messages
- ✅ Files are properly organized
- ✅ `deploy/` directory created with prepared files

### Warning Signs:
- ❌ Missing files
- ❌ Development files included
- ❌ Wrong version numbers
- ❌ Permission issues
- ❌ `deploy/` directory not created

## 🎯 Next Steps After Testing

1. **Review Results**: Check all generated files
2. **Fix Issues**: Address any problems found
3. **Update Configuration**: Set real SVN credentials
4. **Test Again**: Run with real repository
5. **Deploy**: Use for actual releases

## 🔧 Using the Unified Action

The unified action supports three modes:

### Dry Run Mode (Safe Testing)
```yaml
- name: Test Deployment
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8-test'
    dry-run: true
    test-mode: true
```

### Test Mode (Test Repository)
```yaml
- name: Test Deployment
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8-test'
    test-mode: true
    svn-url: 'https://your-test-svn-repo.com/siteimprove-test/'
```

### Production Mode (Live Deployment)
```yaml
- name: Deploy to Production
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8'
    dry-run: false
    test-mode: false
    svn-username: ${{ secrets.WP_SVN_USERNAME }}
    svn-password: ${{ secrets.WP_SVN_PASSWORD }}
```

This simplified approach ensures your deployment process is reliable and safe before using it for production releases. 