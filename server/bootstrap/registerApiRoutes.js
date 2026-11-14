import { memberIdVerificationRoutes } from '../routes/memberIdVerification.js'
import { registerFaceEnrollmentRoutes } from '../routes/faceEnrollmentSettingsRoutes.js'
import { registerPasswordRecoveryRoutes } from '../routes/passwordRecoveryRoutes.js'
import { registerCurrentUserRoutes } from '../routes/currentUserRoutes.js'
import { registerMembershipPlanRoutes } from '../routes/membershipPlanRoutes.js'
import { registerMemberUpdateRoutes } from '../routes/memberUpdateRoutes.js'
import { registerEquipmentRoutes } from '../routes/equipmentRoutes.js'
import { registerSettingsRoutes } from '../routes/gymSettingsRoutes.js'
import { registerProfileUpdateRoutes } from '../routes/profileUpdateRoutes.js'
import { registerChangePasswordRoutes } from '../routes/changePasswordRoutes.js'
import { registerActivityAndPaymentRoutes } from '../routes/activityPaymentRoutes.js'
import { createSupabaseAuthClient } from '../lib/authClient.js'
import { withMemberAccountLock } from '../lib/memberAccountLock.js'
import { accountRoutes } from '../routes/accounts.js'
import { scannerRoutes } from '../routes/scanner.js'
import { avatarRoutes } from '../routes/avatar.js'
import { memberRoutes } from '../routes/members.js'
import { demoAccountRoutes } from '../routes/demo-accounts.js'
import { reportRoutes } from '../routes/reports.js'
import { notificationRoutes } from '../routes/notifications.js'
import { passwordLoginHandler } from '../routes/passwordLogin.js'
import { membershipRenewalRoutes } from '../routes/membershipRenewal.js'
import { faceVerificationRoutes } from '../routes/faceVerification.js'
import { memberRegistrationRoutes } from '../routes/memberRegistration.js'

/** Route registration order is intentionally identical to the original server.js. */
export function registerApiRoutes(app, dependencies, config) {
  const {
    supabase, loadDatabase, loadAccount, saveDatabase,
    membershipRenewalWorkflow, memberRegistrationService, memberRegistrationWorkflow, verifiedRegistrationWorkflow,
    adminNotifications, faceChallenges,
    createSession, authenticate, requireRole, rateLimit,
    availablePlan, publicAccount, validAccountInput, paymentMethod, emailPattern,
    passwordPolicy, passwordPolicyMessage, isRetiredPlan
  } = dependencies
  const { jwtSecret, isProduction, clientUrl, faceLoginEnabled, faceEncryptionKey, memberIdKey, identityVerificationEnabled, faceMatchThreshold } = config


  app.use('/api', accountRoutes({
    authenticate, requireRole, rateLimit, loadAccount, supabase,
    createAuthClient: createSupabaseAuthClient
  }))
  app.use('/api', reportRoutes({ authenticate, requireRole, loadDatabase, supabase, rateLimit }))
  app.use('/api', notificationRoutes({
    authenticate, requireRole, rateLimit, notifications: adminNotifications
  }))

  app.use('/api', demoAccountRoutes({
    isProduction,
    loadDatabase,
    rateLimit,
    verifyPassword: async (email, password) => {
      const { error } = await createSupabaseAuthClient().auth.signInWithPassword({ email, password })
      return !error
    }
  }))
  app.use('/api', scannerRoutes({ loadAccount, authenticate, requireRole, rateLimit, jwtSecret }))

  app.use('/api', membershipRenewalRoutes({
    authenticate,
    requireRole,
    loadDatabase,
    withMemberAccountLock,
    availablePlan,
    paymentMethod,
    publicAccount,
    workflow: membershipRenewalWorkflow
  }))

  // Member management routes
  app.use('/api', memberRoutes({
    authenticate,
    requireRole,
    loadDatabase,
    publicAccount
  }))

  app.use('/api', memberRegistrationRoutes({
    authenticate,
    requireRole,
    loadDatabase,
    supabase,
    validAccountInput,
    paymentMethod,
    registrationService: memberRegistrationService,
    registrationWorkflow: memberRegistrationWorkflow,
    verifiedRegistrationWorkflow,
    identityVerificationEnabled,
    faceKey: faceEncryptionKey,
    publicAccount
  }))

  app.use(
    '/api',
    avatarRoutes({ supabase, authenticate, requireRole, rateLimit })
  )

  // Legacy registration endpoint retired.
  // New member registration is handled by:
  // POST /api/admin/members
  // This endpoint remains temporarily to provide
  // a clear response to older API clients.
  app.post(
    '/api/auth/register',
    authenticate,
    requireRole('admin'),
    (_req, res) => {
      return res.status(410).json({
        message:
          'This registration endpoint has been retired. Use /api/admin/members.'
      })
    }
  )

  app.post('/api/auth/login', rateLimit({ max: 10 }), passwordLoginHandler({
    createAuthClient: createSupabaseAuthClient,
    supabase,
    loadAccount,
    createSession,
    identityVerificationEnabled,
    createAdminFaceChallenge: (account) => faceEncryptionKey && faceChallenges.issue({
      userId: account.id, authVersion: account.authVersion || 0, role: account.role
    }),
    createTermsChallenge: (account) =>
      faceChallenges.issueTerms({ userId: account.id, authVersion: account.authVersion || 0, role: account.role })
  }))

  app.use('/api', faceVerificationRoutes({
    supabase, authenticate, requireRole, rateLimit, loadAccount, createSession,
    staffFaceEnabled: faceLoginEnabled, identityVerificationEnabled, key: faceEncryptionKey, memberIdKey,
    challenges: faceChallenges, createAuthClient: createSupabaseAuthClient
  }))

  if (identityVerificationEnabled) {
    app.use('/api', memberIdVerificationRoutes({
      supabase, authenticate, requireRole, rateLimit, validAccountInput,
      key: memberIdKey, faceKey: faceEncryptionKey, challenges: faceChallenges
    }))
  }

  registerFaceEnrollmentRoutes(app, { authenticate, requireRole, rateLimit, supabase })

  registerPasswordRecoveryRoutes(app, { rateLimit, emailPattern, passwordPolicy, passwordPolicyMessage, supabase, createAuthClient: createSupabaseAuthClient, clientUrl })

  registerCurrentUserRoutes(app, { authenticate, loadAccount, publicAccount })

  registerMembershipPlanRoutes(app, { authenticate, requireRole, supabase, isRetiredPlan })

  registerMemberUpdateRoutes(app, { authenticate, requireRole, loadDatabase, validAccountInput, passwordPolicy, passwordPolicyMessage, supabase, publicAccount })

  registerEquipmentRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase })

  registerSettingsRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase })

  registerProfileUpdateRoutes(app, { authenticate, validAccountInput, supabase, loadDatabase, publicAccount })

  registerChangePasswordRoutes(app, { authenticate, rateLimit, passwordPolicy, passwordPolicyMessage, supabase, loadDatabase, saveDatabase, createAuthClient: createSupabaseAuthClient, createSession })

  registerActivityAndPaymentRoutes(app, { authenticate, requireRole, loadDatabase, supabase, paymentMethod })
}
