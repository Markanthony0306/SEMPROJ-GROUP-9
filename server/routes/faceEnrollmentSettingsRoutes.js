export function registerFaceEnrollmentRoutes(app, { authenticate, requireRole, rateLimit, supabase }) {
  app.delete(
    '/api/admin/members/:id/face-enrollment',
    authenticate,
    requireRole('admin'),
    rateLimit({ max: 10 }),
    async (req, res) => {
      try {
        const { error } = await supabase
          .from('face_enrollments')
          .delete()
          .eq('user_id', req.params.id)
        if (error) throw error
        return res.json({ message: 'Member face template removed.' })
      } catch (error) {
        console.error('Admin face enrollment removal failed:', error.message)
        return res.status(503).json({ message: 'Could not remove the face template.' })
      }
    }
  )

  app.get('/api/profile/face-enrollment', authenticate, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('face_enrollments')
        .select('enrollment_id')
        .eq('user_id', req.user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return res.json({ enrolled: Boolean(data) })
    } catch (error) {
      console.error('Face enrollment status lookup failed:', error.message)
      return res.status(503).json({ message: 'Could not load face verification settings.' })
    }
  })

  app.delete('/api/profile/face-enrollment', authenticate, async (req, res) => {
    try {
      const { error } = await supabase
        .from('face_enrollments')
        .delete()
        .eq('user_id', req.user.id)
      if (error) throw error
      return res.json({ message: 'Face sign-in has been disabled.' })
    } catch (error) {
      console.error('Face enrollment revocation failed:', error.message)
      return res.status(503).json({ message: 'Could not disable face sign-in. Please try again.' })
    }
  })



}
