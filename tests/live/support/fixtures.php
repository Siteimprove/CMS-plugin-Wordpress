<?php
/** Fixtures for the disposable live-test WordPress installation only. */
if ( ! defined( 'SITEIMPROVE_LIVE_TEST_ENVIRONMENT' ) || ! SITEIMPROVE_LIVE_TEST_ENVIRONMENT ) {
	return;
}
add_action( 'init', function () { remove_action( 'init', 'playground_auto_login', 1 ); }, 0 );

add_action( 'admin_menu', function () {
	add_management_page( 'Live test fixture', 'Live test fixture', 'manage_options', 'siteimprove-live-fixture', function () {
		if ( ! current_user_can( 'manage_options' ) ) { return; }
		if ( 'POST' === $_SERVER['REQUEST_METHOD'] ) {
			check_admin_referer( 'siteimprove-live-fixture' );
			$path = isset( $_POST['fixture_path'] ) ? wp_unslash( $_POST['fixture_path'] ) : '';
			$query = isset( $_POST['fixture_query'] ) ? wp_unslash( $_POST['fixture_query'] ) : '';
			$marker = isset( $_POST['fixture_marker'] ) ? sanitize_text_field( wp_unslash( $_POST['fixture_marker'] ) ) : '';
			if ( ! preg_match( '/^\/(?!\/)[^?#\r\n]*$/', $path ) || ! preg_match( '/^SI-LIVE-[a-f0-9-]+$/', $marker ) ) {
				wp_die( 'Invalid fixture configuration.' );
			}
			$id = wp_insert_post( array(
				'post_type' => 'page', 'post_status' => 'publish',
				'post_title' => 'Live test published control', 'post_author' => get_current_user_id(),
				'post_content' => '<p>SI-LIVE-PUBLISHED-CONTROL</p>',
			), true );
			if ( is_wp_error( $id ) || ! $id ) { wp_die( 'Fixture creation failed.' ); }
			update_option( 'siteimprove_live_fixture', array( 'id' => $id, 'path' => $path, 'query' => $query ) );
			require_once ABSPATH . 'wp-admin/includes/post.php';
			$revision = wp_create_post_autosave( array(
				'post_ID' => $id, 'post_type' => 'page', 'post_title' => 'Live test unpublished preview',
				'post_content' => '<p>' . esc_html( $marker ) . '</p><p id="si-live-style" style="color: rgb(20, 40, 60)">Styled draft marker</p>',
				'post_excerpt' => '',
			) );
			if ( is_wp_error( $revision ) || ! $revision ) { wp_die( 'Autosave creation failed.' ); }
			$preview = get_preview_post_link( $id, array( 'preview_id' => $id, 'preview_nonce' => wp_create_nonce( 'post_preview_' . $id ) ) );
			echo '<a id="live-preview" href="' . esc_url( $preview ) . '">Open the test preview</a>';
			echo '<a id="live-published" href="' . esc_url( get_permalink( $id ) ) . '">Open the published control</a>';
		}
		echo '<form method="post">';
		wp_nonce_field( 'siteimprove-live-fixture' );
		echo '<input name="fixture_path"><input name="fixture_query"><input name="fixture_marker">';
		echo '<button type="submit">Create live test fixture</button></form>';
	} );
} );

// Map the local fixture's permalink to the known crawled page's path. The plugin
// still performs its normal Public URL transformation; no SDK request is rewritten.
add_filter( 'page_link', function ( $link, $id ) {
	$fixture = get_option( 'siteimprove_live_fixture' );
	if ( ! $fixture || (int) $id !== (int) $fixture['id'] ) { return $link; }
	return home_url( $fixture['path'] ) . ( $fixture['query'] ? '?' . $fixture['query'] : '' );
}, 10, 2 );
add_filter( 'request', function ( $query ) {
	$fixture = get_option( 'siteimprove_live_fixture' );
	$path = wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH );
	if ( $fixture && $path === $fixture['path'] ) {
		$query = array( 'page_id' => $fixture['id'] );
		if ( isset( $_GET['preview'] ) ) { $query['preview'] = true; }
	}
	return $query;
} );
add_filter( 'redirect_canonical', function ( $url ) {
	$fixture = get_option( 'siteimprove_live_fixture' );
	return $fixture && get_queried_object_id() === (int) $fixture['id'] ? false : $url;
} );
add_filter( 'template_include', function ( $template ) {
	$fixture = get_option( 'siteimprove_live_fixture' );
	if ( $fixture && get_queried_object_id() === (int) $fixture['id'] ) {
		remove_action( 'wp_head', '_wp_render_title_tag', 1 );
		remove_action( 'wp_head', '_block_template_render_title_tag', 1 );
		return __DIR__ . '/templates/preview.php';
	}
	return $template;
} );
