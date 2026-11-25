import fs from 'node:fs/promises'
import { build } from 'esbuild'

await build({
  entryPoints: ['.taste-skill/member-modal-qa/entry.jsx'],
  outfile: '.taste-skill/member-modal-qa/bundle.js',
  bundle: true,
  format: 'iife',
  jsx: 'automatic',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  loader: { '.webp': 'dataurl', '.jpg': 'dataurl' },
  logLevel: 'error'
})
await fs.writeFile('.taste-skill/member-modal-qa/index.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Member modal dismissal checks</title><link rel="stylesheet" href="bundle.css">
<style>body{padding:24px}pre{white-space:pre-wrap;font-size:16px;line-height:1.7}</style>
</head><body><pre id="result">Running member modal checks…</pre><div id="root"></div><script src="bundle.js"></script></body></html>`)
console.log('Prepared isolated member modal browser checks; no API, camera, or account creation requests.')
