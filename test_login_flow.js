const http = require('http');

const postData = JSON.stringify({
  identifier: 'admin@nermai.com',
  password: '123456'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Login Response:', res.statusCode, data);
    try {
      const token = JSON.parse(data).data.token;
      console.log('Got token:', token);
      
      const req2 = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/access-requests/admin/pending',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => data2 += chunk);
        res2.on('end', () => console.log('Pending requests response:', res2.statusCode, data2));
      });
      req2.end();
    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
