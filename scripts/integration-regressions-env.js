const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');

// Keep integration regressions separate from the prepublish and live environments.
const root = path.resolve(__dirname, '..');
const cwd = path.join(root, '.integration-regressions-env');
const command = process.argv[2] || 'status';
async function main() {
  fs.mkdirSync(cwd, { recursive: true });
  if (command === 'start') {
    // wp-env can overwrite its PID file when another server owns the port.
    // Refuse that state before changing config or launching another process.
    await new Promise((resolve, reject) => {
      const socket = net.connect({ host: '127.0.0.1', port: 80 });
      socket.once('connect', () => {
        socket.destroy();
        reject(new Error('Port 80 is occupied. Stop the regression environment (or the other server) before starting.'));
      });
      socket.once('error', error => error.code === 'ECONNREFUSED' ? resolve() : reject(error));
      socket.setTimeout(2000, () => { socket.destroy(); reject(new Error('Could not check local port 80.')); });
    });
    const plugin = path.resolve(root, process.env.SITEIMPROVE_TEST_PLUGIN || 'siteimprove');
    if (path.basename(plugin) !== 'siteimprove' || !fs.existsSync(path.join(plugin, 'siteimprove.php'))) {
      throw new Error('SITEIMPROVE_TEST_PLUGIN must point to a siteimprove plugin directory.');
    }
    fs.writeFileSync(path.join(cwd, '.wp-env.json'), JSON.stringify({
      core: `WordPress/WordPress#${process.env.REGRESSION_WP_VERSION || '6.9.4'}`,
      phpVersion: process.env.REGRESSION_PHP_VERSION || '8.3',
      // Playground's multisite blueprint requires the standard HTTP port.
      port: 80, testsEnvironment: false, multisite: true,
      plugins: [plugin],
      config: {
        WP_HOME: 'http://127.0.0.1', WP_SITEURL: 'http://127.0.0.1',
        WP_ENVIRONMENT_TYPE: 'local', WP_DEBUG: true, WP_DEBUG_DISPLAY: true,
        SITEIMPROVE_REGRESSION_TEST_ENVIRONMENT: true,
      },
      mappings: { 'wp-content/mu-plugins': path.join(root, 'tests/integration-regressions/support') },
    }, null, 2));
    console.log(`Plugin under test: ${plugin}`);
  }
  const child = spawn(process.execPath, [path.join(__dirname, 'integration-regressions-runtime.js'), command,
    ...(command === 'start' ? ['--runtime=playground'] : [])], {
    cwd, stdio: 'inherit', env: { ...process.env, WP_ENV_HOME: path.join(cwd, 'cache') },
  });
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
  if (code !== 0) { process.exitCode = code ?? 1; return; }
  if (command === 'start') {
    // wp-env reports a listening port before a Playground blueprint has finished.
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch('http://127.0.0.1/wp-login.php', { signal: AbortSignal.timeout(2000), redirect: 'manual' });
        if (response.ok && (await response.text()).includes('id="user_login"')) {
          console.log('WordPress login is ready at http://127.0.0.1');
          return;
        }
      } catch { /* Retry while the blueprint installs WordPress and enables multisite. */ }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('WordPress did not become ready. Inspect .integration-regressions-env/cache/*/playground.log before running tests.');
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
