# Siteimprove WordPress Plugin

This is the git repository for the official Siteimprove plugin for WordPress.

The code on this repository has to match the WordPress Coding Standards in order to be maintainable and understandable in the future by anyone who contributes to the project.

Every pull request will be checked against WPCS through GitHub Actions.

## Version History
### 2.1.1
* Bugfix - Ignore trailing slash in public url (prevents potential double slash when filtering first path parameter)
 
### 2.1.0
* Added - Ignore Path Segments setting to remove specific path segments when building public URLs
* Enhanced - Public URL functionality to handle complex URL transformations

### 2.0.8
* Updated - "Tested up to"
* Bugfix - Fixed overlay live view not showing on home page
* Bugfix - Fixed overlay not showing in editor pages

### 2.0.7
* Bugfix - Fixed a security issue with implementing nonce checking on request token

### 2.0.6
* Bugfix - Fixed an issue when some users tried saving their API credentials

### 2.0.5
* Updated - Siteimprove logo

### 2.0.4
* Added - Siteimprove Recheck to Gutenberg Editor
* Added – When recheck has been ordered, the button will be re-enabled
* Bugfix - Fixed an issue with si_preview returning undefined index
* Bugfix - Fixed an highlighting issue in which it didn't restore original HTML structure
* Bugfix - Fixed an highlighting issue with "BODY" tag

### 2.0.3
* Bugfix - When doing prepublish, the si-preview empties the wp-admin-bar instead of removing it, which improves highlight selectors

### 2.0.2
* Added - Calling "clear" on non-content pages in WordPress
* Added - Prepublish can now be started from a published page

### 2.0.1
* Bugfix - Fixed checkbox for "Use latest experience" was not properly checked on by default

### 2.0.0
* Added - Support for new version
* Added - A checkbox to disable new version
* Added - Public URL field to the plugin

### 1.3.1
* Bugfix - Fixed Highlighting content issues for prepublish checks.

### 1.3.0
* Added - Prepublish feature to the plugin
* Added - Configuration page to set up an API key and API username

### 1.2.2
* Bugfix - added CSS naming prefixes to avoid collision with other plugins

### 1.2.1
* Bugfix - added check on nonce variable

### 1.2.0
* Security fixes according to WordPress Coding Standards and PHPCompatibility rulesets

### 1.1.0
* Avoid PHP warnings/errors when saving posts
* Properly display Siteimprove button when editing taxonomies
* Send cms version when request siteimprove token.

### 1.0
* First public version
