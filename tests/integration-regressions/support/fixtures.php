<?php
/** Fixtures for the isolated integration regression environment. */
if ( ! defined( 'SITEIMPROVE_REGRESSION_TEST_ENVIRONMENT' ) || ! SITEIMPROVE_REGRESSION_TEST_ENVIRONMENT || 'local' !== wp_get_environment_type() ) {
	return;
}

// wp-env requires global URL constants for bootstrap. Real multisite requests
// must read each site's own database URLs instead of those global overrides.
remove_filter( 'option_home', '_config_wp_home' );
remove_filter( 'option_siteurl', '_config_wp_siteurl' );

add_action( 'init', function () { remove_action( 'init', 'playground_auto_login', 1 ); }, 0 );

// Never contact external services. Only token issuance has a canned response.
add_filter( 'pre_http_request', function ( $response, $args, $url ) {
	if ( 0 === strpos( $url, 'https://my2.siteimprove.com/auth/token?' ) ) {
		update_option( 'regression_test_token_requests', (int) get_option( 'regression_test_token_requests', 0 ) + 1 );
		return array( 'response' => array( 'code' => 200 ), 'body' => '{"token":"regression-test-token"}', 'headers' => array() );
	}
	return new WP_Error( 'regression_test_network_blocked', 'External HTTP is disabled.' );
}, 10, 3 );

add_action( 'admin_menu', function () {
	add_management_page( 'Regression test fixtures', 'Regression test fixtures', 'manage_options', 'regression-test-fixtures', function () {
		echo '<input id="fixture-nonce" value="' . esc_attr( wp_create_nonce( 'regression-test-prepare' ) ) . '">';
		echo '<output id="token-requests">' . (int) get_option( 'regression_test_token_requests', 0 ) . '</output>';
	} );
} );

