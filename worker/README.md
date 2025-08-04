# SecCheck Security Scanner Worker

This is the background worker component for SecCheck that processes security scanning jobs using Playwright and various security testing modules.

## Architecture

- **BullMQ Worker**: Processes security scan jobs from Redis queue
- **Playwright**: Runs browser-based security tests
- **Security Tests**: Implements OWASP Top 10 vulnerability detection
- **PostgreSQL**: Stores scan results via Drizzle ORM

## Security Tests Implemented

1. **Security Headers** (A05 - Security Misconfiguration)
   - Content-Security-Policy
   - HTTP Strict-Transport-Security
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy
   - Permissions-Policy

2. **Cookie Security** (A07 - Identification and Authentication Failures)
   - Secure flag
   - HttpOnly flag
   - SameSite attribute
   - Domain scope analysis

3. **Directory Exposure** (A05 - Security Misconfiguration)
   - Common sensitive files (.env, .git/, config files)
   - Admin panels accessibility
   - Backup files exposure
   - Development files exposure

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://user:pass@host:port
NODE_ENV=production
WORKER_CONCURRENCY=2
PORT=8080
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm run dev

# Start production worker
npm start
```

## Docker

```bash
# Build image
docker build -t sec-check-worker .

# Run worker
docker run -e DATABASE_URL="" -e REDIS_URL="" sec-check-worker
```

## Fly.io Deployment

```bash
# Deploy to Fly.io
./deploy.sh

# Set secrets
flyctl secrets set DATABASE_URL="your-database-url"
flyctl secrets set REDIS_URL="your-redis-url"

# Scale workers
flyctl scale count 2

# View logs
flyctl logs

# Check status
flyctl status
```

## Job Processing

The worker processes jobs from the `security-scan` queue with the following flow:

1. **Job Received**: Extract scan parameters
2. **Initialize**: Update scan status to 'running'
3. **Run Tests**: Execute all security test modules
4. **Store Results**: Save findings to PostgreSQL
5. **Complete**: Update scan status and summary counts

## Scaling

- **Auto-scaling**: Configured to scale 0-5 machines based on queue depth
- **Concurrency**: Each worker processes 2 jobs concurrently
- **Resource Usage**: 1 CPU, 1GB RAM per machine
- **Cost Optimization**: Machines auto-stop when idle

## Monitoring

- **Health Checks**: HTTP endpoint at `/health`
- **Job Metrics**: BullMQ provides built-in metrics
- **Logs**: Structured logging via console
- **Error Handling**: Failed jobs are retried up to 3 times

## Security

- **Non-root User**: Container runs as `seccheck` user
- **Network Isolation**: Only connects to database and Redis
- **Resource Limits**: CPU and memory constraints
- **Input Validation**: All job data is validated with Zod schemas