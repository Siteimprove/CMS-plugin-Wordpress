<?php
/**
 * Fired during plugin deactivation
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */
class Siteimprove_Deactivator {

	/**
	 * Delete Siteimprove token.
	 */
	public static function deactivate() {
		delete_option( 'siteimprove_token' );
	}

}
