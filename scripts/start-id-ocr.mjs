import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const localPython = fileURLToPath(new URL(
  process.platform === 'win32' ? '../.venv-id-ocr/Scripts/python.exe' : '../.venv-id-ocr/bin/python',
  import.meta.url
))
const args = ['--serve', '--pipeline', 'OCR', '--host', '127.0.0.1', '--port', '8080', '--device', 'cpu']
const hasLocalPython = existsSync(localPython)
const command = hasLocalPython ? localPython : 'paddlex'
const cache = fileURLToPath(new URL('../.venv-id-ocr/cache', import.meta.url))
const child = spawn(command, hasLocalPython ? ['-m', 'paddlex', ...args] : args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...(hasLocalPython ? {
      PADDLE_PDX_CACHE_HOME: process.env.PADDLE_PDX_CACHE_HOME || cache,
      HF_HOME: process.env.HF_HOME || cache
    } : {})
  }
})

child.on('error', () => {
  console.error('Could not start PaddleOCR. Check the local OCR environment or install PaddleX.')
  process.exitCode = 1
})
child.on('exit', (code) => { process.exitCode = code ?? 1 })
