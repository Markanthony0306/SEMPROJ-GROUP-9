import fs from 'node:fs/promises'
import { build } from 'esbuild'

const dir = '.taste-skill/fitpulse-review'
await build({
  entryPoints: [dir + '/entry.jsx'],
  outfile: dir + '/bundle.js',
  bundle: true,
  format: 'iife',
  jsx: 'automatic',
  define: { 'import.meta.env': '{"DEV":true,"BASE_URL":"/"}', 'process.env.NODE_ENV': '"production"' },
  loader: { '.svg': 'dataurl', '.webp': 'dataurl', '.jpg': 'dataurl', '.png': 'dataurl' }
})
await fs.writeFile(dir + '/index.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FitPulse dashboard checks</title><link rel="stylesheet" href="bundle.css"></head><body><div id="root"></div><pre id="results" style="position:fixed;bottom:0;left:0;z-index:10000;background:var(--card);padding:12px;max-width:100%;white-space:pre-wrap">Checking FitPulse</pre><script src="bundle.js"></script></body></html>')
const page = await fs.readFile(dir + '/index.html', 'utf8')
await fs.writeFile(dir + '/privacy.html', page.replace('<body>', '<body data-preview="privacy">'))
