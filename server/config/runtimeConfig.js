import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFaceEncryptionKey } from '../lib/face-auth.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

// Minimal .env loader so `npm run server` works without extra tooling in
// development. Real environment variables always win over values in the file.
function loadEnvironmentFile() {
  try {
    const lines = fs.readFileSync(path.join(directory, '..', '..', '.env'), 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || process.env[match[1]] !== undefined) continue
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // No .env file in development is fine; the environment can still provide values.
  }
}

export function createRuntimeConfig() {
  loadEnvironmentFile()
  const supabaseAuthKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!process.env.SUPABASE_URL || !supabaseAuthKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env'
    );
  }

  const port = Number(process.env.PORT || 3001)
  const isProduction = process.env.NODE_ENV === 'production'
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')

  // Never fall back to a hard-coded signing key: someone could forge sessions with
  // it. In development we use an ephemeral secret per boot; production must set one.
  const jwtSecret =
    process.env.JWT_SECRET || (isProduction ? '' : crypto.randomBytes(32).toString('hex'))
  if (!jwtSecret) {
    console.error('JWT_SECRET is required when NODE_ENV=production. Set it and restart the server.')
    process.exit(1)
  }

  const faceLoginEnabled = process.env.FACE_LOGIN_ENABLED === 'true'
  const faceEncryptionKey = parseFaceEncryptionKey()
  const configuredFaceThreshold = Number(process.env.FACE_MATCH_THRESHOLD || 0.5)
  if (faceLoginEnabled && !faceEncryptionKey) {
    throw new Error('FACE_ENCRYPTION_KEY must be a 64-character hex key when FACE_LOGIN_ENABLED=true.')
  }
  if (!Number.isFinite(configuredFaceThreshold) || configuredFaceThreshold <= 0 || configuredFaceThreshold > 1) {
    throw new Error('FACE_MATCH_THRESHOLD must be a number greater than 0 and at most 1.')
  }
  const faceMatchThreshold = configuredFaceThreshold

  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return { port, isProduction, clientUrl, jwtSecret, faceLoginEnabled, faceEncryptionKey, faceMatchThreshold, corsOrigins }
}
