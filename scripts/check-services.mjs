import 'dotenv/config'
import { networkErrorCode } from '../server/lib/networkErrors.js'

async function check(name, url, options = {}, accepted = [200]) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000), redirect: 'error' })
    await response.body?.cancel()
    const healthy = accepted.includes(response.status)
    console.log(`${name}: ${healthy ? 'reachable' : 'check configuration'} (HTTP ${response.status})`)
    if (!healthy) process.exitCode = 1
  } catch (error) {
    console.log(`${name}: unreachable (${networkErrorCode(error) || 'REQUEST_FAILED'})`)
    process.exitCode = 1
  }
}

// GET confirms connectivity without sending a member's ID to the reader.
await check('OCR reader', process.env.ID_PADDLE_OCR_URL || 'http://127.0.0.1:8080/ocr', {}, [200, 405])
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.log('Supabase: configure SUPABASE_URL and SUPABASE_SECRET_KEY in the API environment')
  process.exitCode = 1
} else {
  await check('Supabase users', new URL('/rest/v1/users?select=id&limit=1', process.env.SUPABASE_URL), {
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`
    }
  })
}
