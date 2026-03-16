const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

/**
 * SOVEREIGN ENVIRONMENT LOADER
 * Manually injects .env.local.dev into process.env for custom server parity.
 */
const envPath = path.join(process.cwd(), ".env.local.dev");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = value;
    }
  });
  console.log(`[Server] Loaded custom environment from ${envPath}`);
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3010', 10)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log(`[Server] Starting Tempus Victa in ${dev ? 'development' : 'production'} mode...`)

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error('[Server] Fatal Error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Tempus Victa Sovereign Server Ready on http://localhost:${port}`)
      console.log(`> Listening on all interfaces (0.0.0.0:${port})`)
    })
}).catch((err) => {
  console.error('[Server] Failed to prepare application:', err)
  process.exit(1)
})
