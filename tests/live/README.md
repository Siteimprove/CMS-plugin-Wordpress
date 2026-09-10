# Manual live Siteimprove test

Status: the workflow and initial test implementation are prepared, but no
GitHub run, authenticated login or real Prepublish scan has been performed.
The first approved run must validate the account, network access and SDK UI
selectors. A failure is not converted into a skip or a pass.

This follow-up builds on the credential-free infrastructure in PR #65. It adds
one Chromium smoke test with two outcomes: existing Live page data for the exact
crawled URL, followed by a newly completed Prepublish check reporting a missing
HTML title in the current local draft. It does not test SDK layout or highlighting.
Report-rerender styling remains a separate manual acceptance check.

## Prerequisites

The `siteimprove-test` GitHub Environment must contain:

- `SITEIMPROVE_PUBLIC_URL`: the base URL configured in the WordPress plugin.
- `SITEIMPROVE_CRAWLED_URL`: one exact crawled page under that base URL.
- `SITEIMPROVE_API_USERNAME` and `SITEIMPROVE_API_KEY`.
- `SITEIMPROVE_USERNAME` and `SITEIMPROVE_PASSWORD`: a direct-login test user.

The account needs existing Prepublish access, and both users must have access
to the mapped site. Initial terms acceptance must already be complete. The test
does not accept terms, activate a subscription or bypass MFA/CAPTCHA. It currently
uses English SDK labels; those labels and the missing-title issue name need
confirmation in the account during the first approved run.

The runner must reach the Siteimprove API, SDK and identity services. The crawled
website itself is not visited: its URL is used as the plugin's normal mapping
context. Whether an unrelated existing crawled site can serve as that context
for this local fixture remains unverified with the real service.

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
9. Require completion of that new check and the missing-title issue in
   Prepublish view. Historical crawl results cannot satisfy this assertion.

The title is removed in the server-rendered preview template, including the
plugin's capture iframe. Clearing only the editor title or mutating the outer
browser document would not exercise the same path.

## Execution and approval

The workflow is `prepublish-live.yml` (**Prepublish live Siteimprove test**).
It has only `workflow_dispatch`, runs only from `master` in this repository,
and uses the `siteimprove-test` environment's approval rules. It cannot run
from a PR branch. Workflow availability requires merging it into the default
branch; neither creating the PR nor adding secrets starts it.

The plugin is pinned to reviewed PR #64 commit
`a23af8519861f674d700cbe4fe183817f47458dc`. There is deliberately no arbitrary
plugin-ref input in this secret-bearing job. Changing the plugin commit requires
a reviewed workflow change. The ordinary credential-free workflows retain their
flexible `plugin_ref` inputs.

No workflow has been dispatched. Review this implementation before an authorized
maintainer starts and approves the first live run.

## Diagnostics and secrets

The live runner prints only fixed phase names and pass/fail outcomes. It catches
raw browser and API errors instead of printing URLs, field values, headers or
account content. Screenshots, traces, video, saved browser sessions and server-log
uploads are disabled. WordPress debug logging is disabled. Secrets are supplied
only to the live test step, after environment approval; no secret values are
written into tracked configuration files.

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
