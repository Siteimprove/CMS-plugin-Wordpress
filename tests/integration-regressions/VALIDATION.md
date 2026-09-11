# Integration regression validation — 2026-09-11

Tested plugin commit: `a23af8519861f674d700cbe4fe183817f47458dc`
reporting plugin
version **2.1.4**. WordPress reported **6.9.4**, PHP **8.3.33**, and multisite was
enabled with two distinct sites. The tests assert these runtime versions and
site identities; they do not rely on the environment startup banner.

| Validation | Result |
| --- | --- |
| Browser suite, Chromium and Firefox | 46 passed: 30 existing capture checks and 16 new integration checks |
| WordPress integration suite, Chromium and Firefox | 46 passed in the executable subset |
| Strengthened read-only-role controls | 4 passed in a focused rerun, confirming public content remains available while draft access and frontend plugin loading are denied |
| Recheck mutation control | Removing button re-enablement from a temporary script copy makes the new classic-editor test fail at the enabled-state assertion |
| Workflow and documentation | Workflow YAML parses; catalog references and documentation links resolve; diff whitespace check passes |

There are **25 new executable scenarios**, each run in both browsers: eight
browser scenarios and seventeen WordPress scenarios. The manual workflow is
prepared but has not been dispatched on GitHub.

## Limits

These results concern the selected candidate commit on a local Playground
installation. They do not establish behavior on external hosting, historical
plugin binaries, or the published WordPress channels. The actual SDK, IdP,
remote scans, Policy timing, History and visual highlighting remain separate
integration tests described in [COVERAGE.md](COVERAGE.md).

Final review reran both suites after test updates: browser and WordPress regressions
executed without known experience-selection assertions. No tests were skipped.
Catalog references, JavaScript syntax, workflow YAML, documentation links and the
staged privacy review passed. PHP_CodeSniffer was not available locally, so a
local WPCS result is not claimed.
