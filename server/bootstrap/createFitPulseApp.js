import cors from 'cors'
import express from 'express'
import { supabase } from '../lib/supabase.js'
import { createRuntimeConfig } from '../config/runtimeConfig.js'
import { createDependencies } from './createDependencies.js'
import { registerApiRoutes } from './registerApiRoutes.js'
import { httpErrorHandler } from '../middleware/httpErrorHandler.js'
import { FACE_BODY_LIMIT } from '../../shared/faceLiveness.js'

/** Creates the app without listening; startup seeding is still done by server.js. */
export function createFitPulseApp({ supabaseClient = supabase } = {}) {
  const config = createRuntimeConfig()
  const app = express()

  // Retain the original CORS and JSON middleware order and limits.
  app.use(cors({ origin: config.corsOrigins }))
  app.use(
    ['/api/auth/face-verify', '/api/admin/members/:id/face-enrollment',
     '/api/admin/id-verifications/:id/face'],
    express.json({ limit: FACE_BODY_LIMIT })
  )
  app.use(express.json({ limit: '100kb' }))

  const dependencies = createDependencies({
    supabase: supabaseClient,
    jwtSecret: config.jwtSecret,
    isProduction: config.isProduction,
    identityVerificationEnabled: config.identityVerificationEnabled
  })
  registerApiRoutes(app, dependencies, config)
  app.use(httpErrorHandler)

  return { app, port: config.port, accountSeedWorkflow: dependencies.accountSeedWorkflow }
}
