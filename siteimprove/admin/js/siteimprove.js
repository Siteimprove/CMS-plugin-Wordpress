/**
 * @file
 * Contains the Siteimprove Plugin methods.
 */
(function ($) {
    'use strict';

    var siteimprove = {
        input: function (url, token) {
            this.url = url;
            this.token = token;
            this.method = 'input';
            this.common();
        },
        domain: function (url, token) {
            this.url = url;
            this.token = token;
            this.method = 'domain';
            this.common();
        },
        recheck: function (url, token) {
            this.url = url;
            this.token = token;
            this.method = 'recheck';
            this.common();
        },
        recrawl: function (url, token) {
            this.url = url;
            this.token = token;
            this.method = 'recrawl';
            this.common();
        },
        contentcheck: function(domContent, url, token) {
            this.url = url;
            this.token = token;
            this.domContent = domContent;
            this.method = 'contentcheck';
            this.common();
        },
        common: function () {
            var _si = window._si || [];
            if (this.method == 'contentcheck-flat-dom' || this.method == 'contentcheck') {
                _si.push([this.method, this.domContent, this.url, this.token]);
            } else {
                _si.push([this.method, this.url, this.token]);
            }
        },
        events: {
            recheck: function() {
                var button = '<input type="button" class="siteimprove_ui recheck-button button button-large" value="' + siteimprove_recheck_button.txt + '" />';
                if ($('#publishing-action').length > 0) {
                    $('<div class="clear"></div><div class="siteimprove_ui recheck-button-wrapper">' + button + '</div>').insertAfter('#publishing-action');
                }
                else if ($('.edit-tag-actions').length > 0) {
                    // Insert button for taxonomies.
                    $(button).appendTo('.edit-tag-actions');
                }
                else {
                    // Insert button for taxonomies (old versions).
                    $(button).insertAfter('#submit');
                }

                $('.recheck-button').click(function(){
                    siteimprove.recheck(siteimprove_recheck_button.url, siteimprove_recheck_button.token);
                    $(this).attr('disabled', true);
                    return false;
                });
            }
        }
    };

    $(function () {

        // If exist siteimprove_recheck, call recheck Siteimprove method.
        if (typeof siteimprove_recheck !== 'undefined') {
            siteimprove.recheck(siteimprove_recheck.url, siteimprove_recheck.token);
        }

        // If exist siteimprove_input, call input Siteimprove method.
        if (typeof siteimprove_input !== 'undefined') {
            siteimprove.input(siteimprove_input.url, siteimprove_input.token);
        }

        // If exist siteimprove_domain, call domain Siteimprove method.
        if (typeof siteimprove_domain !== 'undefined') {
            siteimprove.domain(siteimprove_domain.url, siteimprove_domain.token);
        }

        // If exist siteimprove_recrawl, call recrawl Siteimprove method.
        if (typeof siteimprove_recrawl !== 'undefined') {
            siteimprove.recrawl(siteimprove_recrawl.url, siteimprove_recrawl.token);
        }

        // If exist siteimprove_recheck_button, create recheck button.
        if (typeof siteimprove_recheck_button !== 'undefined') {
            siteimprove.events.recheck();
        }

        $('.siteimprove-trigger-contentcheck').find('a').on('click', function(evt) {
            evt.preventDefault();
            if (typeof siteimprove_input.url !== 'undefined') {
                var url = siteimprove_input.url;
            } else {
                var url = window.location.href;
            }
            siteimprove.contentcheck($('html')[0].outerHTML, url, siteimprove_input.token);
        });

    });

})(jQuery);
