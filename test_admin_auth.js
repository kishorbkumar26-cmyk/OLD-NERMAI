const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/access-requests/admin/pending',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer DEV_ADMIN_TOKEN'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});

req.on('error', (e) => console.error(e));
req.end();
