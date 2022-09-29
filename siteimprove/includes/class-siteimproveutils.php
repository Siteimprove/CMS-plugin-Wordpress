<?php
/**
 * Global Utilities used by the plugin
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */

/**
 * Global Utilities Class used throughout the plugin
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */
class SiteimproveUtils {

	const TOKEN_REQUEST_URL = 'https://my2.siteimprove.com/auth/token';

	/**
	 * Return Siteimprove token.
	 */
	public static function request_token() {
		// Request new token.
		$response = wp_remote_get( self::TOKEN_REQUEST_URL . '?cms=wordpress_' . get_bloginfo( 'version' ), array( 'headers' => array( 'Accept' => 'application/json' ) ) );

		// Check the response code.
		$response_code = wp_remote_retrieve_response_code( $response );
		$data          = wp_remote_retrieve_body( $response );
		if ( 200 === $response_code && ! empty( $data ) ) {
			$json = json_decode( $data );
			if ( ! empty( $json->token ) ) {
				return $json->token;
			}
		}

		return false;
	}

	/**
	 * Check if the option exists
	 *
	 * @param string  $name Option name.
	 * @param boolean $site_wide If.
	 * @return boolean True if the option exists, false otherwise
	 */
	public static function option_exists( $name, $site_wide = false ) {
		global $wpdb;

		return $wpdb->query( 'SELECT * FROM ' . $wpdb->prepare( '%s options WHERE option_name = `%s` LIMIT 1', ( $site_wide ? $wpdb->base_prefix : $wpdb->prefix ), $name ) );
	}

}
