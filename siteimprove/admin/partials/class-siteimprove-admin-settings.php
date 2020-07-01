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

	private $siteimprove_nonce;
	public function request_siteimprove_nonce() {
		return $this->siteimprove_nonce;
	}

	/**
	 * Register section.
	 */
	public function register_section() {
		// Register a new setting for "siteimprove" page.
		register_setting( 'siteimprove', 'siteimprove_token' );

		// Register a new section in the "siteimprove" page.
		add_settings_section(
			'siteimprove_token',
			__( 'Token', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_token_title',
			'siteimprove'
		);

		// register a new field in the "wporg_section_developers" section, inside the "wporg" page
		add_settings_field(
			'siteimprove_token',
			__( 'Token', 'siteimprove' ),
			'Siteimprove_Admin_Settings::siteimprove_token_field',
			'siteimprove',
			'siteimprove_token'
		);

		$this->siteimprove_nonce = wp_create_nonce('siteimprove_nonce');
	}

	/**
	 * Register menu for settings form page.
	 */
	public function register_menu() {
		// Add top level menu page.
		add_menu_page(
			__('Siteimprove Plugin'),
			__('Siteimprove'),
			'manage_options',
			'siteimprove',
			'Siteimprove_Admin_Settings::siteimprove_settings_form'
		);
	}

	/**
	 * Section title.
	 */
	public static function siteimprove_token_title( $args ) {
	}

	/**
	 * Form fields.
	 */
	public static function siteimprove_token_field( $args ) { ?>

		<input type="text" id="siteimprove_token_field" name="siteimprove_token" value="<?php echo esc_attr( get_option( 'siteimprove_token' ) ); ?>" maxlength="50" size="50" />
        <input class="button" id="siteimprove_token_request" type="button" value="<?php echo esc_attr( __( 'Request new token', 'siteimprove' ) ); ?>" />

        <?php
	}

	/**
	 * Create settins form.
	 */
	public static function siteimprove_settings_form() {
		// Check access.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Show success message.
		if ( wp_verify_nonce( $siteimprove_nonce, 'siteimprove_nonce' ) && isset( $_GET['settings-updated'] ) ) {
			add_settings_error( 'siteimprove_messages', 'siteimprove_message', __( 'Settings Saved', 'siteimprove' ), 'updated' );
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
				submit_button( __('Save Settings') );
				?>
            </form>
        </div>
		<?php
	}

	/**
	 * Return new token for ajax requests.
	 */
	public function request_token() {
		// Check access.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo esc_html( SiteimproveUtils::requestToken() );
		wp_die();
	}

}
