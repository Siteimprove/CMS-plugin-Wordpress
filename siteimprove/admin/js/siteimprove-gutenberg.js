var registerPlugin = wp.plugins.registerPlugin;
var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
var Button = wp.components.Button;
var SVG = wp.components.SVG;
var Path = wp.components.Path;

var createElement = wp.element.createElement;
var useState = wp.element.useState;

const svgIcon = React.createElement(
    'svg', 
    {
        version: '1.1', 
        xmlns: 'http://www.w3.org/2000/svg', 
        height: '20px', 
        width: '20px', 
        xmlnsXlink: 'http://www.w3.org/1999/xlink', 
        x: '0px', 
        y: '0px', 
        viewBox: '0 0 300 300', 
        style: { 'enableBackground': 'new 0 0 300 300' },
        xmlSpace: 'preserve',
    },
    React.createElement(
        'circle', 
        {
            fill: '#0D4CD3', 
            cx: '150', 
            cy: '150', 
            r: '150'
        }
    ),
    React.createElement(
        'g', 
        null,
        React.createElement(
            'path', 
            {
                fill: '#FFFFFF', 
                d: 'M167.9,135.3l-14.3-4.2c-6.5-2-11.6-3.8-15.4-5.4c-3.8-1.6-6.5-3.4-8.1-5.2c-1.6-1.8-2.4-4.1-2.4-6.9   c0-3.4,1.1-6.3,3.2-8.7c2.1-2.5,5.1-4.4,9-5.7c3.8-1.3,8.3-2,13.5-2c5.2,0,10.4,0.7,15.6,2c5.2,1.3,9.9,3.2,14.3,5.5   c4.4,2.3,8,5.1,11,8.2l19-28.1c-6.5-6.3-15.1-11.2-25.7-14.8c-10.7-3.6-22.2-5.5-34.6-5.5c-9,0-17.3,1.3-24.9,3.8   c-7.6,2.5-14.2,6.1-19.9,10.7c-5.6,4.6-10,10-13.1,16.2c-3.1,6.2-4.7,13-4.7,20.3c0,11.4,3.7,21.2,11.1,29.3   c7.4,8.1,19.6,14.5,36.5,19.2l14.1,4c9.9,2.7,16.7,5.4,20.3,8.3c3.6,2.9,5.5,6.4,5.5,10.7c0,5.2-2.5,9.1-7.6,11.8   c-5,2.7-11.6,4-19.6,4c-5.7,0-11.6-0.7-17.6-2.2c-6.1-1.4-11.7-3.5-17.1-6.2c-5.3-2.7-9.7-5.8-13.1-9.5l-18.3,29.1   c8.1,7,18.1,12.3,29.8,15.9c11.7,3.7,23.8,5.5,36.2,5.5c13.4,0,24.9-2.2,34.6-6.7s17.2-10.6,22.6-18.6c5.3-7.9,8-17.1,8-27.5   c0-11.9-3.8-21.5-11.3-29C196.8,146.4,184.7,140.2,167.9,135.3z'
            }
        )
    )
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
                console.error("Siteimprove Recheck: siteimprove.js has not been loaded");
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
