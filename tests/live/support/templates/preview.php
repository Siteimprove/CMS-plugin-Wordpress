<?php
if ( ! defined( 'SITEIMPROVE_LIVE_TEST_ENVIRONMENT' ) || ! SITEIMPROVE_LIVE_TEST_ENVIRONMENT ) { return; }
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title><?php echo is_preview() ? '' : 'Live test published control'; ?></title>
<?php wp_head(); ?>
</head>
<body>
<?php wp_body_open(); ?>
<main><h1>Prepublish test page</h1><?php while ( have_posts() ) { the_post(); the_content(); } ?></main>
<?php wp_footer(); ?>
</body>
</html>
