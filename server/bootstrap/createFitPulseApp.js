import cors from 'cors'
import express from 'express'
import { supabase } from '../lib/supabase.js'
import { createRuntimeConfig } from '../config/runtimeConfig.js'
import { createDependencies } from './createDependencies.js'
import { registerApiRoutes } from './registerApiRoutes.js'
import { httpErrorHandler } from '../middleware/httpErrorHandler.js'
import { createEmailDelivery, emailConfiguration } from '../services/emailDelivery.js'
import { createMembershipReminderService, startMembershipReminders } from '../services/membershipReminders.js'

/** Creates the app without listening; startup seeding is still done by server.js. */
export function createFitPulseApp({ supabaseClient = supabase } = {}) {
  const config = createRuntimeConfig()
  const app = express()

  // Retain the original CORS and JSON middleware order and limits.
  app.use(cors({ origin: config.corsOrigins }))
  // Captured images are accepted only on the verification endpoints.
  app.use(['/api/admin/identity', '/api/auth/face-login'], express.json({ limit: '12mb' }))
  app.use(express.json({ limit: '100kb' }))

  const dependencies = createDependencies({
    supabase: supabaseClient,
    jwtSecret: config.jwtSecret,
    isProduction: config.isProduction
  })
  registerApiRoutes(app, dependencies, config)
  app.use(httpErrorHandler)

  function startReminders() {
    // Keep mail startup outside the app factory so tests and other consumers can opt in.
    const email = emailConfiguration()
    const mailer = createEmailDelivery(email)
    if (!mailer) return () => {}
    const { runDue } = createMembershipReminderService({
      supabase: supabaseClient,
      loadDatabase: dependencies.loadDatabase,
      mailer,
      from: email.from,
      loginUrl: config.clientUrl,
      emitEvent: dependencies.events.emitEvent
    })
    const stop = startMembershipReminders({ runDue })
    return () => {
      stop()
      mailer.close()
    }
  }

  return {
    app, port: config.port, accountSeedWorkflow: dependencies.accountSeedWorkflow, startReminders
  }
}
