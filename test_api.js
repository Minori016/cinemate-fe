const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/promotions/active',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
