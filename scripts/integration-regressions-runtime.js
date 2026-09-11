const path = require('node:path');
const packageRoot = path.dirname(require.resolve('@wordpress/env/package.json'));
const builder = require(path.join(packageRoot, 'lib/runtime/playground/blueprint-builder.js'));
const buildBlueprint = builder.buildBlueprint;

// @wordpress/env 11.15.0 passes the requested core ref to --wp but writes
// preferredVersions.wp = "latest" in its blueprint, which wins at install time.
// Keep both inputs aligned without editing the installed dependency. The tests
// assert the version reported by WordPress, not the CLI's startup banner.
builder.buildBlueprint = config => {
  const blueprint = buildBlueprint(config);
  const version = config.env.development.coreSource?.ref;
  if (!version) throw new Error('Regression tests require an explicit WordPress core ref.');
  blueprint.preferredVersions.wp = version;
  return blueprint;
};

require(path.join(packageRoot, 'bin/wp-env'));
