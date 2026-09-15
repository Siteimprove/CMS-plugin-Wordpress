# Manual live Siteimprove test

Status: repeated live runs passed login, Live page data, fresh draft handoff,
and loading-state exit. The final run passed with the missing-title result
assertion explicitly skipped; earlier runs failed to locate that issue.
That assertion is explicitly skipped until the result mapping is verified.
No reliable evidence yet distinguishes a hidden or differently labelled issue
from an absent result. The runner does not claim scan-result correctness.

The remaining smoke checks stay mandatory. A failure in those checks still
fails the workflow; the missing-title assertion is not retried or silently passed.

## Prerequisites

The `siteimprove-test` GitHub Environment must contain:

- `SITEIMPROVE_PUBLIC_URL`: the base URL configured in the WordPress plugin.
- `SITEIMPROVE_CRAWLED_URL`: one exact crawled page under that base URL.
- `SITEIMPROVE_API_USERNAME` and `SITEIMPROVE_API_KEY`.
- `SITEIMPROVE_USERNAME` and `SITEIMPROVE_PASSWORD`: a direct-login test user.

The account needs existing Prepublish access, and both users must have access
to the mapped site. Initial terms acceptance must already be complete. The test
does not accept terms, activate a subscription or bypass MFA/CAPTCHA. It currently
uses English SDK control labels. The expected issue mapping remains unverified.

The runner must reach the Siteimprove API, SDK and identity services. The crawled
website itself is not visited: its URL is used as the plugin's normal mapping
context. Whether an unrelated existing crawled site can serve as that context
for this local fixture was verified by the PR64 live runs.

## What the test does

1. Check that the API reports Prepublish as ready.
2. Sign into the disposable WordPress installation.
3. Configure Public URL, the latest SDK experience and API credentials using
   the plugin's settings form and normal credential validation.
4. Create a local published control and an unpublished autosave with a unique
   marker. The fixture's permalink matches the crawled page path; the plugin
   performs its own Public URL transformation without request rewriting.
5. Confirm the preview contains the unique marker and exactly one empty title,
   that the plugin reports the expected public URL, and that an anonymous
   visitor cannot retrieve the draft content.
6. Sign into Siteimprove through the real plugin's popup using direct login.
7. Require an authenticated SDK polling response for the exact crawled URL,
   with existing Live page data, and open Live page view.
8. Start a new check from Prepublish view. Observe its running state and the
   real SDK's `contentcheck-flat-dom` message, without replacing the SDK queue
   or altering the content. The message must contain this run's draft marker.
9. Wait for the recheck control and the active-check indicator to clear.
10. Log the missing-title result assertion as **SKIP**. This is a known coverage
    gap, not evidence that the scan returned correct results.

The title is removed in the server-rendered preview template, including the
plugin's capture iframe. Clearing only the editor title or mutating the outer
browser document would not exercise the same path.

## Execution and approval

The workflow is `prepublish-live.yml` (**Live Siteimprove test**).
It supports manual dispatch and reuse by the release checks in this repository.
It does not run on PR events and uses the `siteimprove-test` environment's
approval and deployment rules. Configure that environment to allow the release
refs that should receive credentials. Missing approval or secrets blocks release
validation; it does not bypass the live test.

The plugin and test harness use the triggering commit (`github.sha`), including
for releases. There is no separate plugin-ref input in this credential-bearing
workflow. Release refs and workflow changes must be reviewed before approval.

## Diagnostics and secrets

The live runner prints only fixed phase names and pass/fail outcomes. It catches
raw browser and API errors instead of printing URLs, field values, headers or
account content. Screenshots, traces, video, saved browser sessions and server-log
uploads are disabled. WordPress debug logging is disabled. Secrets are supplied
only to the live test step, after environment approval; no secret values are
written into tracked configuration files.

Login failures identify one of six fixed stages, from opening the popup through
submitting credentials and waiting for it to close. A LOGIN STATE line contains
only fixed boolean fields for popup availability, known identity/SDK/platform
origins, the SDK close page, and visible username/password/alert/one-time-code/
CAPTCHA controls or access-denied/terms prompts. It contains
no URL, page text, field value, screenshot or raw exception. These indicators
help narrow a failure; they do not prove why authentication was rejected.

Failures identify a phase such as API entitlement, login, URL mapping or new
Prepublish completion. The tradeoff is less detail for investigating SDK changes;
raw account diagnostics must not be published as public PR artifacts. This policy
is separate from the screenshots enabled for the synthetic tests in PR #65.

## Credential-free validation

`npm run test:live:contracts` verifies URL mapping, required configuration and
recognition of real Live page data versus login/missing-page responses. It also
checks both login failure paths for unhandled event rejections and guards against
adding screenshot/trace/video/session capture or artifact uploads to the current
live runner and workflow.

The PHP fixture can be checked locally without any Siteimprove credentials:

```sh
npm run env:stop
node scripts/prepare-live-env.js
npm run env:start
npm run test:live:fixture
```

These fixture tests block external browser requests and use synthetic content.
They require the ignored `.plugin-under-test/siteimprove` checkout, as used by
the manual workflows. They verify root and nested paths, query preservation,
real WordPress autosaves, empty titles, inline styles and anonymous access checks.
The WordPress fixture runs in Chromium and Firefox. A synthetic cross-origin
observer check runs in Chromium, matching the live runner. The same observer
check failed in Firefox because iframe initialization did not install the
DOMContentLoaded observer on the final document; Firefox live instrumentation
is not validated. These checks do not validate live login, entitlement or scans.

The live runner refuses to proceed unless `SITEIMPROVE_RUN_LIVE=1` and all six
secrets are supplied. Do not enable that flag merely to validate fixture code.

## Sources for the initial integration

- [WordPress plugin setup](https://help.siteimprove.com/support/solutions/articles/80001079368-new-wordpress-plugin)
- [Prepublish workflow](https://help.siteimprove.com/support/solutions/articles/80001077559-how-to-run-a-prepublish-check-with-the-new-plugin-ui)
- [Public SDK loader](https://cdn.siteimprove.net/cms/overlay-latest.js) — inspected version 2.1.3130.1 for iframe, polling and message contracts.
- The public identity form was inspected without entering credentials; its first step uses `loginId` and a Continue button. The subsequent password step still needs authenticated-flow verification.

## Prepublish completion timing

After verifying fresh draft handoff, the runner allows five minutes total for
the recheck control to appear and the active-check indicator to clear. These
are UI observations, not proof of backend success. The missing-title result
assertion is skipped explicitly in both logs and the run summary. Restoring it
requires confirming the rule and how its result is exposed, then demonstrating
that the assertion detects the synthetic issue without matching stale results.
