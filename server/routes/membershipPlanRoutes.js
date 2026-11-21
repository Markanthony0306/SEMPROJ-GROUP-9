export function registerMembershipPlanRoutes(app, { authenticate, requireRole, supabase, isRetiredPlan }) {
  app.get('/api/admin/membership-plans', authenticate, requireRole('admin'), async (_req, res) => {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('plan_id, plan_name, duration_days, price, is_active')
      .eq('is_active', true)
      .order('plan_id')

    if (error) {
      console.error('Unable to load membership plans:', error.message)
      return res.status(500).json({ message: 'Unable to load membership plans.' })
    }

    return res.json({ membershipPlans: (data || []).filter((plan) => !isRetiredPlan(plan.plan_name)) })
  })




}
