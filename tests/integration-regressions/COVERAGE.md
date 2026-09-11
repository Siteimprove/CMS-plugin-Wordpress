# Integration regression coverage

Behavior-based regression specifications using synthetic fixtures. Automated references cover only their stated scope; unimplemented cases are not passing tests.

## capability-access

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Configure a multisite subsite with Prepublish enabled. Grant a network Super Admin no explicit subsite membership. Add a custom Custom Editor with edit_posts and a custom read-only role.

**When:** Sign in separately as Editor, custom editor, and Super Admin; open a private subsite preview and start Prepublish. Repeat as the read-only role.

**Then:** Authorized editors see the overlay and capture the draft; no explicit membership is required for Super Admin. Read-only users cannot read the draft or load the frontend overlay.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Real WordPress capabilities, multisite membership, frontend script, toolbar and draft callback; SDK queue substituted.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## wordpress-slow-policy

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Use a controlled subscription/policy service fixture with QA and accessibility completing promptly and a delayed Policy response. Repeat with zero integration-visible policies and with several eligible policies.

**When:** Run an initial check, a second check and a same-page recheck, then exercise cancellation and a Policy request that never completes.

**Then:** Only entitled checks and eligible policies run; completed results remain available. A delayed or failed Policy request terminates or reports a recoverable error within the service's documented deadline; cancellation releases the UI. Record per-check durations and request counts.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## split-origin-preview

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A WordPress draft differs from its published delivery URL. Configure Public URL to another origin and a current preview nonce; use Content-site access as the positive SSO control and Analytics-only access as the negative control.

**When:** Open the draft and run Prepublish through both toolbar and callback. Repeat with DENY/CSP and a cross-origin redirect.

**Then:** Capture reads the local authenticated draft and reports its mapped public URL. Blocked capture submits nothing and removes its frame and loading UI. With Content access, the SSO session opens the report; Analytics-only access must not grant Content access.

- [tests/browser/prepublish.spec.js](../browser/prepublish.spec.js) — Real browser cross-origin capture, nonce and public URL contract; companion failure cases cover frame restrictions.

- [tests/wordpress/prepublish.spec.js](../wordpress/prepublish.spec.js) — Actual WordPress drafts and autosaves; service is mocked.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## accessibility-install

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A disposable WordPress site meeting the artifact's declared requirements, with PHP error logging and a downloaded siteimprove-accessibility ZIP.

**When:** Upload the ZIP, install and activate it; load its dashboard and a public page, deactivate and reactivate.

**Then:** Installation and activation finish, plugin screens load, the frontend remains available and PHP logs contain no plugin fatal errors.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## hub-preview

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A hub draft renders through a custom preview that participates in WordPress preview detection. Configure two representative language subsites with distinct Public URLs and tokens; no subsite preview exists.

**When:** Run Prepublish from the hub toolbar and inspect existing Live page data on each mapped subsite.

**Then:** Hub Prepublish captures hub draft content and starts a check instead of only adding a hash. Subsite Live requests use their own URLs/tokens without inventing a one-to-one live URL for the hub.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## sso-username

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A test IdP maps username and email to different values, using synthetic identifiers.

**When:** Enter the configured username in plugin SSO, finish IdP login and reopen the plugin; also try an unmapped email.

**Then:** The mapped username redirects to the IdP and opens the correct account. An unmapped identifier gives a usable error without granting access. Do not require email login when the IdP maps username.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## path-mapping

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Create /content-root/published/ and configure Ignore Path Segments to content-root with a trailing-slash Public URL. Include a second subsite with its own token.

**When:** Open each content page and its overlay.

**Then:** The input URL removes the configured segment, has one separating slash, and uses that site's token. In a crawled-site fixture, the matching page has Live data rather than Page not found.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Real PHP URL transformation and per-site options through the JS input queue.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## cms-install-compatibility

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A disposable site using the selected WordPress and plugin versions, plus a candidate-release matrix using its oldest supported PHP/WP versions.

**When:** Install and activate, open frontend, dashboard, edit and preview, save an edit, then deactivate.

**Then:** All screens remain available with no plugin fatal errors or undefined-index notices, and plugin initialization appears where supported.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## smallbox-accessible-names

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Load the actual smallbox with nonzero issue counts and its collapsed and expanded states.

**When:** Tab to both right-side controls and inspect their accessible names, roles and enclosing landmark; activate them using the keyboard.

**Then:** Both controls have meaningful names identifying their action rather than only Button or a numeric count; the landmark is named and keyboard activation works.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## firefox-login

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A test user with Content-site access and a signed-out plugin in Firefox.

**When:** Open the side panel and complete login with standard and strict tracking protection settings.

