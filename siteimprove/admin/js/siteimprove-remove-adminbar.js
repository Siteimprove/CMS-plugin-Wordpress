window.onload = function() {
    window.stop();
    var adminBar = document.getElementById('wpadminbar');
    if (adminBar) {
        adminBar.innerHTML = '<div></div>';
        adminBar.id = 'wpadminbar-disabled';
    }
};
