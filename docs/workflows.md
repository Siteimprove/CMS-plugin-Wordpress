# GitHub Actions

## Which workflow should I use?

| Workflow | Trigger | Purpose | Publishes? |
| --- | --- | --- | --- |
| **Code standards** (`wpcs.yml`) | Pull requests; release checks | WordPress PHP coding standards. The check name stays **WPCS**. | No |
| **Plugin tests** (`pr-tests.yml`) | Pull requests; manual; release checks | Chromium and Firefox browser, WordPress draft/preview, and multisite regression tests. Siteimprove is mocked. | No |
| **Live Siteimprove test** (`prepublish-live.yml`) | Manual; release checks | Real account login, Live page data, draft handoff and loading-state exit. | No release; sends synthetic test content to Siteimprove |
| **Create and deploy release** (`release.yml`) | `v*` tags; manual on a version tag | Validate, create the GitHub release, and deploy to WordPress.org; dry-run and test modes are available. | Yes, except dry-run |

`release-checks.yml` is a shared helper, not a fifth operation to run manually.
It requires Plugin tests, Code standards, the live test and the install/activate/
deactivate/delete ZIP lifecycle check to pass before publishing. It requires
Docker on its GitHub runner. A skipped or failed prerequisite blocks publishing.

## Check a pull request or another plugin version

Pull requests automatically run **Plugin tests** and **Code standards**.
Keep **Browser tests**, **WordPress tests** and **WPCS** as the check names in
branch protection; this cleanup does not change repository protection settings.

For manual investigation, open **Actions → Plugin tests → Run workflow**:

- Select the branch containing the test code.
- Set `plugin_ref` to a plugin branch, tag, commit or `refs/pull/NUMBER/head`.
  Blank uses the workflow commit. Only the plugin is taken from this ref;
  test code comes from the workflow branch.
- Set `wordpress_version` and `php_version` if needed. Manual defaults are
  WordPress 6.9.4 and PHP 8.3, applied to both WordPress environments.
- Automatic runs retain the existing defaults: latest WordPress for single-site,
  WordPress 6.9.4 for multisite, and PHP 8.3.

The summary records both the repository and plugin commits. Environments are
created on the runner and stopped after testing; they are not persistent sites.
No real Siteimprove credentials are used.

Open the failed step first, then download **pr-browser-test-report** or
**pr-wordpress-test-reports** from the run's Artifacts. Reports are retained for
14 days and contain individual assertions and synthetic failure screenshots.
A startup failure may have no browser report. See [testing details](../tests/README.md)
and the [regression catalog](../tests/integration-regressions/COVERAGE.md).

## Check the real Siteimprove connection

Run **Live Siteimprove test** on reviewed code. It tests the triggering commit,
not an independently selectable plugin ref. The `siteimprove-test` environment
supplies credentials and applies its configured approval/ref restrictions.
It needs `SITEIMPROVE_PUBLIC_URL`, `SITEIMPROVE_CRAWLED_URL`,
`SITEIMPROVE_API_USERNAME`, `SITEIMPROVE_API_KEY`, `SITEIMPROVE_USERNAME` and
`SITEIMPROVE_PASSWORD`. Release tags must be allowed by the environment rules.

Use fixed phase outcomes in the job log for diagnostics. No authenticated
screenshots, traces, account data or browser-state artifacts are uploaded.
**The missing-title result assertion is skipped:** a green result verifies the
implemented login/data/handoff checks, not scan-result correctness or visual
highlighting. See [live test coverage and setup](../tests/live/README.md).

## Create and deploy a release

1. Merge the reviewed change after all PR checks pass. Update the plugin version
   in `siteimprove/siteimprove.php` and the changelog in `siteimprove/readme.txt`
   before tagging.
2. Use a version tag such as `v2.1.5`. Pushing that tag automatically starts
   production validation and publishing. Do not push a production tag merely
   to try a dry run.
3. To rehearse first, push `v2.1.5-dry-run`. This runs release validation and file
   preparation without creating a GitHub release or performing any SVN operation.
   It does not verify SVN authentication or prove deployment will succeed.
4. For a test deployment, use a `v2.1.5-test` tag. It creates a GitHub release and
   commits to the separate test SVN repository. It is a real write, not a simulation.
5. Manual runs must select an existing version tag using the GitHub UI or CLI
   `--ref`; branch runs are rejected. Choose `dry-run` (default), `test` or
   `production`. Production mode requires a plain `vMAJOR.MINOR.PATCH` tag.
6. After production, verify the GitHub ZIP and release, the WordPress.org version,
   and installation of that version. Inspect existing release/SVN state before
   retrying a partly completed deployment: an existing SVN tag can prevent retry.

The validated GitHub ZIP contains tracked `siteimprove/` files only. SVN deployment
uses plugin sources from the same tag. Publishing waits for all release checks,
including the protected live test. Release runs are serialized to avoid concurrent
SVN writes. The deployed version drops the leading `v`; test/dry-run suffixes remain.

Production uses `WP_SVN_USERNAME`, `WP_SVN_PASSWORD`, and optional `WP_SVN_URL`
(default `https://plugins.svn.wordpress.org/siteimprove/`). Test mode requires
`TEST_SVN_USERNAME`, `TEST_SVN_PASSWORD`, and `TEST_SVN_URL`, which must differ
from production. Shared optional variables are `WP_PLUGIN_SLUG` and `WP_ASSETS_DIR`.

### Troubleshooting

- If no run starts, check that the version tag was pushed and contains the release workflow.
- For SVN authentication failures, check the credentials for the selected mode and
  their write access to the destination repository.
- For missing-file errors, confirm the tagged commit contains `siteimprove/siteimprove.php`.
- For an existing-version error, inspect the GitHub release and SVN tag before retrying;
  do not delete published version tags to make a retry succeed.

## Cleanup map

The separate `prepublish-test.yml`, `prepublish-wordpress.yml`, and
`integration-regressions.yml` entry points are replaced by **Plugin tests**;
all suites remain, with manual plugin/runtime selection.
`deploy-wordpress.yml` is replaced by **Create and deploy release**.
The old `wp-*` tag and `main` branch deployment triggers are removed. Use `v*`
version tags and the release workflow's explicit modes. GitHub may retain old
workflow run history; historical entries do not indicate another current workflow.