**Then:** Login opens the authorized page without a popup loop. If browser policy prevents session completion, show an actionable recovery path rather than silent failure.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## right-side-cancel

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** The real plugin is right-docked and a content check remains pending.

**When:** Reach Cancel content check and the accessibility control by pointer and keyboard, then cancel.

**Then:** Controls are visible, within the viewport and unobstructed; cancellation stops pending work and restores usable page controls.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## preview-live-identity

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Use a preview whose published canonical URL is in the account's crawl inventory, then a second preview whose live page is absent.

**When:** Open the collapsed smallbox, then expand it and run Prepublish.

**Then:** The known live page resolves in both states without a misleading Page not found icon. The uncrawled page communicates absence of Live data while still permitting entitled Prepublish.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## edit-initialization

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** An administrator edits a published page, with a valid site token and selected overlay version.

**When:** Open the block editor.

**Then:** WordPress loads one plugin script and the configured overlay and sends the published URL as input; the actual smallbox is visible when using the SDK.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Real WordPress block-editor enqueue/localization and queue.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## accessibility-text-domain

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Install a test translation for a known UI string under the siteimprove-accessibility text domain and activate a matching locale.

**When:** Load the plugin screen containing that string; inspect gettext calls and plugin metadata during package validation.

**Then:** The translated text appears and every plugin-owned gettext domain/header uses siteimprove-accessibility, not siteimprove_accessibility.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## static-homepage

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Set a published page as a subsite's static homepage, with a known crawled homepage URL.

**When:** Open its edit screen and preview, then run Prepublish.

**Then:** Both modes send the same canonical homepage URL. Live data is available in preview and new Prepublish results appear separately from Live data.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Real PHP static-homepage identity and callback registration.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## highlight-deduplication

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Run both production highlight sources on one issue element.

**When:** Select the same issue through each source and move between occurrences.

**Then:** Exactly one visible highlight layer, border and background remain; no duplicate wrappers or cumulative opacity occur.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — WordPress delegates one highlighting callback; no actual SDK rendering.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## devmode-overlay

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** An administrator opens plugin settings with devmode on a local local site.

**When:** Save a full custom overlay JS URL and open a content page.

**Then:** The custom script URL is loaded independently of hosting hostname.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Actual settings save and PHP enqueue on localhost.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## flatdom-detached-document

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A real WordPress capture document whose temporary iframe has been removed, including custom elements and nested frames.

**When:** Pass the returned document to the actual SDK FlatDOM processor through toolbar and callback.

**Then:** The processor handles a missing browsing context/defaultView without reading customElements from null, and both checks produce results with no unhandled errors.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## plugin-display-name

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Select the plugin artifact/checkout to validate.

**When:** Read the plugin entry-point metadata and run the directory Plugin Check before release.

**Then:** Plugin Name is Siteimprove and contains no extra restricted Plugin term.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — Production entry-point display-name assertion.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## script-placement

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Open a content page with the plugin enabled.

**When:** WordPress renders scripts and their localized configuration.

**Then:** The overlay loads in the footer after the integration script and initialization data; enqueue calls explicitly choose header/footer placement.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Rendered script order, footer placement and successful input queue.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## settings-nonces

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** An administrator has configured a Public URL; prepare missing, invalid and valid settings nonces and a lower-privilege user.

**When:** POST settings updates and token requests using each nonce/role combination.

**Then:** Missing/invalid nonces and unauthorized roles cannot change settings or issue tokens. A valid administrator request succeeds.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Real options.php rejects missing/invalid nonces; actual form save is the positive control. Token AJAX checks rejected nonces, a valid administrator nonce, a subscriber, and service-request counts.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## missing-preview-parameter

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** An authenticated multisite administrator loads a request with neither si_preview nor si_preview_nonce.

**When:** Open the dashboard and plugin settings after upgrade.

**Then:** No Undefined index notice or PHP fatal appears, and the non-content overlay initializes normally.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Current source on real multisite with WP_DEBUG_DISPLAY enabled and no preview parameters.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## inline-highlight-restoration

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Render <strong><em>Example town</em></strong><br> in a footer and obtain real SDK issue occurrences for the word and footer.

**When:** Highlight the word, switch occurrence, return, and clear highlighting.

**Then:** The original inline element structure, bold/italic computed styles and line break are restored exactly, including after a BODY/footer-level highlight.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — WordPress delegates highlighting without modifying fixture markup.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## non-content-initialization

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Configure a token and Prepublish, then navigate to dashboard, settings and a published content page.

**When:** Initialize the plugin on each page.

