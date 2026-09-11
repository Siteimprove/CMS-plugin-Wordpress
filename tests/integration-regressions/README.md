# WordPress integration regressions

These tests exercise production integration JavaScript and real WordPress PHP,
sessions, roles, multisite membership, settings nonces and URL mapping.
The SDK is represented by its queue/callback contract. Actual login, scans,
History and highlight rendering need separate controlled integration fixtures.
[COVERAGE.md](COVERAGE.md) describes coverage and remaining scenarios.

## Public fixture policy

Use behavior-based test names. Keep incident provenance and issue mappings in
private tracking systems, outside this repository. Do not copy support exports,
customer names, account IDs, real addresses, credentials, tokens, screenshots,
HAR files, or identifying configuration combinations into fixtures or reports.
Use synthetic content and identities, reserved `.test` domains and dummy tokens.
Do not derive synthetic identifiers by hashing real identifiers.
Review diffs and report attachments before publishing; ignored files are not a
substitute for sanitizing artifacts. New scenarios must follow the same policy.

Both regression configurations disable Playwright Git commit and diff capture
to keep contributor names and email addresses out of that report metadata.
Failure attachments may contain synthetic fixture credentials from test-source
snippets. This setting affects future runs; it does not sanitize existing reports.

## Run locally

```sh
npm ci
npx playwright install chromium firefox
npm run test:regressions:catalog
npm test
npm run env:regressions:start
npm run test:regressions
npm run env:regressions:stop
```

The browser suite includes eight integration regression scenarios. The additional
WordPress suite runs seventeen scenarios, each in Chromium and Firefox, using one
worker because tests reset a shared disposable multisite installation.

The isolated runtime uses `.integration-regressions-env/`, WordPress 6.9.4 and PHP
8.3 by default. Leave port 80 free: Playground multisite requires standard HTTP.
The browser blocks off-origin requests and the local-only MU fixture blocks
external PHP HTTP requests except for a canned token response. Runtime attachments
contain only WordPress/PHP versions, multisite state and fixture site count.

Select a different checkout or runtime before starting:

```sh
SITEIMPROVE_TEST_PLUGIN=.plugin-under-test/siteimprove REGRESSION_WP_VERSION=6.9.4 REGRESSION_PHP_VERSION=8.3 npm run env:regressions:start
SITEIMPROVE_TEST_SCRIPT="$PWD/.plugin-under-test/siteimprove/admin/js/siteimprove.js" npm test
npm run test:regressions
```

The browser script and mounted plugin must come from the same checkout. The
recorded results use the candidate commit in [VALIDATION.md](VALIDATION.md);
selecting another revision can expose additional failures, including revisions
without the cross-origin preview fix. Stop the
environment before changing versions. The runtime wrapper aligns the Playground
blueprint with the requested WordPress version; setup asserts the actual version.
The environment mounts plugin source: lifecycle deletion tests must instead use
an expendable package copy so they cannot delete the checkout.

Reports go to ignored `playwright-report/` and
`playwright-integration-regressions-report/`. Use `npm run test:regressions:report`
to view the latter. The WordPress integration regressions workflow runs on
pushes to `test/integration-regressions`, testing that branch's plugin source.
Manual runs can select another plugin revision once the workflow exists on the
default branch. These runs do not deploy the plugin. Ordinary assertion failures remain failures.

Run `npm run test:regressions:catalog -- --write` after changing `cases.json`.
See [VALIDATION.md](VALIDATION.md) for the recorded validation and its limits.
