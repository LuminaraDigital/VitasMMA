const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK\n');
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Test server listening on port 3000');
});
