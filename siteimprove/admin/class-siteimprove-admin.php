<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/admin
 */
class Siteimprove_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @access   private
	 * @var      string $plugin_name The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @access   private
	 * @var      string $version The current version of this plugin.
	 */
	private $version;

	/**
	 * Instance of Siteimprove_Admin_Settings class used inside the Admin class to load dependencies
	 *
	 * @var Siteimprove_Admin_Settings
	 */
	private $settings;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param      string $plugin_name The name of this plugin.
	 * @param      string $version The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {

		$this->plugin_name = $plugin_name;
		$this->version     = $version;

		$this->load_dependencies();

	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Include the following files that make up the plugin:
	 *
	 * - Siteimprove_Loader. Orchestrates the hooks of the plugin.
	 * - Siteimprove_I18n. Defines internationalization functionality.
	 * - Siteimprove_Admin. Defines all hooks for the admin area.
	 * - Siteimprove_Public. Defines all hooks for the public side of the site.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @access   private
	 */
	private function load_dependencies() {
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/partials/class-siteimprove-admin-settings.php';
		$this->settings = new Siteimprove_Admin_Settings();
	}

	/**
	 * Register the stylesheets for the admin area.
	 */
	public function enqueue_styles() {
		wp_enqueue_style( 'siteimprove_admin_css', plugin_dir_url( __FILE__ ) . 'css/siteimprove-admin.css', array(), $this->version, 'all' );
	}

	/**
	 * Register the stylesheets for the preview area.
	 */
	public function enqueue_preview_styles() {
		global $wp_query;
		$prepublish_allowed = intval( get_option( 'siteimprove_prepublish_allowed', 0 ) );
		$prepublish_enabled = intval( get_option( 'siteimprove_prepublish_enabled', 0 ) );

		if ( ( $wp_query->is_preview() || $wp_query->is_singular() ) && 1 === $prepublish_allowed && 1 === $prepublish_enabled ) {
			wp_enqueue_style( 'siteimprove_preview_css', plugin_dir_url( __FILE__ ) . 'css/siteimprove-preview.css', array(), $this->version, 'all' );
		}
	}

	/**
	 * Register the JavaScript for the admin area.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script( 'siteimprove_admin_js', plugin_dir_url( __FILE__ ) . 'js/siteimprove-admin.js', array( 'jquery' ), $this->version, false );
	}

	/**
	 * Gutenberg script for adding buttons to its editor such as Recheck
	 */
	public function gutenberg_siteimprove_plugin() {
		wp_enqueue_script(
			'gutenberg-siteimprove-plugin',
			plugin_dir_url( __FILE__ ) . 'js/siteimprove-gutenberg.js',
			array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'siteimprove' ),
			$this->version,
			false
		);
		$si_js_args = array(
			'token' => get_option( 'siteimprove_token' ),
			'text' => __( 'Siteimprove Recheck', 'siteimprove' ),
			'url' => get_permalink( $post_id ),
		);
		wp_localize_script(
			'gutenberg-siteimprove-plugin',
			'siteimprove_gutenberg_recheck',
			$si_js_args
		);
	}

	/**
	 * Initial actions.
	 */
	public function siteimprove_init() {
		global $pagenow;

		$urls = get_transient( 'siteimprove_url_' . get_current_user_id() );

		if ( ! wp_doing_ajax() && ! empty( $urls ) ) {
			if ( is_array( $urls ) && count( $urls ) > 1 ) {
				$url    = esc_url( home_url() );
				$method = 'siteimprove_recrawl';
			} else {
				$url    = array_pop( $urls );
				$method = 'siteimprove_recheck';
			}
			delete_transient( 'siteimprove_url_' . get_current_user_id() );
			$this->siteimprove_add_js( $url, $method );
		}

		switch ( $pagenow ) {
			case 'post.php':
				$post_id   = wp_verify_nonce( $this->settings->request_siteimprove_nonce(), 'siteimprove_nonce' ) && ! empty( $_GET['post'] ) ? (int) $_GET['post'] : 0;
				$permalink = get_permalink( $post_id );

				if ( $permalink ) {
					$this->siteimprove_add_js( get_permalink( $post_id ), 'siteimprove_input' );
					// Only display recheck button in published posts.
					if ( get_post_status( $post_id ) === 'publish' ) {
						$this->siteimprove_add_js( get_permalink( $post_id ), 'siteimprove_recheck_button' );
					}
				}
				break;

			case 'term.php':
			case 'edit-tags.php':
				$tag_id   = wp_verify_nonce( $this->settings->request_siteimprove_nonce(), 'siteimprove_nonce' ) && ! empty( $_GET['tag_ID'] ) ? (int) $_GET['tag_ID'] : 0;
				$taxonomy = wp_verify_nonce( $this->settings->request_siteimprove_nonce(), 'siteimprove_nonce' ) && ! empty( $_GET['taxonomy'] ) ? sanitize_key( $_GET['taxonomy'] ) : '';

				if ( 'term.php' === $pagenow || ( 'edit-tags.php' === $pagenow && wp_verify_nonce( $this->settings->request_siteimprove_nonce(), 'siteimprove_nonce' ) && ! empty( $_GET['action'] ) && 'edit' === $_GET['action'] ) ) {
					$this->siteimprove_add_js( get_term_link( (int) $tag_id, $taxonomy ), 'siteimprove_input' );
					$this->siteimprove_add_js( get_term_link( (int) $tag_id, $taxonomy ), 'siteimprove_recheck_button' );
				}
				break;

			default:
				$host    = isset( $_SERVER['HTTP_HOST'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
				$request = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
				$this->siteimprove_add_js( $host . $request, 'siteimprove_domain' );
		}

	}

	/**
	 * Include siteimprove js.
	 *
	 * @param string $url Url of the included js file.
	 * @param string $type Type/Handle of resource being included to localize the script correctly.
	 * @return void
	 */
	private function siteimprove_add_js( $url, $type ) {
		$file_name = get_option( 'siteimprove_overlayjs_file', 'overlay-v2-dev.js' );
		$disabled_new_version = get_option( 'siteimprove_disable_new_version' );
		$pattern = '/^[a-zA-Z_\d-]+.js/';
		$nonce = wp_create_nonce( 'siteimprove_nonce' );

		if ( ! empty( $file_name ) ) {
			if ( preg_match( $pattern, $file_name ) ) {
				$overlay_path = Siteimprove::JS_LIBRARY_URL . $file_name;
			} else {
				$overlay_path = $file_name;
			}
		} else {
			if ( $disabled_new_version ) {
				$overlay_path = Siteimprove::JS_LIBRARY_URL . 'overlay-latest.js';
			} else {
				$overlay_path = Siteimprove::JS_LIBRARY_URL . 'overlay-v1.js';
			}
		}

		if ( isset( $_GET['si_preview_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['si_preview_nonce'] ) ), 'siteimprove_nonce' ) ) {
			return;
		}
		else {	
			wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/siteimprove.js', array( 'jquery' ), $this->version, false );
			wp_enqueue_script( 'siteimprove_overlay', $overlay_path, array(), $this->version, true );
		}
		$public_url = get_option( 'siteimprove_public_url' );

		if ( ! empty( $public_url ) ) {
			$parsed_url = wp_parse_url( $url );
			$url        = "$public_url$parsed_url[path]" . ( isset( $parsed_url['query'] ) ? "?$parsed_url[query]" : '' );
		}

		$is_content_page = is_preview() || is_singular();

		$si_js_args = array(
			'token' => get_option( 'siteimprove_token' ),
			'txt'   => __( 'Siteimprove Recheck', 'siteimprove' ),
			'url'   => $url,
			'version' => $disabled_new_version,
			'is_content_page' => $is_content_page,
			'nonce' => $nonce,
		);

		wp_localize_script(
			$this->plugin_name,
			esc_js( $type ),
			$si_js_args
		);

		// Adding translation strings.
		wp_localize_script(
			$this->plugin_name,
			'siteimprove_plugin_text',
			array(
				'loading'                     => __( 'Loading... Please wait.', 'siteimprove' ),
				'prepublish_activate_running' => __( 'We are now activating prepublish for your website... Please keep the current page open while the process is running.', 'siteimprove' ),
				'prepublish_feature_ready'    => __( 'Prepublish feature is already enabled for the current website. To use it please go to the preview of any page/post or content that you want to check and click the button <strong>Siteimprove Prepublish Check</strong> located on the top bar of the admin panel.', 'siteimprove' ),
				'prepublish_activation_error' => __( 'Error activating prepublish. Please contact support team.', 'siteimprove' ),
			)
		);
	}

	/**
	 * Register settings form section.
	 */
	public function siteimprove_settings() {
		$this->settings->register_section();
	}

	/**
	 * Register menu page.
	 */
	public function siteimprove_settings_page() {
		$this->settings->register_menu();
	}

	/**
	 * Register action for token requests.
	 */
	public function siteimprove_request_token() {
		$this->settings->request_token();
	}

	/**
	 * Register action for prepublish feature check after manual activation on the admin panel side
	 *
	 * @return void
	 */
	public function siteimprove_check_prepublish_activation() {
		$this->settings->check_prepublish_activation();
	}

	/**
	 * Register action for prepublish feature manual activation made on the admin panel side
	 *
	 * @return void
	 */
	public function siteimprove_prepublish_manual_activation() {
		$this->settings->prepublish_manual_activation();
	}


	/**
	 * Save in session post url.
	 *
	 * @param integer $post_ID WordPress Post ID.
	 * @return void
	 */
	public function siteimprove_save_session_url_post( $post_ID ) {
		if ( ! wp_is_post_revision( $post_ID ) && ! wp_is_post_autosave( $post_ID ) ) {
			$urls   = get_transient( 'siteimprove_url_' . get_current_user_id() );
			$urls[] = get_permalink( $post_ID );
			set_transient( 'siteimprove_url_' . get_current_user_id(), $urls, 900 );
		}
	}

	/**
	 * Save in session term url.
	 *
	 * @param integer $term_id WordPress Term ID.
	 * @param mixed   $tt_id WordPress parameter added for hook compatibility.
	 * @param mixed   $taxonomy WordPress taxonomy.
	 * @return void
	 */
	public function siteimprove_save_session_url_term( $term_id, $tt_id, $taxonomy ) {
		$urls   = get_transient( 'siteimprove_url_' . get_current_user_id() );
		$urls[] = get_term_link( (int) $term_id, $taxonomy );
		set_transient( 'siteimprove_url_' . get_current_user_id(), $urls, 900 );
	}

	/**
	 * Save in session product url.
	 *
	 * @param string $new_status WordPress post status.
	 * @param string $old_status WordPress post status.
	 * @param object $post WordPress Post Object.
	 * @return void
	 */
	public function siteimprove_save_session_url_product( $new_status, $old_status, $post ) {
		if (
			'publish' === $new_status
			&& ! empty( $post->ID )
			&& in_array(
				$post->post_type,
				array( 'product' ),
				true
			)
		) {
			$urls   = get_transient( 'siteimprove_url_' . get_current_user_id() );
			$urls[] = get_permalink( $post->ID );
			set_transient( 'siteimprove_url_' . get_current_user_id(), $urls, 900 );
		}
	}

	/**
	 * Include js in frontend pages.
	 */
	public function siteimprove_wp_head() {

		$user          = wp_get_current_user();
		$allowed_roles = array(
			'shop_manager',
			'contributor',
			'author',
			'editor',
			'administrator',
		);

		if ( array_intersect( $allowed_roles, $user->roles ) ) {
			$type = $this->get_current_page_type();
			switch ( $type ) {
				case 'page':
				case 'single':
				case 'category':
				case 'tag':
				case 'tax':
					$this->siteimprove_add_js( get_permalink(), 'siteimprove_input' );
					break;

				default:
					$host    = isset( $_SERVER['HTTP_HOST'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
					$request = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
					$this->siteimprove_add_js( $host . $request, 'siteimprove_domain' );
			}
		}
	}

	/**
	 * Return current page type.
	 */
	protected function get_current_page_type() {
		global $wp_query;
		$loop = 'notfound';

		if ( $wp_query->is_page ) {
			$loop = is_front_page() ? 'front' : 'page';
		} elseif ( $wp_query->is_home ) {
			$loop = 'home';
		} elseif ( $wp_query->is_single ) {
			$loop = ( $wp_query->is_attachment ) ? 'attachment' : 'single';
		} elseif ( $wp_query->is_category ) {
			$loop = 'category';
		} elseif ( $wp_query->is_tag ) {
			$loop = 'tag';
		} elseif ( $wp_query->is_tax ) {
			$loop = 'tax';
		} elseif ( $wp_query->is_archive ) {
			if ( $wp_query->is_day ) {
				$loop = 'day';
			} elseif ( $wp_query->is_month ) {
				$loop = 'month';
			} elseif ( $wp_query->is_year ) {
				$loop = 'year';
			} elseif ( $wp_query->is_author ) {
				$loop = 'author';
			} else {
				$loop = 'archive';
			}
		} elseif ( $wp_query->is_search ) {
			$loop = 'search';
		} elseif ( $wp_query->is_404 ) {
			$loop = 'notfound';
		}

		return $loop;
	}

	/**
	 * Adds the prepublish menu item on the top bar when user is
	 * in preview mode so he can send the content to prepublish.
	 *
	 * @param WP_Admin_Bar $admin_bar WordPress Admin Bar Object.
	 * @return void
	 */
	public function add_prepublish_toolbar_item( WP_Admin_Bar $admin_bar ) {
		global $pagenow;
		$prepublish_allowed = intval( get_option( 'siteimprove_prepublish_allowed', 0 ) );
		$prepublish_enabled = intval( get_option( 'siteimprove_prepublish_enabled', 0 ) );

		if ( ( is_preview() || is_singular() ) && 1 === $prepublish_allowed && 1 === $prepublish_enabled ) {
			$prepublish_button = 
			'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" height="28px" width="28px" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="28px" height="28px" viewBox="0 0 300 300" style="enable-background:new 0 0 300 300;" xml:space="preserve">
				<circle fill="#0D4CD3" cx="150" cy="150" r="150"/>
				<g>
					<path fill="#FFFFFF" d="M167.9,135.3l-14.3-4.2c-6.5-2-11.6-3.8-15.4-5.4c-3.8-1.6-6.5-3.4-8.1-5.2c-1.6-1.8-2.4-4.1-2.4-6.9   c0-3.4,1.1-6.3,3.2-8.7c2.1-2.5,5.1-4.4,9-5.7c3.8-1.3,8.3-2,13.5-2c5.2,0,10.4,0.7,15.6,2c5.2,1.3,9.9,3.2,14.3,5.5   c4.4,2.3,8,5.1,11,8.2l19-28.1c-6.5-6.3-15.1-11.2-25.7-14.8c-10.7-3.6-22.2-5.5-34.6-5.5c-9,0-17.3,1.3-24.9,3.8   c-7.6,2.5-14.2,6.1-19.9,10.7c-5.6,4.6-10,10-13.1,16.2c-3.1,6.2-4.7,13-4.7,20.3c0,11.4,3.7,21.2,11.1,29.3   c7.4,8.1,19.6,14.5,36.5,19.2l14.1,4c9.9,2.7,16.7,5.4,20.3,8.3c3.6,2.9,5.5,6.4,5.5,10.7c0,5.2-2.5,9.1-7.6,11.8   c-5,2.7-11.6,4-19.6,4c-5.7,0-11.6-0.7-17.6-2.2c-6.1-1.4-11.7-3.5-17.1-6.2c-5.3-2.7-9.7-5.8-13.1-9.5l-18.3,29.1   c8.1,7,18.1,12.3,29.8,15.9c11.7,3.7,23.8,5.5,36.2,5.5c13.4,0,24.9-2.2,34.6-6.7s17.2-10.6,22.6-18.6c5.3-7.9,8-17.1,8-27.5   c0-11.9-3.8-21.5-11.3-29C196.8,146.4,184.7,140.2,167.9,135.3z"/>
				</g>
			</svg>';
			$admin_bar->add_menu(
				array(
					'id'    => 'siteimprove-trigger-contentcheck',
					'title' => $prepublish_button . __( 'Prepublish', 'siteimprove' ),
					'group' => null,
					'href'  => '#',
					'meta'  => array(
						'title' => __( 'Siteimprove Prepublish', 'siteimprove' ),
						'class' => 'siteimprove-trigger-contentcheck',
					),
				)
			);
		}
	}

}
