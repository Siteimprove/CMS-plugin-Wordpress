<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @package    Siteimprove
 * @subpackage Siteimprove/includes
 */
class Siteimprove {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @access   protected
	 * @var      Siteimprove_Loader $loader Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @access   protected
	 * @var      string $plugin_name The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @access   protected
	 * @var      string $version The current version of the plugin.
	 */
	protected $version;

	const JS_LIBRARY_URL = 'https://cdn.siteimprove.net/cms/';

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 */
	public function __construct() {

		$this->plugin_name = 'siteimprove';
		$this->version     = '2.0.0';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();

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

		/**
		 * The class responsible for orchestrating the actions and filters of the
		 * core plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-siteimprove-loader.php';

		/**
		 * The class responsible for defining internationalization functionality
		 * of the plugin.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'includes/class-siteimprove-i18n.php';

		/**
		 * The class responsible for defining all actions that occur in the admin area.
		 */
		require_once plugin_dir_path( dirname( __FILE__ ) ) . 'admin/class-siteimprove-admin.php';

		$this->loader = new Siteimprove_Loader();

	}

	/**
	 * Define the locale for this plugin for internationalization.
	 *
	 * Uses the Siteimprove_I18n class in order to set the domain and to register the hook
	 * with WordPress.
	 *
	 * @access   private
	 */
	private function set_locale() {

		$plugin_i18n = new Siteimprove_I18n();

		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );

	}

	/**
	 * Register all of the hooks related to the admin area functionality
	 * of the plugin.
	 *
	 * @access   private
	 */
	private function define_admin_hooks() {

		$plugin_admin = new Siteimprove_Admin( $this->get_plugin_name(), $this->get_version() );

		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_admin, 'enqueue_preview_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );

		// Settings form.
		$this->loader->add_action( 'admin_init', $plugin_admin, 'siteimprove_settings' );
		$this->loader->add_action( 'admin_menu', $plugin_admin, 'siteimprove_settings_page' );
		$this->loader->add_action( 'wp_ajax_siteimprove_request_token', $plugin_admin, 'siteimprove_request_token' );
		$this->loader->add_action( 'wp_ajax_siteimprove_prepublish_activation', $plugin_admin, 'siteimprove_prepublish_manual_activation' );
		$this->loader->add_action( 'wp_ajax_siteimprove_check_prepublish_activation', $plugin_admin, 'siteimprove_check_prepublish_activation' );
		$this->loader->add_action( 'siteimprove_before_settings_form', $plugin_admin, 'siteimprove_before_settings_form' );

			$this->loader->add_action( 'admin_init', $plugin_admin, 'siteimprove_init' );
			$this->loader->add_action( 'publish_page', $plugin_admin, 'siteimprove_save_session_url_post' );
			$this->loader->add_action( 'publish_post', $plugin_admin, 'siteimprove_save_session_url_post' );
			$this->loader->add_action( 'edit_term', $plugin_admin, 'siteimprove_save_session_url_term', 10, 3 );
			$this->loader->add_action( 'create_term', $plugin_admin, 'siteimprove_save_session_url_term', 10, 3 );
			$this->loader->add_action( 'transition_post_status', $plugin_admin, 'siteimprove_save_session_url_product', 10, 3 );
		$this->loader->add_action( 'wp_head', $plugin_admin, 'siteimprove_wp_head' );    
		$this->loader->add_action( 'admin_bar_menu', $plugin_admin, 'add_prepublish_toolbar_item', 999, 1 );
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @return    Siteimprove_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}

}
