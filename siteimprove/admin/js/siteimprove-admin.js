/**
 * @file
 * Contains the Siteimprove Plugin settings form methods.
 */
(function ($) {
	'use strict';

	window.siteimprove_check_if_activated = function() {
		$.post(
			ajaxurl,
			{
				'action': 'siteimprove_check_prepublish_activation'
			},
			function (response) {
				if (response.result === false) {
					if ('undefined' === typeof window.activation_poll_handle) {
						console.log( 'creating poll' );
						window.activation_poll_handle = setInterval( siteimprove_check_if_activated, 2000 );
					}
				} else {
					$( '.siteimprove_prepublish_activation_messages' ).html( '<p>' + siteimprove_plugin_text.prepublish_feature_ready + '</p>' );
					clearInterval( window.activation_poll_handle );
				}
			}
		);
	}

	$(
		function () {

			// Ajax for request new token.
			$( '#siteimprove_token_request' ).on(
				'click',
				function () {
					$( this ).prop( 'disabled', true );
					$( this ).parent().find( '.siteimprove_admin_spinner' ).remove();
					$( this ).parent().append( '<span class="siteimprove_admin_spinner is-active no-float"></span>' );
					$.post(
						ajaxurl,
						{
							'action': 'siteimprove_request_token'
						},
						function (response) {
							var el = $( '#siteimprove_token_request' );
							el.parent().find( '.siteimprove_admin_spinner' ).remove();
							el.prop( 'disabled', false );
							$( '#siteimprove_token_field' ).val( response );
						}
					);
				}
			);

			// Ajax to enable contentcheck feature (prepublish).
			$( '#siteimprove_enable_prepublish' ).on(
				'click',
				function (event) {
					event.preventDefault();
					$( '.siteimprove_prepublish_activation_messages' ).html( '<p>' + siteimprove_plugin_text.loading + '</p>' );
					$.post(
						ajaxurl,
						{
							'action': 'siteimprove_prepublish_activation'
						},
						function (response) {
							console.log( response.result );
							if (response.result === true) {
								$( '.siteimprove_prepublish_activation_messages' ).html( '<p>' + siteimprove_plugin_text.prepublish_activate_running + '</p>' );
								siteimprove_check_if_activated();
							} else {
								$( '.siteimprove_prepublish_activation_messages' ).html( '<p>' + siteimprove_plugin_text.error + '</p>' );
							}
						}
					);
				}
			);

		}
	);

})( jQuery );
