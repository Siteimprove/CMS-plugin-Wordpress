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
	 * - Siteimprove_i18n. Defines internationalization functionality.
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
		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/siteimprove-admin.css', array(), $this->version, 'all' );
	}

	/**
	 * Register the JavaScript for the admin area.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/siteimprove-admin.js', array( 'jquery' ), $this->version, FALSE );
	}

	/**
	 * Initial actions.
	 */
	public function siteimprove_init() {
		global $pagenow;

		$urls = get_transient( 'siteimprove_url_' . get_current_user_id() );

		if ( $pagenow != 'admin-ajax.php' &&
		     ! empty( $urls )
		) {
			if ( count( $urls ) > 1 ) {
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
				$this->siteimprove_add_js( get_permalink( $_GET['post'] ), 'siteimprove_input' );
				// Only display recheck button in published posts.
				if ( get_post_status( $_GET['post'] ) == 'publish' ) {
					$this->siteimprove_add_js( get_permalink( $_GET['post'] ), 'siteimprove_recheck_button' );
				}
				break;

			case 'term.php':
			case 'edit-tags.php':
				if ($pagenow == 'term.php' || ($pagenow == 'edit-tags.php' && $_GET['action'] == 'edit')) {
					$this->siteimprove_add_js( get_term_link( (int) $_GET['tag_ID'], $_GET['taxonomy'] ), 'siteimprove_input' );
					$this->siteimprove_add_js( get_term_link( (int) $_GET['tag_ID'], $_GET['taxonomy'] ), 'siteimprove_recheck_button' );
				}
				break;

		}

	}

	/**
	 * Include siteimprove js.
	 */
	private function siteimprove_add_js( $url, $type, $auto = TRUE, $txt = FALSE ) {
		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/siteimprove.js', array( 'jquery' ), $this->version, FALSE );
		wp_enqueue_script( 'siteimprove_overlay', Siteimprove::JS_LIBRARY_URL, array(), FALSE, TRUE );
		wp_localize_script( $this->plugin_name, $type, array(
			'token' => get_option( 'siteimprove_token' ),
			'txt'   => __( 'Siteimprove Recheck' ),
			'url'   => $url,
		) );
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
	 * Save in session post url.
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
	 */
	public function siteimprove_save_session_url_term( $term_id, $tt_id, $taxonomy ) {
		$urls   = get_transient( 'siteimprove_url_' . get_current_user_id() );
		$urls[] = get_term_link( (int) $term_id, $taxonomy );
		set_transient( 'siteimprove_url_' . get_current_user_id(), $urls, 900 );
	}

	/**
	 * Save in session product url.
	 */
	public function siteimprove_save_session_url_product( $new_status, $old_status, $post ) {
		if (
			$new_status == 'publish'
			&& ! empty( $post->ID )
			&& in_array( $post->post_type,
				array( 'product' )
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
			'administrator'
		);

		if ( array_intersect( $allowed_roles, $user->roles ) ) {
			$type = $this->get_current_page_type();
			switch ( $type ) {
				case 'page':
				case 'single':
				case 'category':
				case 'tag':
					$this->siteimprove_add_js( get_permalink(), 'siteimprove_input' );
					break;
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

}
