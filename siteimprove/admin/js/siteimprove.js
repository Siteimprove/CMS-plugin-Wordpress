/**
 * @file
 * Contains the Siteimprove Plugin methods.
 */
(function ($) {
  "use strict";

  var siteimprove = {
    input: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "input";
      this.common(url);
    },
    domain: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "domain";
      this.common();
    },
    recheck: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "recheck";
      this.common();
    },
    recrawl: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "recrawl";
      this.common();
    },
    contentcheck_flatdom: function (domReference, url, token, callback) {
      this.url = url;
      this.token = token;
      this.domReference = domReference;
      this.method = "contentcheck-flat-dom";
      this.callback = callback;
      this.common();
    },
    common: function (url) {
      var _si = window._si || [];  

      var getDomCallback = async function () {
      	var pageWindow = window.open(
      		url,
      		"Page Preview",
      		"width=400,height=500"
      	);
      	var promise = new Promise(function (resolve, reject) {
      		pageWindow.addEventListener(
      			"load",
      			() => { resolve(pageWindow.document); },
      			{ once: true }
      		);
      	});
      
      	var document = await promise;
      	return [document, () => { pageWindow.close(); }];
      };

      _si.push(['registerPrepublishCallback', getDomCallback, this.token]);

      if (this.method == "contentcheck-flat-dom") {
        _si.push([
          this.method,
          this.domReference,
          this.url,
          this.token,
          this.callback,
        ]);
        return;
      }

      _si.push(['onHighlight', function(highlightInfo) { 
        /* 1. Reset highlight */
        jQuery(".si-highlight").removeClass("si-highlight");
        /* 2. Do highlight */
        highlightInfo.highlights.forEach((highlight) => {
          jQuery(highlight.selector).addClass("si-highlight");
        })
        /* TODO: Make the jQuery add a span tag that starts at X (where X is equal to start property in highlight) and ends after y (where y is equal to length property in highlight) */
      }]);

      //Adaptation carried out to comply with the CMS-plugin-v2 documentation
      if( this.method === "domain" ){
        _si.push(['input', this.url, this.token, function() { console.log('Inputted new javascript overlay file'); } ]); 
      } else {
        _si.push([this.method, this.url, this.token]);
      }

      //Calling the "clear" method to avoid smallbox showing a "Page not found" message when inside wp-admin panel
      const pattern = /(?:\/wp-admin\/{1})[\D-\d]+.php/;
      if (this.url.match(pattern)) {
        setTimeout(() => {
          _si.push(['clear', function() { console.log('Cleared'); }]); 
        }, 500);
      }
                 
    },
    events: {
      recheck: function () {
        var button =
          '<input type="button" class="siteimprove_ui recheck-button button button-large" value="' +
          siteimprove_recheck_button.txt +
          '" />';
        if ($("#publishing-action").length > 0) {
          $(
            '<div class="clear"></div><div class="siteimprove_ui recheck-button-wrapper">' +
              button +
              "</div>"
          ).insertAfter("#publishing-action");
        } else if ($(".edit-tag-actions").length > 0) {
          // Insert button for taxonomies.
          $(button).appendTo(".edit-tag-actions");
        } else {
          // Insert button for taxonomies (old versions).
          $(button).insertAfter("#submit");
        }

        $(".recheck-button").click(function () {
          siteimprove.recheck(
            siteimprove_recheck_button.url,
            siteimprove_recheck_button.token
          );
          $(this).attr("disabled", true);
          return false;
        });
      },
    },
  };

  $(function () {
    // If exist siteimprove_recheck, call recheck Siteimprove method.
    if (typeof siteimprove_recheck !== "undefined") {
      siteimprove.recheck(siteimprove_recheck.url, siteimprove_recheck.token);
    }

    // If exist siteimprove_input, call input Siteimprove method.
    if (typeof siteimprove_input !== "undefined") {
      siteimprove.input(siteimprove_input.url, siteimprove_input.token);
    }

    // If exist siteimprove_domain, call domain Siteimprove method.
    if (typeof siteimprove_domain !== "undefined") {
      siteimprove.domain(siteimprove_domain.url, siteimprove_domain.token);
    }

    // If exist siteimprove_recrawl, call recrawl Siteimprove method.
    if (typeof siteimprove_recrawl !== "undefined") {
      siteimprove.recrawl(siteimprove_recrawl.url, siteimprove_recrawl.token);
    }

    // If exist siteimprove_recheck_button, create recheck button.
    if (typeof siteimprove_recheck_button !== "undefined") {
      siteimprove.events.recheck();
    }

    window.siGetCurrentUrlAndToken = function () {
      var result = {
        url: window.location.href,
        token: "",
      };

      if (typeof siteimprove_input !== "undefined") {
        if (typeof siteimprove_input.url !== "undefined") {
          result.url = siteimprove_input.url;
        }
        result.token = siteimprove_input.token;
      }

      if (typeof siteimprove_domain !== "undefined") {
        if (typeof siteimprove_domain.url !== "undefined") {
          result.url = siteimprove_domain.url;
        }
        result.token = siteimprove_domain.token;
      }
      return result;
    };

    $(".siteimprove-trigger-contentcheck")
      .find("a")
      .on("click", function (evt) {
        var si_prepublish_data = siGetCurrentUrlAndToken();
        evt.preventDefault();
        $("body").append('<div class="si-overlay"></div>');
        siteimprove.contentcheck_flatdom(
          document,
          si_prepublish_data.url,
          si_prepublish_data.token,
          function () {
            $(".si-overlay").remove();
          }
        );
      });
  });
})(jQuery);