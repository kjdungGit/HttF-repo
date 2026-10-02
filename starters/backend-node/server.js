import { createServer } from 'node:http';
export const server = createServer((req, res) => {
  const healthy = req.method === 'GET' && req.url === '/health';
  res.writeHead(healthy ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(healthy ? { status: 'ok' } : { error: 'Not found' }));
});
server.listen(Number(process.env.PORT || 4000), '0.0.0.0');
