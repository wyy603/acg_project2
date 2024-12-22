import http from 'http';
import httpProxy from 'http-proxy';

// 创建代理服务器
const proxy = httpProxy.createProxyServer({});

// 创建一个 HTTP 服务器来处理请求
const server = http.createServer((req, res) => {
  proxy.web(req, res, { target: 'http://localhost:5173' }, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Something went wrong.');
    }
  });
});

// 监听 9982 端口
server.listen(9982, '59.66.132.25', () => {
  console.log('Proxy server is running on http://59.66.132.25:9982');
});
