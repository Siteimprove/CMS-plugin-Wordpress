<?php
/**
 * Plugin settings form.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/admin/partials
 */

/**
 * Plugin settings form.
 *
 * Defines the plugin settings form methods.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/admin/partials
 */
class Siteimprove_Admin_Settings {

	/**
	 * Admin page nonce
	 *
	 * @var string Nonce
	 */
	private $siteimprove_nonce;

	const SITEIMPROVE_API_URL = 'https://api.siteimprove.com/v2';

	/**
	 * Returns the current nonce
	 *
	 * @return string WP Nonce
	 */
	public function request_siteimprove_nonce() {
		return $this->siteimprove_nonce;
	}

	/**
	 * Register section.
	 */
	public function register_section() {
		// Register settings for siteimprove plugin settings page.
		register_setting( 'siteimprove', 'siteimprove_token' );
		register_setting( 'siteimprove', 'siteimprove_api_username', 'Siteimprove_Admin_Settings::validate_api_username' );
		register_setting( 'siteimprove', 'siteimprove_api_key', 'Siteimprove_Admin_Settings::validate_api_key' );

		// Register a new section in the siteimprove page.
		add_settings_section(
			'siteimprove_token',
			__( 'Token', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_settings_section_title',
			'siteimprove'
		);

		// register a new field siteimprove_token_field, inside the siteimprove_token section of the settings page.
		add_settings_field(
			'siteimprove_token',
			__( 'Token', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_token_field',
			'siteimprove',
			'siteimprove_token'
		);

		// Register a new section in the siteimprove page.
		add_settings_section(
			'siteimprove_api_credentials',
			__( 'API Credentials', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_settings_section_title',
			'siteimprove'
		);

		// register a new field siteimprove_api_username_field, inside the siteimprove_api_credentials section of the settings page.
		add_settings_field(
			'siteimprove_api_username',
			__( 'API Username (Email)', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_api_username_field',
			'siteimprove',
			'siteimprove_api_credentials'
		);

		// register a new field siteimprove_api_key_field, inside the siteimprove_api_credentials section of the settings page.
		add_settings_field(
			'siteimprove_api_key',
			__( 'API Key', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_api_key_field',
			'siteimprove',
			'siteimprove_api_credentials'
		);

		$this->siteimprove_nonce = wp_create_nonce( 'siteimprove_nonce' );
	}

	/**
	 * Register menu for settings form page.
	 */
	public function register_menu() {
		// Add top level menu page.
		add_menu_page(
			__( 'Siteimprove Plugin' ),
			__( 'Siteimprove' ),
			'manage_options',
			'siteimprove',
			'Siteimprove_Admin_Settings::siteimprove_settings_form'
		);
	}

	/**
	 * Section title.
	 *
	 * @param mixed $args Generic Arguments.
	 * @return void
	 */
	public static function siteimprove_settings_section_title( $args ) {
	}

	/**
	 * Form fields
	 *
	 * @param mixed $args Field Arguments.
	 * @return void
	 */
	public static function siteimprove_token_field( $args ) { ?>

		<input type="text" id="siteimprove_token_field" name="siteimprove_token" value="<?php echo esc_attr( get_option( 'siteimprove_token' ) ); ?>" maxlength="50" size="50" />
		<input class="button" id="siteimprove_token_request" type="button" value="<?php echo esc_attr( __( 'Request new token', 'siteimprove' ) ); ?>" />
		<?php
	}

	/**
	 * Form fields
	 *
	 * @param mixed $args Field Arguments.
	 * @return void
	 */
	public static function siteimprove_api_username_field( $args ) {
		?>

		<input type="text" id="siteimprove_api_username_field" name="siteimprove_api_username" value="<?php echo esc_attr( get_option( 'siteimprove_api_username' ) ); ?>" maxlength="50" size="50" />
		<?php
	}

	/**
	 * Form fields
	 *
	 * @param mixed $args Field Arguments.
	 * @return void
	 */
	public static function siteimprove_api_key_field( $args ) {
		?>

		<input type="text" id="siteimprove_api_key_field" name="siteimprove_api_key" value="<?php echo esc_attr( get_option( 'siteimprove_api_key' ) ); ?>" maxlength="50" size="50" />
		<?php
	}

	/**
	 * Create settings form.
	 */
	public static function siteimprove_settings_form() {
		// Check access.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		settings_errors( 'siteimprove_messages' );
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				// Display settings fields.
				settings_fields( 'siteimprove' );
				do_settings_sections( 'siteimprove' );
				// Submit button.
				submit_button( __( 'Save Settings', 'siteimprove' ) );
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Field Validation
	 *
	 * @param string $value Original value posted in settings page.
	 * @return string
	 */
	public static function validate_api_username( $value ) {
		if ( ! empty( $value ) ) {
			// new username was inputted, check if it's a valid email.
			if ( ! filter_var( $value, FILTER_VALIDATE_EMAIL ) ) {
				add_settings_error( 'siteimprove_messages', 'siteimprove_api_username_error', __( 'API Username must be a valid email', 'siteimprove' ) );
				$old_value = get_option( 'siteimprove_api_username' );
				if ( ! empty( $old_value ) ) {
					return $old_value;
				}
			}
		}
		return $value;
	}

	/**
	 * Field Validation
	 *
	 * @param string $value Original value posted in settings page.
	 * @return string
	 */
	public static function validate_api_key( $value ) {
		if ( ! empty( $value ) ) {
			// new API key inserted, let's check if it's a valid one.
			if ( ! preg_match( '/^[a-zA-Z0-9]{32}$/', $value ) ) {
				add_settings_error( 'siteimprove_messages', 'siteimprove_api_key_error', __( 'Invalid format for API Key field', 'siteimprove' ) );
				$old_value = get_option( 'siteimprove_api_key' );
				if ( ! empty( $old_value ) ) {
					return $old_value;
				}
			} else {
				/*
				Now if API username and key are set, it's time to test both
				against the API endpoint to check if it's a valid user/key set
				and also if the keys correspond to the current website
				*/
				if (
					isset( $_POST['siteimprove_api_username'], $_POST['siteimprove_api_key'], $_REQUEST['_wpnonce'] )
					&& wp_verify_nonce( sanitize_key( $_REQUEST['_wpnonce'] ), 'siteimprove-options' )
				) {
					$username = sanitize_text_field( wp_unslash( $_POST['siteimprove_api_username'] ) );
					$key      = sanitize_text_field( wp_unslash( $_POST['siteimprove_api_key'] ) );
					$result   = self::check_credentials( $username, $key );
					if ( 'false' === $result['status'] ) {
						add_settings_error( 'siteimprove_messages', 'siteimprove_api_credentials_error', $result['error'] );
					} else {
						add_settings_error( 'siteimprove_messages', 'siteimprove_message', __( 'Settings Saved', 'siteimprove' ), 'updated' );
					}
				}
			}
		}
		return $value;
	}

	/**
	 * Abstractor for any API requests made on the admin page
	 *
	 * @param string $username API Username.
	 * @param string $key API Key.
	 * @param string $path endpoint on the API.
	 * @param array  $args optional arguments to be sent on the request.
	 *
	 * @return object Results of the API call.
	 */
	public static function make_api_request( $username, $key, $path, $args = array() ) {
		$params = array(
			'httpversion' => '1.1',
			'blocking'    => true,
			'headers'     => array(
				'Authorization' => 'Basic ' . base64_encode( $username . ':' . $key ),
				'sslverify'     => false,
			),
		);
		array_merge( $params, $args );

		$request = wp_remote_get(
			self::SITEIMPROVE_API_URL . $path,
			$params
		);
		return $request;
	}
	/**
	 * Check if the credentials are valid for the current domain
	 *
	 * @param string $username API Username.
	 * @param string $key API Key.
	 * @return array
	 */
	public static function check_credentials( $username, $key ) {
		$return = array(
			'status' => 'false',
			'error'  => __( 'Unable to check API Credentials, please try again', 'siteimprove' ),
		);

		$request = self::make_api_request( $username, $key, '/ping/account' );

		if ( isset( $request['response'] ) && 401 === $request['response']['code'] ) {
			// Wrong credentials, trow error and exit.
			$return['error'] = __( 'Wrong API Credentials, API access denied. Please fix the credentials and try again', 'siteimprove' );
			return $return;
		}

		$request = self::make_api_request( $username, $key, '/sites' );

		// @codingStandardsIgnoreStart
		if ( isset( $request['response'] ) && 200 === $request['response']['code'] ) {
			echo '<pre>';
			$results       = json_decode( $request['body'] );
			$account_sites = $results->items;

			$domain     = parse_url( get_site_url(), PHP_URL_HOST );
			$site_found = false;

			foreach ( $account_sites as $site_key => $site_data ) {
				if ( false !== strpos( $site_data->url, $domain ) ) {
					$site_found = true;
				}
			}

			if ( true === $site_found ) {
				$return = array(
					'status' => 'true',
				);
			} else {
				$return['error'] = __( 'Current Website not found within the API credentials provided, please check if you\'re using the correct credentials', 'siteimprove' );
			}
		} else {
			$return['error'] = __( 'Unable to check website domain. Please try again later', 'siteimprove' );
		}
		// @codingStandardsIgnoreEnd

		return $return;
	}

	/**
	 * Return new token for ajax requests.
	 */
	public function request_token() {
		// Check access.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo esc_html( SiteimproveUtils::request_token() );
		wp_die();
	}
}
