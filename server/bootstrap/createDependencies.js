import { createSessionAuth } from '../middleware/sessionAuth.js'
import { createFaceChallenges } from '../services/faceVerification.js'
import { createAdminNotificationService } from '../services/adminNotifications.js'
import { MembershipService } from '../services/MembershipService.js'
import { MembershipRenewalWorkflow } from '../services/MembershipRenewalWorkflow.js'
import { MembershipRepository } from '../repositories/MembershipRepository.js'
import { MemberRegistrationService } from '../services/MemberRegistrationService.js'
import { MemberRegistrationWorkflow } from '../services/MemberRegistrationWorkflow.js'
import { MemberRegistrationRepository } from '../repositories/MemberRegistrationRepository.js'
import { AccountSeedRepository } from '../repositories/AccountSeedRepository.js'
import { AccountSeedWorkflow } from '../services/AccountSeedWorkflow.js'
import { SupabaseDatabaseGateway } from '../repositories/SupabaseDatabaseGateway.js'
import { generateTemporaryPassword } from '../lib/temporaryPassword.js'
import { passwordPolicy, passwordPolicyMessage } from '../../shared/passwordPolicy.js'
import { isRetiredPlan } from '../../shared/membershipPlans.js'
import { availablePlan, publicAccount, membershipStatus, addMembershipDays, validAccountInput, paymentMethod, emailPattern } from '../lib/accountRules.js'

export function createDependencies({ supabase, jwtSecret, isProduction }) {
  const databaseGateway = new SupabaseDatabaseGateway(supabase)
  const loadDatabase = (sections) => databaseGateway.loadDatabase(sections)
  const loadAccount = (id) => databaseGateway.loadAccount(id)
  const saveDatabase = (database) => databaseGateway.saveDatabase(database)

  const membershipService = new MembershipService()
  const membershipRepository = new MembershipRepository(supabase)
  const membershipRenewalWorkflow = new MembershipRenewalWorkflow({
    service: membershipService,
    repository: membershipRepository
  })

  const faceChallenges = createFaceChallenges()
  const memberRegistrationService = new MemberRegistrationService({
    validAccountInput, paymentMethod, availablePlan
  })
  const memberRegistrationRepository = new MemberRegistrationRepository(supabase)
  const memberRegistrationWorkflow = new MemberRegistrationWorkflow({
    authAdmin: supabase.auth.admin,
    repository: memberRegistrationRepository,
    generateTemporaryPassword
  })
  const adminNotifications = createAdminNotificationService({ supabase, loadDatabase })
  const { createSession, authenticate, requireRole, rateLimit } = createSessionAuth({
    jwtSecret, loadAccount, membershipStatus
  })
  const accountSeedWorkflow = new AccountSeedWorkflow({
    repository: new AccountSeedRepository({ supabase, loadDatabase, saveDatabase }),
    isProduction, passwordPolicy, passwordPolicyMessage, availablePlan, addMembershipDays
  })

  return {
    supabase, databaseGateway, loadDatabase, loadAccount, saveDatabase,
    membershipRenewalWorkflow, memberRegistrationService, memberRegistrationWorkflow,
    adminNotifications, faceChallenges,
    createSession, authenticate, requireRole, rateLimit,
    accountSeedWorkflow, availablePlan, publicAccount, membershipStatus,
    addMembershipDays, validAccountInput, paymentMethod, emailPattern,
    passwordPolicy, passwordPolicyMessage, isRetiredPlan
  }
}
