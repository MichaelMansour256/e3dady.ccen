const https = require('https');

// IMPORTANT: These must be set via environment variables or .env file
// Never commit real credentials to git
const APP_ID = process.env.ONESIGNAL_APP_ID || 'your-app-id-here';
const API_KEY = process.env.ONESIGNAL_API_KEY || 'your-api-key-here';

function get(path) {
  return new Promise((resolve) => {
    const req = https.get({
      hostname: 'api.onesignal.com',
      path: path,
      headers: { 'Authorization': `Basic ${API_KEY}`, 'Content-Type': 'application/json' },
    }, (res) => {
      let r = '';
      res.on('data', (c) => (r += c));
      res.on('end', () => {
        console.log(`${path} -> ${res.statusCode}`);
        try {
          const j = JSON.parse(r);
          console.log(JSON.stringify(j, null, 2).substring(0, 3000));
        } catch {
          console.log(r.substring(0, 2000));
        }
        resolve();
      });
    });
    req.on('error', (e) => { console.error(path, e.message); resolve(); });
  });
}

async function main() {
  // List notifications (paginated)
  console.log('=== NOTIFICATIONS LIST (limit 5, recent first) ===');
  await get('/notifications?app_id=' + APP_ID + '&limit=5&sort=-created_at');

  await new Promise((r) => setTimeout(r, 800));

  // Get a single notification by ID
  console.log('\n=== SPECIFIC NOTIFICATION (session_count filter test) ===');
  await get('/notifications/86a43ab5-b55a-4dd3-8afb-153c3468a98e?app_id=' + APP_ID);

  await new Promise((r) => setTimeout(r, 800));

  // Try with the "all included players are not subscribed" notification
  console.log('\n=== NULL/TEST NOTIFICATION ===');
  await get('/notifications?app_id=' + APP_ID + '&limit=1');
}

main();