add_action( 'admin_post_regression_test_prepare', function () {
	if ( ! current_user_can( 'manage_network_options' ) ) {
		wp_die( 'Network administrator required.', '', array( 'response' => 403 ) );
	}
	check_admin_referer( 'regression-test-prepare' );
	$mode = isset( $_POST['mode'] ) ? sanitize_key( $_POST['mode'] ) : 'default';
	$users = array();
	foreach ( array( 'editor', 'author', 'contributor', 'subscriber', 'custom_editor', 'custom_reader', 'network_admin' ) as $role ) {
		$login = 'regression_' . $role;
		$user = get_user_by( 'login', $login );
		$id = $user ? $user->ID : wp_create_user( $login, 'regression-fixture-password', $login . '@example.test' );
		if ( is_wp_error( $id ) ) { wp_die( 'Could not create fixture user.' ); }
		$users[ $role ] = $id;
	}
	grant_super_admin( $users['network_admin'] );
	// get_site_by_path falls back to the main site; require an exact path match.
	$matches = get_sites( array( 'domain' => get_network()->domain, 'path' => '/regression-subsite/', 'number' => 1 ) );
	$second_id = $matches ? $matches[0]->blog_id : wpmu_create_blog( get_network()->domain, '/regression-subsite/', 'Regression subsite', get_current_user_id() );
	if ( is_wp_error( $second_id ) ) { wp_die( 'Could not create subsite.' ); }
	$sites = array();
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
	foreach ( array( get_main_site_id(), (int) $second_id ) as $blog_id ) {
		switch_to_blog( $blog_id );
		add_role( 'custom_editor', 'Custom Editor', get_role( 'editor' )->capabilities );
		add_role( 'custom_reader', 'Custom Reader', array( 'read' => true ) );
		foreach ( $users as $role => $id ) {
			if ( 'network_admin' === $role ) {
				remove_user_from_blog( $id, $blog_id );
			} else {
				add_user_to_blog( $blog_id, $id, $role );
			}
		}
		$activation = activate_plugin( 'siteimprove/siteimprove.php' );
		if ( is_wp_error( $activation ) ) { wp_die( 'Plugin activation failed.' ); }
		update_option( 'siteimprove_token', 'regression-site-' . $blog_id );
		update_option( 'regression_test_token_requests', 0 );
		update_option( 'siteimprove_api_key', 'fixture-key-not-a-credential' );
		update_option( 'siteimprove_api_username', '' );
		update_option( 'siteimprove_prepublish_allowed', 'disallowed' === $mode ? 0 : 1 );
		update_option( 'siteimprove_prepublish_enabled', 'disabled' === $mode ? 0 : 1 );
		if ( 'no-key' === $mode ) { update_option( 'siteimprove_api_key', '' ); }
		update_option( 'siteimprove_disable_new_version', 'legacy' === $mode ? 0 : 1 );
		if ( 'fresh' === $mode ) { delete_option( 'siteimprove_disable_new_version' ); }
		update_option( 'siteimprove_overlayjs_file', '' );
		update_option( 'siteimprove_public_url', 'https://delivery.example.test/site-' . $blog_id . '/' );
		update_option( 'siteimprove_ignore_path_segments', 'mapping' === $mode ? ' content-root, regression-subsite ' : '' );
		update_option( 'show_on_front', 'posts' );
		update_option( 'page_on_front', 0 );
		update_option( 'permalink_structure', '/%postname%/' );
		// Fixture creation emits publish hooks. Start with an empty queue so setup
		// does not exercise the unrelated legacy false-to-array conversion path.
		set_transient( 'siteimprove_url_' . get_current_user_id(), array(), 900 );
		$ids = get_option( 'regression_test_ids' );
		if ( ! $ids ) {
			$ids = array();
			$ids['parent'] = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Content root', 'post_name' => 'content-root' ) );
			foreach ( array( 'published' => 'publish', 'draft' => 'draft' ) as $name => $status ) {
				$ids[ $name ] = wp_insert_post( array(
					'post_type' => 'page', 'post_status' => $status, 'post_title' => 'Regression ' . $name,
					'post_name' => $name, 'post_parent' => $ids['parent'], 'post_author' => $users['editor'],
					'post_content' => '<p id="regression-content">REGRESSION ' . strtoupper( $name ) . ' SITE ' . $blog_id . '</p><p><strong><em>Example town</em></strong><br>Example country</p>',
				) );
			}
			update_option( 'regression_test_ids', $ids );
		}
		if ( empty( $ids['similar'] ) ) {
			$ids['similar'] = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Similar segment', 'post_name' => 'content-root-guide', 'post_parent' => $ids['parent'] ) );
			update_option( 'regression_test_ids', $ids );
		}
		if ( 'home' === $mode ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $ids['published'] );
		}
		flush_rewrite_rules( false );
		foreach ( array_merge( array( get_current_user_id() ), array_values( $users ) ) as $id ) {
			delete_transient( 'siteimprove_url_' . $id );
		}
		$sites[] = array(
			'id' => $blog_id, 'home' => home_url( '/' ), 'public' => get_permalink( $ids['published'] ),
			'preview' => get_preview_post_link( $ids['published'] ), 'draft' => get_preview_post_link( $ids['draft'] ),
			'similar' => get_permalink( $ids['similar'] ),
			'edit' => admin_url( 'post.php?post=' . $ids['published'] . '&action=edit' ),
			'settings' => admin_url( 'options-general.php?page=siteimprove' ),
			'token' => get_option( 'siteimprove_token' ),
			'network_user_is_member' => is_user_member_of_blog( $users['network_admin'], $blog_id ),
		);
		restore_current_blog();
	}
	$plugin = get_plugin_data( WP_PLUGIN_DIR . '/siteimprove/siteimprove.php', false, false );
	wp_send_json( array( 'sites' => $sites, 'wordpress' => get_bloginfo( 'version' ), 'php' => PHP_VERSION, 'plugin' => $plugin['Version'], 'multisite' => is_multisite() ) );
} );
