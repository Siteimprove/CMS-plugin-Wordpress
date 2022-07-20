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

		// Register a new section in the siteimprove page.
		add_settings_section(
			'siteimprove_prepublish',
			__( 'Prepublish', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_settings_section_title',
			'siteimprove'
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
	 * @param mixed $args Section title arguments.
	 * @return void
	 */
	public static function siteimprove_settings_section_title( $args ) {
		if ( 'siteimprove_prepublish' === $args['id'] ) {
			$siteimprove_api_key = get_option( 'siteimprove_api_key', '' );
			$prepublish_allowed  = intval( get_option( 'siteimprove_prepublish_allowed', 0 ) );
			$prepublish_enabled  = intval( get_option( 'siteimprove_prepublish_enabled', 0 ) );
			if ( ! empty( $siteimprove_api_key ) ) {
				if ( 1 === $prepublish_allowed ) {
					?>
					<p>You can use Prepublish on your account.</p>
					<?php
					if ( 0 === $prepublish_enabled ) :
						?>
							<p>
							<?php
							echo wp_kses(
								__( 'To enable prepublish for this website click <a href="#" id="siteimprove-recheck" class="button button-primary">here</a>', 'siteimprove' ),
								array(
									'a' => array(
										'href'  => array(),
										'id'    => array(),
										'class' => array(),
									),
								)
							);
							?>
							</p>
						<?php
					else :
						?>
						<p>
						<?php
						echo wp_kses(
							__( 'Prepublish feature is already enabled for the current website. To use it please go to the preview of any page/post or content that you want to check and click the button <strong>Siteimprove Prepublish Check</strong> located on the top bar of the admin panel', 'siteimprove' ),
							array(
								'strong' => array(),
							)
						);
						?>
						</p>
						<?php
					endif;
				} else {
					?>
					<p>
					<?php
					esc_html_e( 'You can\'t use Prepublish on your account. Please contact sales team to enable this feature for the current website', 'siteimprove' );
					?>
					</p>
					<?php
				}
			} else {
				?>
				<p>
				<?php
				esc_html_e( 'Please provide a valid API Username and API Key before using this feature.', 'siteimprove' );
				?>
				</p>
				<?php
			}
		}
	}

	/**
	 * Form fields
	 *
	 * @param mixed $args Field Arguments.
	 * @return void
	 */
	public static function siteimprove_token_field( $args ) {
		?>

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
						// check if user has the prepublish feature (AKA contentcheck) enabled.
						self::verify_contentcheck( $username, $key );
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

		if ( isset( $request['response'] ) && 200 === $request['response']['code'] ) {
			$results       = json_decode( $request['body'] );
			$account_sites = $results->items;

			$domain     = wp_parse_url( get_site_url(), PHP_URL_HOST );
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
				$return['error'] = __( 'Current domain/website not found for the provided credentials', 'siteimprove' );
			}
		} else {
			$return['error'] = __( 'Unable to check website domain. Please try again later', 'siteimprove' );
		}

		return $return;
	}

	/**
	 * Check against the API endpoint if the user has the prepublish (AKA contentcheck) enabled
	 *
	 * @param string $username API Username.
	 * @param string $key API Key.
	 * @return void
	 */
	public static function verify_contentcheck( $username, $key ) {
		$request = self::make_api_request( $username, $key, '/settings/content_checking' );

		if ( isset( $request['response'] ) && 400 === $request['response']['code'] ) {
			$results = json_decode( $request['body'] );
			if ( preg_match( '/Requires|feature/i', $results->message ) ) {
				update_option( 'siteimprove_prepublish_allowed', 0 );
			}
		} else {
			/*
			TODO: Figure out how to find if the feature is allowed but not enabled yet. For now we
			are considering that if there are no errors, then we can keep going and suppose it's
			then possibly allowed to be enabled by the user whenever he wishes to do so.
			*/
			update_option( 'siteimprove_prepublish_allowed', 1 );

			/*
			Now we'll try to see if the prepublish feature is already enabled.
			If not, then we can	show the user a button so he can enable it himself.
			*/
			$results = json_decode( $request['body'] );
			if ( isset( $results->is_ready ) && true === $results->is_ready ) {
				update_option( 'siteimprove_prepublish_enabled', 1 );
			} else {
				update_option( 'siteimprove_prepublish_enabled', 0 );
			}
		}
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
