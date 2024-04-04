/**
 * @file
 * Contains the Siteimprove Plugin methods.
 */
(function ($) {
  "use strict";

  const getDom = async function (url, nonce) {
    const iframeContainer = document.createElement("div");
    iframeContainer.setAttribute("id", "div_iframe");
    document.body.appendChild(iframeContainer);
    const separator = url.includes("?") ? "&" : "?";
    iframeContainer.innerHTML = `<iframe id='domIframe' src=${url}${separator}si_preview_nonce=${nonce} style='height:100vh; width:100%'></iframe>`;
    const iframe = document.getElementById("domIframe");
    const promise = new Promise(function (resolve, reject) {
      iframe.addEventListener(
        "load",
        () => {
          // In order to preserve the DOM node hierarchy for highlights, we have chosen to empty the #wp-admin-bar from the new DOM instead of outright removing it.
          var adminBar = iframe.contentWindow.document.getElementById('wpadminbar');
          if (adminBar) {
            adminBar.innerHTML = '<div></div>';
            adminBar.id = 'wpadminbar-disabled';
          }
          const cleanDom = iframe.contentWindow.document.cloneNode(true);
          document.body.removeChild(iframeContainer);
          resolve(cleanDom);
        },
        { once: true }
      );
    });
  
    const documentReturned = await promise;
    $(".si-overlay").remove();
    return documentReturned;
  };  

  window.siteimprove = {
    input: function (url, token, version, is_content_page, nonce) {
      this.url = url;
      this.token = token;
      this.method = "input";
      this.version = version;
      this.is_content_page = is_content_page;
      this.nonce = nonce;
      this.common(url);
    },
    domain: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "domain";
      this.common(url);
    },
    clear: function (callback, token) {
      this.callback = callback;
      this.token = token;
      this.method = "clear";
      this.common();
    },
    recheck: function (url, token, callback) {
      this.callback = callback;
      this.url = url;
      this.token = token;
      this.method = "recheck";
      this.common(url);
    },
    recrawl: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "recrawl";
      this.common(url);
    },
    contentcheck_flatdom: function (domReference, url, token, callback) {
      this.url = url;
      this.token = token;
      this.domReference = domReference;
      this.method = "contentcheck-flat-dom";
      this.callback = callback;
      this.common(url);
    },
    common: function (url) {
      const _si = window._si || [];
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

      if (this.method == "recheck") {
        _si.push([
          this.method,
          this.url,
          this.token,
          this.callback
        ]);
        return;
      }

      _si.push(['onHighlight', function(highlightInfo) {
          // Function to wrap a specific text node within an element with a new element
          function wrapTextNode(element, from, length, wrapTag) {
              $(element).contents().each(function() {
                  // 3 = text node
                  if (this.nodeType === 3 && this.nodeValue) {
                      if (from < this.nodeValue.length) {
                          var before = this.nodeValue.substr(0, from);
                          var middle = this.nodeValue.substr(from, length);
                          var after = this.nodeValue.substr(from + length);
                          $(this).before(before).before(wrapTag.clone().text(middle)).before(after).remove();
                          // Break out of the each loop
                          return false;
                      } else {
                          from -= this.nodeValue.length;
                      }
                  }
              });
          }

          function resetHighlights() {
            $(".si-highlight").each(function() {
              // This takes the element of the .si-highlight inner HTML and replaces the element with it
              $(this).replaceWith($(this).html());
            });
            // We handle body tag highlight specificially, so we also need to remove it specificially from HTML element
            if($("body").hasClass("si-full-highlight")) {
              $("body").removeClass("si-full-highlight");
            }
          }
          
          function applyHighlights() {
            var wrapTag = $("<span class='si-highlight'></span>");
            // Apply new highlights based on the information received
            $.each(highlightInfo.highlights, function(index, highlight) {
                var $element = $(highlight.selector);
                if (highlight.offset) {
                    wrapTextNode($element[0], highlight.offset.start, highlight.offset.length, wrapTag);
                } else {
                    if ($element.is('body')) {
                      // Add the class to the HTML tag instead, so we can have full height of the highlight
                      $element.addClass("si-full-highlight");
                    }
                    else if ($element.is('img') || $element.children().is("img")) {
                      $element.wrap("<div class='si-highlight' style='padding: 5px;'></div>");
                    } else {
                      $element.wrapInner("<span class='si-highlight'></span>");
                    }
                }
            });
          }

          resetHighlights();
          applyHighlights();
          // Scroll to the target element
          $([document.documentElement, document.body]).stop().animate({
              scrollTop: $(".si-highlight").offset().top - $("#wpadminbar").height()
          }, 1500);
      }]);


      const getDomCallback = function () {
        return getDom(url);
      };
    
      
      // 0 = overlay-v1.js
      // 1 = overlay-latest.js
      if (this.version == 1 && this.is_content_page) {
        _si.push(['registerPrepublishCallback', getDomCallback, this.token]);
      }


      _si.push([this.method, this.url, this.token]);

      // Calling the "clear" method to avoid smallbox showing a "Page not found" message when inside wp-admin panel
      // Do not do this for domain, so we can still see site-view of the plugin
      if (this.version == 0 && this.method !== "domain") {
        const pattern = /(?:\/wp-admin\/{1})[\D-\d]+.php/;
        if (this.url && this.url.match(pattern)) {
          setTimeout(() => {
            _si.push(['clear', null, this.token]); 
          }, 500);
        }
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
          $(this).attr("disabled", true);
          siteimprove.recheck(
            siteimprove_recheck_button.url,
            siteimprove_recheck_button.token,
            function () {
              $(".recheck-button").attr("disabled", false);
            }
          );
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
      siteimprove.input(siteimprove_input.url, siteimprove_input.token, siteimprove_input.version, siteimprove_input.is_content_page, siteimprove_input.nonce);
    }

    // If exist siteimprove_domain, call domain Siteimprove method.
    if (typeof siteimprove_domain !== "undefined") {
      // It will call domain only for v1
      if( "0" === siteimprove_domain.version ){
        siteimprove.domain(siteimprove_domain.url, siteimprove_domain.token);
      } else {
        siteimprove.clear(null, siteimprove_domain.token);
      }
    }

    // If exist siteimprove_recrawl, call recrawl Siteimprove method.
    if (typeof siteimprove_recrawl !== "undefined") {
      //It will call domain only for v1
      if( "0" === siteimprove_recrawl.version ){
        siteimprove.recrawl(siteimprove_recrawl.url, siteimprove_recrawl.token);
      }
    }

    // If exist siteimprove_recheck_button, create recheck button.
    if (typeof siteimprove_recheck_button !== "undefined") {
      siteimprove.events.recheck();
    }

    window.siGetCurrentUrlAndToken = function () {
      var result = {
        url: window.location.href,
        token: "",
        nonce: "",
      };

      if (typeof siteimprove_input !== "undefined") {
        if (typeof siteimprove_input.url !== "undefined") {
          result.url = siteimprove_input.url;
        }
        result.token = siteimprove_input.token;
        result.nonce = siteimprove_input.nonce;
      }

      if (typeof siteimprove_domain !== "undefined") {
        if (typeof siteimprove_domain.url !== "undefined") {
          result.url = siteimprove_domain.url;
        }
        result.token = siteimprove_domain.token;
        result.nonce = siteimprove_domain.nonce;
      }
      return result;
    };

    $(".siteimprove-trigger-contentcheck")
      .find("a")
      .on("click", async function (evt) {
        var si_prepublish_data = siGetCurrentUrlAndToken();
        evt.preventDefault();
        $("body").append('<div class="si-overlay"></div>');
        var dom = await getDom(si_prepublish_data.url, si_prepublish_data.nonce);
        siteimprove.contentcheck_flatdom(
          dom,
          si_prepublish_data.url,
          si_prepublish_data.token,
          function () {
            $(".si-overlay").remove();
          }
        );
      });
  });
})(jQuery);