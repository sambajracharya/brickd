// Build Brick'd as an installable PWA.
//
//   node scripts/build-pwa.js
//
// Runs Expo's web export, then layers on everything iOS needs for
// "Add to Home Screen" to behave like a real app: manifest, icons,
// Apple-specific meta tags, and a service worker for offline opening.
// Output lands in dist/ ready to upload to any static host.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PWA = path.join(ROOT, 'pwa');

console.log('› Exporting web build...');
execSync('npx expo export -p web --clear', { cwd: ROOT, stdio: 'inherit' });

// Expo exports bundled assets (icon fonts!) to
// dist/assets/node_modules/... — but Netlify and several other static
// hosts strip any folder named node_modules from a deploy, so the icon
// font 404s in production and every icon renders as a tofu square.
// Relocate those assets and rewrite the references in the bundle.
console.log('› Relocating assets out of node_modules paths...');
const fromDir = path.join(DIST, 'assets', 'node_modules');
const toDir = path.join(DIST, 'assets', 'vendor');
if (fs.existsSync(fromDir)) {
  fs.rmSync(toDir, { recursive: true, force: true });
  fs.renameSync(fromDir, toDir);

  let patched = 0;
  const rewrite = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) rewrite(full);
      else if (/\.(js|css|json|html)$/.test(entry.name)) {
        const before = fs.readFileSync(full, 'utf8');
        const after = before.split('assets/node_modules/').join('assets/vendor/');
        if (after !== before) {
          fs.writeFileSync(full, after);
          patched++;
        }
      }
    }
  };
  rewrite(DIST);
  console.log(`  moved assets/node_modules -> assets/vendor (${patched} file(s) rewritten)`);
}

console.log('› Adding PWA assets...');
for (const file of fs.readdirSync(PWA)) {
  fs.copyFileSync(path.join(PWA, file), path.join(DIST, file));
}

console.log('› Patching index.html...');
const indexPath = path.join(DIST, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const head = `
    <meta name="description" content="Evidence-based foods for healthy testosterone — at stores near you." />
    <meta name="theme-color" content="#04060A" />
    <link rel="manifest" href="/manifest.json" />

    <!-- iOS home-screen app -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Brick'd" />
    <link rel="apple-touch-icon" href="/icon-180.png" />

    <!-- Fills the notch/home-indicator area with the app's background -->
    <style>
      html, body { background-color: #04060A; }
      body { overscroll-behavior: none; }
    </style>

    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>`;

// viewport-fit=cover lets the app draw into the notch area; the app's
// own safe-area insets keep content clear of it.
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />'
);
html = html.replace('<title>brickd</title>', "<title>Brick'd</title>" + head);

fs.writeFileSync(indexPath, html);

// Netlify/Vercel/Cloudflare: serve index.html for any route so deep
// links and refreshes don't 404.
fs.writeFileSync(path.join(DIST, '_redirects'), '/*  /index.html  200\n');

const files = fs.readdirSync(DIST);
console.log(`\n✓ dist/ ready (${files.length} entries) — upload this folder.`);
