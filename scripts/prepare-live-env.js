const fs = require('node:fs');
// Contains paths and flags only; secret values are supplied to the runner later.
fs.writeFileSync('.wp-env.override.json', JSON.stringify({
  plugins:['./.plugin-under-test/siteimprove'],
  config:{ WP_DEBUG:false, WP_DEBUG_LOG:false, WP_DEBUG_DISPLAY:false,
    SITEIMPROVE_TEST_ENVIRONMENT:false, SITEIMPROVE_TEST_MOCK_SERVICE:false,
    SITEIMPROVE_LIVE_TEST_ENVIRONMENT:true },
  mappings:{'wp-content/mu-plugins':'./tests/live/support'},
}, null, 2));
