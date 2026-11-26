import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'biometrics', 'verify.py')

export class BiometricError extends Error {
  constructor(message, code = 'VERIFICATION_FAILED', status = 422) {
    super(message)
    this.code = code
    this.status = status
  }
}

/** Raw images and biometric templates are never written to files or application logs. */
export function verifyBiometric(payload) {
  return new Promise((resolve, reject) => {
    const configuredPython = process.env.FITPULSE_BIOMETRIC_PYTHON
    // On Windows, `python` may resolve to a different installation than `py -3`.
    // The project setup uses the Python launcher, so follow it unless an explicit
    // interpreter path has been configured.
    const command = configuredPython || (process.platform === 'win32' ? 'py' : 'python')
    const args = [
      ...(!configuredPython && process.platform === 'win32' ? ['-3'] : []),
      script
    ]
    const worker = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    let output = ''
    const timer = setTimeout(() => worker.kill(), 45_000)
    worker.on('error', () => reject(new BiometricError('Biometric Python service is unavailable.', 'BIOMETRIC_UNAVAILABLE', 503)))
    worker.stdout.on('data', data => { output += data.toString(); if (output.length > 250_000) worker.kill() })
    // Deliberately discard stderr: underlying OCR/model errors can contain sensitive material.
    worker.on('close', code => {
      clearTimeout(timer)
      let result
      try { result = JSON.parse(output.trim()) } catch {
        reject(new BiometricError('Verification did not return a result. Check the Python service.', 'BIOMETRIC_UNAVAILABLE', 503))
        return
      }
      if (code !== 0 || result.error) {
        reject(new BiometricError(result.error || 'Face verification failed.', result.code || 'BIOMETRIC_UNAVAILABLE', result.code === 'VERIFICATION_UNAVAILABLE' ? 503 : 422))
      } else resolve(result)
    })
    worker.stdin.on('error', () => {})
    worker.stdin.end(JSON.stringify(payload))
  })
}
