// Dev-only OAuth forwarder.
//
// Why this exists: Supabase's redirect allowlist silently rejects
// custom schemes like exp:// (verified empirically — exact entries
// included), so OAuth can never redirect straight back into Expo Go.
// Instead, Supabase redirects to this tiny HTTP server (http:// IS
// allowlisted), which forwards into the app.
//
//   Supabase -> http://<pc-ip>:8085/auth?code=...
//            -> 302 exp://<pc-ip>:8081/--/auth?code=...
//            -> intercepted by the auth sheet, app exchanges the code
//
// The target IP is taken from the incoming Host header, so this works
// unchanged whenever the PC's LAN address moves.
//
// Run alongside `expo start` during phone development:
//   node scripts/auth-forwarder.js

const http = require('http');

const PORT = 8085;
const APP_PORT = 8081; // Expo dev server

http
  .createServer((req, res) => {
    const [path, query] = req.url.split('?');
    if (path !== '/auth') {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const host = (req.headers.host || '').split(':')[0] || 'localhost';
    const target = `exp://${host}:${APP_PORT}/--/auth${query ? `?${query}` : ''}`;
    console.log(`[auth-forwarder] -> ${target}`);
    res.writeHead(302, { Location: target });
    res.end();
  })
  .listen(PORT, () => {
    console.log(`[auth-forwarder] listening on :${PORT}`);
  });
