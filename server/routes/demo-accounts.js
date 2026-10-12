import express from 'express'
import bcrypt from 'bcryptjs'

// These are public development defaults, never a way to recover saved passwords.
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@fitpulse.com', password: 'admin123', roles: ['admin'] },
  {
    label: 'Member',
    email: 'member@fitpulse.com',
    password: 'member123',
    roles: ['user', 'member']
  }
]

export function demoAccountRoutes({ isProduction, loadDatabase, rateLimit }) {
  const router = express.Router()
  if (isProduction) return router

  router.get('/auth/demo-accounts', rateLimit({ max: 20 }), async (req, res) => {
    const database = loadDatabase()
    const accounts = await Promise.all(
      DEMO_ACCOUNTS.map(async (demo) => {
        const account = database.accounts.find(
          (item) => item.email === demo.email && demo.roles.includes(item.role)
        )
        if (!account) return null
        return {
          label: demo.label,
          email: demo.email,
          defaultPasswordAvailable: await bcrypt.compare(demo.password, account.passwordHash || '')
        }
      })
    )
    res.set('Cache-Control', 'no-store').json({ accounts: accounts.filter(Boolean) })
  })
  return router
}
