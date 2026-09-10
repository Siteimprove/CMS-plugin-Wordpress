<?php
/**
 * Sample content for the disposable WordPress environment only.
 *
 * @package SiteimproveTests
 */

if ( ! defined( 'SITEIMPROVE_TEST_ENVIRONMENT' ) || ! SITEIMPROVE_TEST_ENVIRONMENT ) {
	return;
}

// wp-env enables Playground auto-login for convenience. Disable it here so
// anonymous preview requests exercise WordPress's normal access checks.
add_action(
	'init',
	function () {
		remove_action( 'init', 'playground_auto_login', 1 );
	},
	0
);

add_action(
	'init',
	function () {
		if ( get_option( 'siteimprove_test_fixture_ids' ) ) {
			return;
		}
		$author = get_user_by( 'login', 'admin' );
		if ( ! $author ) {
			return;
		}
		$published = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => 'Prepublish published control',
				'post_name'    => 'prepublish-published-control',
				'post_author'  => $author->ID,
				'post_content' => '<p>SITEIMPROVE PUBLISHED CONTROL</p>',
			),
			true
		);
		$draft = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'draft',
				'post_title'   => 'Prepublish draft fixture',
				'post_name'    => 'prepublish-draft-fixture',
				'post_author'  => $author->ID,
				'post_content' => '<p>SITEIMPROVE DRAFT ONLY MARKER</p><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">',
			),
			true
		);
		if ( ! is_wp_error( $published ) && ! is_wp_error( $draft ) ) {
			update_option( 'siteimprove_test_fixture_ids', array( 'published' => $published, 'draft' => $draft ) );
		}
	}
);

// Disposable integration-test controls. Nothing here is loaded outside wp-env.
add_filter( 'pre_http_request', function ( $response, $args, $url ) {
	if ( ! defined( 'SITEIMPROVE_TEST_MOCK_SERVICE' ) || ! SITEIMPROVE_TEST_MOCK_SERVICE ) {
		return $response;
	}
	return new WP_Error( 'siteimprove_test_network_blocked', 'External HTTP is disabled in the disposable test environment.' );
}, 10, 3 );

add_action( 'admin_menu', function () {
	add_management_page( 'Prepublish test fixtures', 'Prepublish test fixtures', 'manage_options', 'siteimprove-test-fixtures', function () {
		if ( ! defined( 'SITEIMPROVE_TEST_MOCK_SERVICE' ) || ! SITEIMPROVE_TEST_MOCK_SERVICE ) {
			wp_die( 'Fixture configuration requires mock service mode.' );
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$ids = get_option( 'siteimprove_test_fixture_ids' );
		if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
			check_admin_referer( 'siteimprove-test-configure' );
			$split = isset( $_POST['origin'] ) && 'split' === $_POST['origin'];
			update_option( 'siteimprove_public_url', $split ? 'https://delivery.example.test' : home_url() );
			update_option( 'siteimprove_token', 'local-test-token' );
			update_option( 'siteimprove_api_key', 'local-test-key-not-a-credential' );
			update_option( 'siteimprove_prepublish_allowed', 1 );
			update_option( 'siteimprove_prepublish_enabled', 1 );
			update_option( 'siteimprove_disable_new_version', isset( $_POST['entry'] ) && 'overlay' === $_POST['entry'] ? 1 : 0 );
			if ( empty( $ids['revision_control'] ) ) {
				$ids['revision_control'] = wp_insert_post( array(
					'post_type' => 'page', 'post_status' => 'publish',
					'post_title' => 'Prepublish revision control',
					'post_author' => get_current_user_id(),
					'post_content' => '<p>SITEIMPROVE VERSION A PUBLISHED</p>',
				), true );
				if ( is_wp_error( $ids['revision_control'] ) ) {
					wp_die( 'Could not create the revision control.' );
				}
				update_option( 'siteimprove_test_fixture_ids', $ids );
			}
			require_once ABSPATH . 'wp-admin/includes/post.php';
			$autosave = wp_create_post_autosave( array(
				'post_ID' => $ids['revision_control'], 'post_type' => 'page',
				'post_title' => 'Prepublish revision control',
				'post_content' => '<p>SITEIMPROVE VERSION B UNPUBLISHED</p>',
				'post_excerpt' => '',
			) );
			if ( is_wp_error( $autosave ) || ! $autosave ) {
				wp_die( 'Could not create the unpublished autosave.' );
			}
			echo '<p id="configured">Test configuration ready</p>';
		}
		echo '<form method="post">';
		wp_nonce_field( 'siteimprove-test-configure' );
		echo '<select name="origin"><option value="same">Same origin</option><option value="split">Separate public origin</option></select>';
		echo '<select name="entry"><option value="toolbar">Toolbar</option><option value="overlay">Overlay callback</option></select>';
		echo '<button type="submit">Prepare fixtures</button></form>';
		echo '<a id="draft-preview" href="' . esc_url( get_preview_post_link( $ids['draft'] ) ) . '">Draft preview</a>';
		if ( ! empty( $ids['revision_control'] ) ) {
			$preview = get_preview_post_link( $ids['revision_control'], array(
				'preview_id' => $ids['revision_control'],
				'preview_nonce' => wp_create_nonce( 'post_preview_' . $ids['revision_control'] ),
			) );
			echo '<a id="revision-preview" href="' . esc_url( $preview ) . '">Unpublished revision preview</a>';
			echo '<a id="revision-public" href="' . esc_url( get_permalink( $ids['revision_control'] ) ) . '">Published version</a>';
		}
	} );
} );

add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_preview() ) {
		return;
	}
	// A relative asset URL exposes incorrect resolution against the delivery host.
	wp_enqueue_style( 'siteimprove-test-style', '/wp-content/mu-plugins/prepublish-fixture.css', array(), '1' );
	wp_add_inline_style( 'siteimprove-test-style', '#siteimprove-style-fixture { background-color: rgb(240, 230, 220); }' );
} );
add_filter( 'the_content', function ( $content ) {
	if ( is_preview() ) {
		$content .= '<div id="siteimprove-style-fixture" style="border-top: 3px solid rgb(70, 80, 90)">STYLE CAPTURE MARKER</div>';
	}
	return $content;
} );
