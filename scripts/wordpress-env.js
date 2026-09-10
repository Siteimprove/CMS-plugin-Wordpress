const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageRoot = path.dirname(require.resolve('@wordpress/env/package.json'));
const child = spawn(process.execPath, [path.join(packageRoot, 'bin/wp-env'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, WP_ENV_HOME: path.join(root, '.wp-env-cache') },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
