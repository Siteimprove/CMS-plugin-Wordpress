<?php

/**
 * Class SiteimproveUtils.
 */
class SiteimproveUtils {

	const TOKEN_REQUEST_URL = 'https://my2.siteimprove.com/auth/token';

	/**
	 * Return Siteimprove token.
	 */
	static public function requestToken() {
		// Request new token.
		$response = wp_remote_get( self::TOKEN_REQUEST_URL, array( 'headers' => array( 'Accept' => 'application/json' ) ) );

		// Check the response code.
		$response_code = wp_remote_retrieve_response_code( $response );
		$data = wp_remote_retrieve_body( $response );
		if ( $response_code == 200 && ! empty( $data ) ) {
			$json = json_decode( $data );
			if ( ! empty( $json->token ) ) {
				return $json->token;
			}
		}

		return FALSE;
	}

}