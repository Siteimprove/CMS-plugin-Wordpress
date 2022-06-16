/**
 * @file
 * Contains the Siteimprove Plugin settings form methods.
 */
(function ($) {
  'use strict';

  $(function () {

    // Ajax for request new token.
    jQuery('#siteimprove_token_request').on('click', function () {
      jQuery(this).prop('disabled', true);
      jQuery(this).parent().find('.siteimprove_admin_spinner').remove();
      jQuery(this).parent().append('<span class="siteimprove_admin_spinner is-active no-float"></span>');
      jQuery.post(
          ajaxurl,
          {
            'action': 'siteimprove_request_token'
          },
          function (response) {
            var el = jQuery('#siteimprove_token_request');
            el.parent().find('.siteimprove_admin_spinner').remove();
            el.prop('disabled', false);
            jQuery('#siteimprove_token_field').val(response);
          }
      );
    });
});

})(jQuery);
