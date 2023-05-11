/**
 * @file
 * Contains the Siteimprove Plugin methods.
 */
(function ($) {
  "use strict";

  var siteimprove = {
    input: function (url, token, version, preview) {
      this.url = url;
      this.token = token;
      this.method = "input";
      this.version = version;
      this.preview = preview;
      this.common(url);
    },
    domain: function (url, token) {
      this.url = url;
      this.token = token;
      this.method = "domain";
      this.common(url);
    },
    recheck: function (url, token) {
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
    
      const getDomCallback = async function () {
        const newDiv = document.createElement("div");
        newDiv.setAttribute("id","div_iframe"); 
        document.body.appendChild(newDiv);
        //Opens an alternative version of this page without wp injected content such as the wp-admin bar and smallbox plugin itself as this is for the DOM we send to Siteimprove
        newDiv.innerHTML = "<iframe id='domIframe' src="+ url.concat("&si_preview=1") +" style='height:100vh; width:100%'></iframe>";

        const promise = new Promise(function (resolve, reject) {
          const iframe = document.getElementById("domIframe");
          iframe.addEventListener(
            "load",
            () => {
                const newDocument = iframe.contentWindow.document.cloneNode(true);
                document.body.removeChild(newDiv);
                resolve(newDocument);
            },
            { once: true }
          );
        });
      
        const documentReturned = await promise;
        return [
          documentReturned, 
          () => { 
            $(".si-overlay").remove();
          }
        ];
      };

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
        // Remove highlight tag wrapper
        $( ".si-highlight" ).contents().unwrap();
        // Create an span tag for every highlight
        $.each( highlightInfo.highlights, function( index, highlight ) {
          var $element = $(highlight.selector);
          var text = $element.text();
          
          if ( highlight.offset ) {
            var start = highlight.offset.start;
            var length = highlight.offset.length;
            
            var before = text.substr(0, start);
            var highlighted = text.substr(start, length);
            var after = text.substr(start + length);
            
            $element.html(before + "<span class='si-highlight'>" + highlighted + "</span>" + after);
          } else {
            //Dealing in a different way if the element or it's children came as an image.
            if( $element.is('img') || $( $element[0] ).children().is( "img" ) ){
              //Adding an inline padding was needed to put in evidence the div borders
              $( $element[0] ).wrap( "<div class='si-highlight' style='padding: 5px;'></div>" );
            }else{
              $element.html( "<span class='si-highlight'>" + text + "</span>" );
            }
          }
          
          //Scroll to the target element
          $([document.documentElement, document.body]).stop().animate({
            scrollTop: $(".si-highlight").offset().top - $("#wpadminbar").height()
          }, 1500);
        });
      }]);
      
      // 0 = overlay-v1.js
      // 1 = overlay-latest.js
      if(this.version == 1 && this.preview) {
        _si.push(['registerPrepublishCallback', getDomCallback, this.token]);
      }
      _si.push([this.method, this.url, this.token]);

      //Calling the "clear" method to avoid smallbox showing a "Page not found" message when inside wp-admin panel
      // Do not do this for domain, so we can still see site-view of the plugin
      if(this.method !== "domain") {
        const pattern = /(?:\/wp-admin\/{1})[\D-\d]+.php/;
        if (this.url.match(pattern)) {
          setTimeout(() => {
            _si.push(['clear']); 
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
      siteimprove.input(siteimprove_input.url, siteimprove_input.token, siteimprove_input.version, siteimprove_input.preview);
    }

    // If exist siteimprove_domain, call domain Siteimprove method.
    if (typeof siteimprove_domain !== "undefined") {
      // It will call domain only for v1
      if( "0" === siteimprove_domain.version ){
        siteimprove.domain(siteimprove_domain.url, siteimprove_domain.token);
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