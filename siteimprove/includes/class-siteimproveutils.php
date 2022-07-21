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

}
