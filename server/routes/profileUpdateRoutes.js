import { ProfileUpdateService, ProfileUpdateError } from '../services/ProfileUpdateService.js'
import { ProfileUpdateRepository } from '../repositories/ProfileUpdateRepository.js'
import { ProfileUpdateWorkflow } from '../services/ProfileUpdateWorkflow.js'

export function registerProfileUpdateRoutes(app, { authenticate, validAccountInput, supabase, loadDatabase, publicAccount }) {
  const profileUpdateWorkflow = new ProfileUpdateWorkflow({
    service: new ProfileUpdateService({
      validAccountInput
    }),

    repository: new ProfileUpdateRepository({
      supabase,
      loadDatabase
    })
  })

  app.patch('/api/profile', authenticate, async (req, res) => {
    try {
      const account = await profileUpdateWorkflow.execute({
        actorId: req.user.id,
        body: req.body
      })

      return res.json({
        user: publicAccount(account)
      })

    } catch (error) {
      if (error instanceof ProfileUpdateError) {
        return res.status(error.status).json({
          message: error.message
        })
      }

      console.error(
        'Profile update failed:',
        error?.code || error?.name || 'UNKNOWN_ERROR'
      )

      return res.status(500).json({
        message: 'Unable to update your profile.'
      })
    }
  })

}
