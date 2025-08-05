import { createServer } from 'http';

// Track worker readiness
let workerReady = false;
let workerInstance: any = null;

// Simple health check server for Fly.io
const server = createServer((req, res) => {
  if (req.url === '/health') {
    // Check if worker is ready and running
    if (workerReady && workerInstance && workerInstance.isRunning()) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        worker: {
          running: true,
          paused: workerInstance.isPaused(),
        }
      }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: workerReady ? 'starting' : 'initializing',
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

// Function to set worker as ready
export const setWorkerReady = (worker: any) => {
  workerInstance = worker;
  workerReady = true;
};

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});

export { server };