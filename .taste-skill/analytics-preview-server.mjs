// Local QA only: runs installed Vite and records browser assertions, never the API.
import { createServer } from 'vite'
import { appendFileSync } from 'node:fs'

function recordResult(req, res) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  req.on('end', () => {
    const result = JSON.parse(body)
    appendFileSync('.taste-skill/analytics-qa-results.jsonl', `${JSON.stringify(result)}\n`)
    console.log('ANALYTICS_QA', JSON.stringify(result))
    res.end('ok')
  })
}
const server = await createServer({
  plugins: [
    {
      name: 'analytics-qa-results',
      configureServer(vite) {
        vite.middlewares.use('/__analytics_qa', recordResult)
      }
    }
  ],
  server: {
    port: 5174,
    host: '127.0.0.1',
    watch: { ignored: ['**/.taste-skill/chrome-*/**', '**/.taste-skill/shots/**'] }
  }
})
await server.listen()
console.log('Analytics QA listening at http://127.0.0.1:5174/.taste-skill/analytics-preview.html')
