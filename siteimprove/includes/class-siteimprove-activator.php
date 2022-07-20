<?php

/**
 * Fired during plugin activation
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */
class Siteimprove_Activator {

	/**
	 * Request a Siteimprove token and save it.
	 */
	public static function activate() {
		// Request new token.
		if ( $token = SiteimproveUtils::request_token() ) {
			add_option( 'siteimprove_token', $token );
		}
	}

}
