# Siteimprove WordPress Plugin

This is the git repository for the official Siteimprove plugin for WordPress.

The code on this repository has to match the WordPress Coding Standards in order to be maintainable and understandable in the future by anyone who contributes to the project.

Every pull request will be checked against WPCS trough github actions.

## Version History

### 1.3.1
* Bufgix - Fixed Highlighting content issues for prepublish checks.

### 1.3.0
* Added Prepublish feature to the plugin
* Added configuration page to set up an API key and API username

### 1.2.2
* Bufgix - added CSS naming prefixes to avoid collision with other plugins

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