**Then:** Non-content v2 pages initialize an empty smallbox with clear and no Prepublish callback; legacy site view remains available. Content pages retain input and the published-page toolbar action.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Real dashboard clear, absence of content callback and toolbar.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — Legacy and latest non-content initialization contracts.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## regional-entitlement

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A standalone crawled subsite, valid API credentials and active trial; controls for absent key, disallowed and not-yet-enabled Prepublish.

**When:** Save credentials, activate Prepublish, and open the subsite preview.

**Then:** The entitled subsite exposes a usable Prepublish action without a fatal error. Negative controls disable Prepublish while preserving ordinary Live page input. A configured crawled public URL resolves to the correct account.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Disabled-key/entitlement/readiness flags gate both entry points in actual WordPress.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## experience-selection

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** The experience option has never been saved; separately choose each explicit experience setting.

**When:** Open settings and the plugin, then switch experience and reload.

**Then:** Fresh settings show Use latest experience checked and load the matching latest overlay. Explicit choices initialize only their selected experience without duplicate callbacks.

- [tests/integration-regressions/regressions.spec.js](../integration-regressions/regressions.spec.js) — Unset option rendered checkbox and selected script.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — Single initialization per explicitly selected experience.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## clean-capture

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** An authenticated preview with an admin bar and plugin script uses a PHP-validated capture nonce.

**When:** Run both Prepublish entry points and inspect the submitted document.

**Then:** The capture contains page content without active admin-bar controls or recursive smallbox script; preserve the admin-bar placeholder's hierarchy for selectors. The outer page remains usable.

- [tests/wordpress/prepublish.spec.js](../wordpress/prepublish.spec.js) — Real PHP omits plugin script in the captured document.

- [tests/browser/prepublish.spec.js](../browser/prepublish.spec.js) — Capture empties/renames toolbar and removes temporary nodes.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## regional-prepublish-recovery

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** An unpublished revision and a regional service fixture that can respond, stall or fail.

**When:** Open Preview Changes, start Prepublish and recheck in each region.

**Then:** Successful checks display their results; failed/stalled checks reach a visible recoverable terminal state and release the page overlay instead of waiting indefinitely.

- [tests/browser/prepublish.spec.js](../browser/prepublish.spec.js) — Only WordPress capture timeout and UI cleanup, not US/EU check completion.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## smallbox-close

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** The dashboard's plugin is collapsed.

**When:** Open it, click X, reopen it, then activate Close by keyboard.

**Then:** Both close actions collapse the panel, release any blocking overlay and return focus to a usable launcher; reopening works.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## login-server-error

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A signed-out plugin with an identity/page service fixture returning one 500 followed by success.

**When:** Click the login tab, observe failure, retry login and navigate to another page.

**Then:** Failure is actionable without an endless open/close popup loop; retry establishes a usable session and loads the authorized page.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## oversized-login-headers

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A signed-out draft and a controlled identity fixture returning the documented oversized-header error, followed by a clean-session control.

**When:** Log in, clear only the test identity cookies, and retry.

**Then:** The first attempt reports a recoverable authentication failure; the clean-session attempt opens the correct draft's plugin without stale account data.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## recheck-history

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A published page and a service that completes rechecks with distinct operation IDs.

**When:** Click Recheck twice, waiting for completion between clicks, and inspect History.

**Then:** Each click sends exactly one request for the correct URL/token, the button re-enables on completion, and both completed operations appear in History.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — Real integration JavaScript, button disabled state, two requests and completion callbacks.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.

## plugin-removal

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** Install and activate an expendable copy of the CMS plugin, never a bind-mounted working checkout.

**When:** Deactivate and delete it through WordPress, then open frontend/admin and reinstall the same artifact.

**Then:** Deletion completes without a fatal error; the plugin is absent from the list/files, other content stays available, and reinstall succeeds.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## account-switch-refresh

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** User A is signed in on site A; navigate to site B with the plugin panel open.

**When:** Log out and log in as User B who has access to site B.

**Then:** The open panel refreshes to User B's authorized page data immediately without close/reopen; no User A results remain visible.

**Remaining:** Specification only. Requires a dedicated disposable environment and controlled dependencies before automation.

## update-recheck

**Environment:** Disposable WordPress installation with synthetic content and identities; use controlled SDK/service fixtures where required.

**Given:** A published page with a known URL and token and an open plugin panel.

**When:** Change its content and click Update, then allow the queued recheck to finish.

**Then:** Exactly one recheck is dispatched for that page and the open panel/History reflect its completion.

- [tests/browser/integration-regressions.spec.js](../browser/integration-regressions.spec.js) — Integration JS consumes the PHP-localized update notification and queues one recheck.

**Remaining:** Validate the complete scenario with the actual SDK and controlled services; automated references cover only the stated scope.
