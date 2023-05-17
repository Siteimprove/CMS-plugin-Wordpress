/**
 * @file
 * Contains the Siteimprove Plugin methods.
 */
(function ($) {
  "use strict";

  const getDom = async function (url) {
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
    $(".si-overlay").remove();
    return documentReturned;
  };

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
    contentcheck: function(domReference, url, token, callback) {
      this.url = url;
      this.token = token;
      this.domReference = domReference;
      this.method = "contentcheck";
      this.callback = callback;
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
      if (this.method == "contentcheck-flat-dom" || this.method == "contentcheck") {
        _si.push([
          this.method,
          this.domReference,
          this.url,
          this.token,
          this.callback,
        ]);
        return;
      }

      var stack = [];
      var usedSelectors = [];

      // Function to create an overlay at a specific position
      function createOverlay(left, top, width, height, id) {
        var overlay = document.createElement('div');
        overlay.id = 'overlay-' + id;
        overlay.className = 'overlay';
        overlay.style.left = left + 'px';
        overlay.style.top = top + 'px';
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        document.body.appendChild(overlay);
        return overlay;
      }

      function switchToTextEditor() {
        if (typeof tinyMCE !== 'undefined') {
          var editor = tinyMCE.activeEditor;
          if (editor && !editor.isHidden()) {
            switchEditors.go(editor.id, 'html');
          }
        }
      }

      // Function to highlight all instances of a tag in a textarea
      function highlightTagInTextarea(textarea, tag, id) {
        // Get the textarea's position and line height
        var rect = textarea.getBoundingClientRect();
        var lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);

        // Split the textarea's content into lines
        var lines = textarea.value.split('\n');

        // Iterate over each line
        for (var i = 0; i < lines.length; i++) {
            // Find the start tag in this line
            var tagStartIndex = lines[i].indexOf('<' + tag + '>');
            if (tagStartIndex !== -1) {
                var startTop = rect.top + textarea.clientTop + i * lineHeight - window.pageYOffset;
                // Find the end tag in the following lines
                for (var j = i; j < lines.length; j++) {
                    var tagEndIndex = lines[j].indexOf('</' + tag + '>') + tag.length + 3;
                    if (tagEndIndex !== -1) {
                        // Calculate the tag's position and size
                        var left = rect.left + textarea.clientLeft + tagStartIndex * lineHeight;
                        var top = startTop;
                        var width = (tagEndIndex - tagStartIndex) * lineHeight;
                        var height = (j - i + 1) * lineHeight;

                        // Create an overlay at this position
                        createOverlay(left, top, width, height, id);
                        break;
                    }
                }
            }
        }
      }

      function undo() {
        var textarea = document.getElementById('content');
        if (stack.length > 0) {
            // Remove the last state from the stack and set it as the textarea value
            var item = stack.pop();
            usedSelectors.pop();
            textarea.value = item.content;

            var overlay = document.getElementById("overlay-" + item.id);
            overlay.parentNode.removeChild(overlay);
        }
        if (stack.length === 0) {
          // Get the siteimprove-notice element
          var notice = document.getElementById('siteimprove-notice');
  
          // If the element exists, remove it
          if (notice) {
            notice.parentNode.removeChild(notice);
          }
        }
      }

      var suggestionId = 0;

      _si.push(['onSuggestion', function(suggestionInfo) {
        // Switch from Visual to Text Editor view
        switchToTextEditor();

        // TODO: Find a better way to figure out when the edit mode content starts
        var selector = suggestionInfo.locationSelector.replace("#document > body > div > main > div:nth-child(2) > div > ", "");
        var suggestedHtml = suggestionInfo.suggestedHtml;
      
        // Get the textarea element
        var textarea = document.getElementById('content');

        // Get the current content from the textarea
        var currentContent = textarea.value;

        if(!usedSelectors.includes(suggestionInfo.locationSelector)) {
          // Scroll to top for overlays to work
          window.scroll(0, 0);
          // Push the current content onto the stack
          stack.push({ content: currentContent, id: suggestionId });
        
          // Create a regular expression to match e.g. table tag
          var regex = new RegExp('<' + selector + '[^>]*>[\\s\\S]*?</' + selector + '>', 'i');
        
          // Replace the table tag with the new HTML content
          var updatedContent = currentContent.replace(regex, suggestedHtml);
        
          // Update the value of the textarea with the updated content
          textarea.value = updatedContent;

          // Push the selector to the usedSelectors array
          usedSelectors.push(suggestionInfo.locationSelector);

          if($('#siteimprove-notice').length === 0) {
              // Add warning box
              var infoBox = `
              <div id="siteimprove-notice" class="notice notice-warning" style="display: block;">
                <p class="siteimprove-notice" style="display: flex;align-items: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true" fill="currentColor" width="20px" height="20px"><path fill="#141155" d="M12.015625.113281C5.433594.113281.113281 5.433594.113281 12.015625c0 6.578125 5.320313 11.886719 11.902344 11.886719 6.578125 0 11.886719-5.324219 11.886719-11.886719 0-6.566406-5.324219-11.902344-11.886719-11.902344Zm0 0"></path><path fill="#fff" d="m6.097656 14.796875 1.695313-1.003906c.367187.945312 1.074219 1.539062 2.328125 1.539062 1.257812 0 1.625-.507812 1.625-1.074219 0-.746093-.679688-1.042968-2.1875-1.480468-1.539063-.4375-3.050782-1.074219-3.050782-3.007813 0-1.933593 1.609376-2.992187 3.332032-2.992187s2.9375.847656 3.613281 2.257812l-1.664063.960938c-.367187-.777344-.917968-1.300782-1.949218-1.300782-.832032 0-1.328125.4375-1.328125 1.019532 0 .621094.382812.945312 1.921875 1.410156 1.609375.523438 3.316406 1.058594 3.316406 3.121094 0 1.890625-1.523438 3.046875-3.671875 3.046875-2.058594.015625-3.441406-.972657-3.980469-2.496094m8.667969-6.917969c0-.621094.507813-1.160156 1.144531-1.160156.636719 0 1.15625.539062 1.15625 1.160156 0 .621094-.507812 1.140625-1.15625 1.140625-.648437 0-1.144531-.519531-1.144531-1.140625m.214844 1.988282h1.863281v7.230468h-1.863281Zm0 0"></path></svg> 
                  <strong style="margin-left: 5px;">Notification</strong>
                </p>
                <p class="help">
                  Siteimprove has applied suggestion(s) to your content. If you wish to undo these changes, you can press the button below
                </p>
                <p>
                  <button id="siteimprove-suggestion-undo" type="button" class="button">Undo the applied suggestion</button>
                </p>
              </div>
              `;
            $(infoBox).insertAfter('.wp-header-end');
          }
          var undoButton = document.getElementById('siteimprove-suggestion-undo');  
          var removeHighlightsButton = document.getElementById('siteimprove-suggestion-remove-highlight');
          // Add overlay
          highlightTagInTextarea(textarea, selector, suggestionId);

          // Hide overlays after 3 seconds
          setTimeout(() => {
            var overlays = document.querySelector(".overlay");
            if(overlays) {
              overlays.style.opacity = "0";
            }
          }, 5000);
          suggestionId++;

          undoButton.addEventListener('click', undo);
          removeHighlightsButton.addEventListener('click', removeHighlights);
        }
      }]);
                

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
        // _si.push(['registerPrepublishCallback', getDom(url), this.token]);
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

      var button = document.getElementById('post-preview');
      if(button) {

      var href = button.getAttribute('href');
      result.url = href;
      }

      if (typeof siteimprove_input !== "undefined") {
        if (typeof siteimprove_input.url !== "undefined") {
          // result.url = siteimprove_input.url;
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
      .on("click", async function (evt) {
        var si_prepublish_data = siGetCurrentUrlAndToken();
        evt.preventDefault();
        $("body").append('<div class="si-overlay"></div>');
        var dom = await getDom(si_prepublish_data.url);
        siteimprove.contentcheck(
          dom.documentElement.innerHTML,
          si_prepublish_data.url,
          si_prepublish_data.token,
          function () {
            $(".si-overlay").remove();
          }
        );
      });
  });
})(jQuery);