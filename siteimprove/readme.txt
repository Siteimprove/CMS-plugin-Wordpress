=== Siteimprove ===
Contributors: siteimprove
Tags: accessibility, analytics, insights, spelling, seo
Requires at least: 4.7.2
Tested up to: 6.8.1
Stable tag: 2.0.8
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Turn your most complex website challenges into manageable tasks—all from a single platform

== Description ==

The Siteimprove CMS Plugin bridges the gap between the WordPress content management system (CMS) and the Siteimprove Intelligence Platform. Now you can scan your website for errors as soon as a page is published, allowing you to fix mistakes, optimize content, and manage your site more efficiently.
The plugin also provides you access to Prepublish, an add-on which allows you to check your page for issues before it has been published.


== Installation ==

There are two ways to install the Siteimprove plugin on WordPress.  

To install the plugin via the listing page, type ‘Siteimprove’ in the search box on the Wordpress plugin listing page and click on ‘install’.  

OR 

Upload the Siteimprove plugin zip file using Wordpress’ ‘Upload Plugin’ feature. The plugin can be activated immediately after upload.  


= Configuration =

After installing and activating the plugin, navigate to a piece of content in your WordPress configuration panel, i.e. "Pages". While you are editing it, you should now see a Siteimprove icon on the right sidebar of the admin page.  

Click on ‘Login’ and enter your Siteimprove username and password to access Siteimprove.  

A new Siteimprove menu option will also appear on the left menu bar. Click on this menu option to continue configuring the plugin once you’ve logged in.  

The token field is automatically filled and should not be changed unless a new token is required. In such cases, please click on "Request new token" to generate a new token. 

Public URL is optional to fill in if, for any reason, your published pages are not on the same URL as your configuration panel.

Ignore Path Segments is optional and allows you to specify path segments that should be removed when building the public URL. This is useful when your admin panel has additional path segments that shouldn't be included in the public URL (e.g., "wp-admin,staging"). Use comma-separated values.

When you download the plugin, you automatically will be using the latest experience. If for some reason, you want to use the previous experience of the Siteimprove plugin, uncheck "Use latest experience" in the configuration panel.

API Username (Email) and API Key are API credentials that should be filled in if you have purchased the ‘Prepublish’ add-on feature. When provided correctly, you should be able to begin utilizing Prepublish when you are previewing a page. 

Click on ‘Save’ once you have filled out the relevant fields.  


= Usage =

Once you have completed configuring the Siteimprove plugin and you are on a content page in the configuration panel, clicking on the Siteimprove icon in the right sidebar will open the Siteimprove plugin, which will provide you with the content's current issues and the page's current Digital Certainty Index (DCI) score.

You will also be able to review accessibility, content and policy issues on the page you are currently editing.

While editing a published page, the plugin provides you a page-level DCI score alongside an assessment of the readability and quality level of the page. 

You can also evaluate what the impact of unpublishing the specific page may have on your overall DCI score and website quality.


= Prepublish =

If you have purchased the Prepublish add-on, you should see a Prepublish icon at the top of any page in preview mode.

Clicking on this button will trigger the Prepublish check, which provides live results of the accessibility and quality of the page. 

Once the checks are complete, you will be able to see issues with the potentially unpublished content.

You can expand each area to review the issues that need to be fixed, make the necessary edits, and then rerun the Prepublish check to ensure that a page is optimized and issue-free before final publication by clicking on the Prepublish button again. 


== Frequently Asked Questions ==

= Who can use this plugin? =

The plugin requires a Siteimprove subscription to be used.

= Where can I see the overlay? =

The overlay is visible when editing a piece of content (e.g. "Pages" in WordPress configuration panel).

= I don't see the overlay, whats wrong? =

Did you remember to turn off your adblocker? Some adblockers do not like our iframe overlay.

Please review whether you have JavaScript turned off in your browser. We use JavaScript to be able to show you your issues.


== Changelog ==
= 2.1.1 =
* Bugfix - Ignore trailing slash in public url (prevents potential double slash when filtering first path parameter)

= 2.1.0 =
* Added - Ignore Path Segments setting to remove specific path segments when building public URLs
* Enhanced - Public URL functionality to handle complex URL transformations

= 2.0.8 =
* Updated - "Tested up to"
* Bugfix - Fixed overlay live view not showing on home page
* Bugfix - Fixed overlay not showing in editor pages

= 2.0.7 =
* Change - Changed name of the plugin from "Siteimprove Plugin" to "Siteimprove"
* Bugfix - Fixed a security issue with implementing nonce checking on request token

= 2.0.6 =
* Bugfix - Fixed an issue when some users tried saving their API credentials

= 2.0.5 =
* Updated - Siteimprove logo

= 2.0.4 =
* Added - Siteimprove Recheck to Gutenberg Editor
* Added - When recheck is complete, the button will be re-enabled
* Bugfix - Fixed an issue with si_preview returning undefined index
* Bugfix - Fixed an highlighting issue in which it didn't restore original HTML structure
* Bugfix - Fixed an highlighting issue with "BODY" tag

= 2.0.3 =
* Bugfix - When doing prepublish, the si-preview empties the wp-admin-bar instead of removing it, which improves highlight selectors

= 2.0.2 =
* Added - Calling "clear" on non-content pages in WordPress
* Added - Prepublish can now be started from a published page

= 2.0.1 =
* Bugfix - Fixed checkbox for "Use latest experience" was not properly checked on by default

= 2.0.0 =
* Added - Support for latest experience
* Added - Setting to disable using latest experience
* Added - Public URL field to the plugin

= 1.3.1 =
* Bugfix - Fix Highlighting content issues for prepublish checks.

= 1.3.0 =
* Added - Add Prepublish feature to the plugin

= 1.2.2 =
* Bugfix - Add CSS naming prefixes to avoid collision with other plugins

= 1.2.1 =
* Bugfix - Add check on nonce variable

= 1.2.0 =
* Bugfix - Security fixes according to WordPress Coding Standards and PHPCompatibility rulesets

= 1.1.0 =
* Avoid PHP warnings/errors when saving posts
* Properly display Siteimprove button when editing taxonomies
* Send cms version when request siteimprove token.

= 1.0 =
* First public version
