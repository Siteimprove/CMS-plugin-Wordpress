# Integration regression validation — 2026-09-11

Tested plugin commit: `a23af8519861f674d700cbe4fe183817f47458dc`
reporting plugin
version **2.1.4**. WordPress reported **6.9.4**, PHP **8.3.33**, and multisite was
enabled with two distinct sites. The tests assert these runtime versions and
site identities; they do not rely on the environment startup banner.

| Validation | Result |
| --- | --- |
| Browser suite, Chromium and Firefox | 46 passed: 30 existing capture checks and 16 new integration checks |
| WordPress integration suite, Chromium and Firefox | 32 passed, 2 failed; both failures reproduce the same experience-selection defect |
| Strengthened read-only-role controls | 4 passed in a focused rerun, confirming public content remains available while draft access and frontend plugin loading are denied |
| Recheck mutation control | Removing button re-enablement from a temporary script copy makes the new classic-editor test fail at the enabled-state assertion |
| Workflow and documentation | Workflow YAML parses; catalog references and documentation links resolve; diff whitespace check passes |

There are **25 new executable scenarios**, each run in both browsers: eight
browser scenarios and seventeen WordPress scenarios. The manual workflow is
prepared but has not been dispatched on GitHub.

## Defect exposed: experience checkbox and loaded script disagree

1. In the disposable test environment, leave
   `siteimprove_disable_new_version` unset and set
   `siteimprove_overlayjs_file` to an empty string (no custom override).
2. Open Siteimprove settings.
3. Check both the **Use latest experience** checkbox and the loaded overlay script.

Expected: the checkbox is checked and the selected script is `overlay-latest.js`.

Observed in both browsers: the checkbox is checked, but WordPress enqueues
`https://cdn.siteimprove.net/cms/overlay-v1.js?ver=2.1.4`.

The checkbox renderer in
[class-siteimprove-admin-settings.php](../../siteimprove/admin/partials/class-siteimprove-admin-settings.php)
treats a missing option as checked. `siteimprove_add_js()` in
[class-siteimprove-admin.php](../../siteimprove/admin/class-siteimprove-admin.php)
reads that same missing option as false and selects the legacy script when the
override is empty. This fixture reproduces the unset-option state; it does not
claim to reproduce every default option created by a historical ZIP installer.

The assertions remain ordinary failing tests. No expected-failure or skip marker
hides this inconsistency. Run just this case with:

```sh
npm run test:regressions -- --grep "an unset experience option"
```

The HTML report and JSON result include the selected script and runtime
attachments. Open the report with `npm run test:regressions:report` after a run.

## Limits

These results concern the selected candidate commit on a local Playground
installation. They do not establish behavior on external hosting, historical
plugin binaries, or the published WordPress channels. The actual SDK, IdP,
remote scans, Policy timing, History and visual highlighting remain separate
integration tests described in [COVERAGE.md](COVERAGE.md).

Final review reran both suites after the public naming and synthetic fixture
cleanup: 46 browser checks passed; the WordPress suite passed 32 checks and
reproduced the same experience-selection failure in both browsers. No tests were
skipped. Catalog references, JavaScript syntax, workflow YAML, documentation
links and the staged privacy review passed. PHP_CodeSniffer was not available
locally, so a local WPCS result is not claimed.
