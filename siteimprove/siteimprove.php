<?php
/**
 * Main Plugin File
 *
 * @package Siteimprove
 */

/**
 * Plugin Name:         Siteimprove Plugin
 * Plugin URI:          https://www.siteimprove.com/integrations/cms-plugin/wordpress/
 * Description:         Integration with Siteimprove.
 * Version:             2.0.3
 * Author:              Siteimprove
 * Author URI:          http://www.siteimprove.com/
 * Requires at least:   4.7.2
 * License:             GPL-2.0+
 * License URI:         http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:         siteimprove
 * Domain Path:         /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Include SiteimproveUtils class.
 */
require_once plugin_dir_path( __FILE__ ) . 'includes/class-siteimproveutils.php';

/**
 * Activation hook.
 */
function activate_siteimprove() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-siteimprove-activator.php';
	Siteimprove_Activator::activate();
}

/**
 * Deactivation hook.
 */
function deactivate_siteimprove() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-siteimprove-deactivator.php';
	Siteimprove_Deactivator::deactivate();
}

// Register activate and deactivate hooks.
register_activation_hook( __FILE__, 'activate_siteimprove' );
register_deactivation_hook( __FILE__, 'deactivate_siteimprove' );

/**
 * The core plugin class that is used to define internationalization
 * and admin-specific hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-siteimprove.php';

/**
 * Begins execution of the plugin.
 */
function run_siteimprove() {
	$plugin = new Siteimprove();
	$plugin->run();
}

run_siteimprove();
