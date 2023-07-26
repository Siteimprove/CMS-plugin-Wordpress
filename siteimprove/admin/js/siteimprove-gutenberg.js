var registerPlugin = wp.plugins.registerPlugin;
var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
var Button = wp.components.Button;
var SVG = wp.components.SVG;
var Path = wp.components.Path;

var createElement = wp.element.createElement;
var useState = wp.element.useState;

var svgIcon = createElement(SVG, { xmlns:"http://www.w3.org/2000/svg", height:"24px", width:"24px", viewBox:"0 0 24 24", focusable:"false", 'aria-hidden':"true", fill:"currentColor" },
    createElement(Path, { fill:"#141155", d:"M12.015625.113281C5.433594.113281.113281 5.433594.113281 12.015625c0 6.578125 5.320313 11.886719 11.902344 11.886719 6.578125 0 11.886719-5.324219 11.886719-11.886719 0-6.566406-5.324219-11.902344-11.886719-11.902344Zm0 0" }),
    createElement(Path, { fill:"#fff", d:"m6.097656 14.796875 1.695313-1.003906c.367187.945312 1.074219 1.539062 2.328125 1.539062 1.257812 0 1.625-.507812 1.625-1.074219 0-.746093-.679688-1.042968-2.1875-1.480468-1.539063-.4375-3.050782-1.074219-3.050782-3.007813 0-1.933593 1.609376-2.992187 3.332032-2.992187s2.9375.847656 3.613281 2.257812l-1.664063.960938c-.367187-.777344-.917968-1.300782-1.949218-1.300782-.832032 0-1.328125.4375-1.328125 1.019532 0 .621094.382812.945312 1.921875 1.410156 1.609375.523438 3.316406 1.058594 3.316406 3.121094 0 1.890625-1.523438 3.046875-3.671875 3.046875-2.058594.015625-3.441406-.972657-3.980469-2.496094m8.667969-6.917969c0-.621094.507813-1.160156 1.144531-1.160156.636719 0 1.15625.539062 1.15625 1.160156 0 .621094-.507812 1.140625-1.15625 1.140625-.648437 0-1.144531-.519531-1.144531-1.140625m.214844 1.988282h1.863281v7.230468h-1.863281Zm0 0"})
);

var RecheckButton = function () {
    var [isClicked, setClicked] = useState(false);

    return createElement(Button, {
        isPrimary: true,
        disabled: isClicked,
        style: {
            width: '100%',
            textAlign: 'center',
            display: 'inline-block'
        },
        onClick: function () {
            setClicked(true);
            if (typeof window.siteimprove.recheck !== "undefined") {
                window.siteimprove.recheck(
                    siteimprove_gutenberg_recheck.url, 
                    siteimprove_gutenberg_recheck.token, 
                    function() { 
                        setClicked(false) 
                    }
                );
            } else {
                console.error("Siteimprove has not been loaded");
            }
        } 
    }, siteimprove_gutenberg_recheck.text);
};

registerPlugin('siteimprove-panel-settings', {
    render: function () {
        return createElement(
            PluginDocumentSettingPanel,
            {
                name: 'siteimprove-panel',                
                title: createElement('div', {style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }}, svgIcon, createElement('span', {style: { marginLeft: '5px' }}, 'Siteimprove')),
                className: 'siteimprove-panel',
            },
            createElement(RecheckButton)
        );
    },
});
