const { execSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const iosDir = path.join(projectRoot, 'ios');

if (process.platform !== 'darwin') {
  console.log(`[postinstall] Skipping CocoaPods install on ${process.platform}.`);
  process.exit(0);
}

try {
  console.log('[postinstall] Installing iOS pods...');
  execSync('pod install', {
    cwd: iosDir,
    stdio: 'inherit',
  });
  console.log('[postinstall] Pods installed successfully.');
} catch (error) {
  console.error('\n[postinstall] Failed to run "pod install".');
  console.error(error.message);
  process.exit(1);
}
