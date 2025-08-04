import { createServer } from 'http';
import { worker } from './worker';

// Simple health check server for Fly.io
const server = createServer((req, res) => {
  if (req.url === '/health') {
    // Check if worker is running
    if (worker.isRunning()) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: {
          running: true,
          paused: worker.isPaused(),
        }
      }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        worker: {
          running: false,
        }
      }));
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});

export { server };