import { EQUIPMENT_CATEGORIES } from '../../shared/equipmentCategories.js'
import { gorillaEvents } from '../../shared/gorillaEvents.js'
import { EquipmentService, EquipmentError } from '../services/EquipmentService.js'
import { EquipmentRepository } from '../repositories/EquipmentRepository.js'
import { EquipmentWorkflow } from '../services/EquipmentWorkflow.js'

export function registerEquipmentRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase, supabase, emitEvent }) {
  // ---------------------------------------------------------
  // EQUIPMENT MONITORING — OOP IMPLEMENTATION
  // ---------------------------------------------------------

  const equipmentWorkflow = new EquipmentWorkflow({
    service: new EquipmentService({
      categories: EQUIPMENT_CATEGORIES
    }),

    repository: new EquipmentRepository({
      loadDatabase,
      saveDatabase
    }),
    onSaved(equipment, previous, changes) {
      const notify = (alert) => emitEvent?.({ to: 'admins' }, alert)
      if (!previous) return notify(gorillaEvents.equipmentAdded(equipment.name))
      if (equipment.condition !== previous.condition) {
        if (equipment.condition === 'Out of Service')
          return notify(gorillaEvents.equipmentBroken(equipment.name))
        const type = equipment.condition === 'Needs Maintenance' ? 'warning' : 'success'
        return notify(gorillaEvents.equipmentUpdated(equipment.name, `condition changed to ${equipment.condition}`, type))
      }
      const detail = changes.inspected ? 'inspection completed'
        : changes.maintenanceNote !== undefined ? 'maintenance recorded'
          : `category changed to ${equipment.category}`
      return notify(gorillaEvents.equipmentUpdated(equipment.name, detail))
    }
  })

  // Shared error handler for equipment operations.
  function handleEquipmentError(error, res) {
    if (error instanceof EquipmentError) {
      return res.status(error.status).json({
        message: error.message
      })
    }

    console.error(
      'Equipment operation failed:',
      error?.message || 'Unknown error'
    )

    return res.status(500).json({
      message: 'Unable to process the equipment request.'
    })
  }

  // GET: Retrieve equipment and maintenance history.
  app.get(
    '/api/admin/equipment',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
      try {
        const result = await equipmentWorkflow.getAll()

        return res.json(result)
      } catch (error) {
        return handleEquipmentError(error, res)
      }
    }
  )

  // POST: Register new equipment.
  app.post(
    '/api/admin/equipment',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
      try {
        const equipment =
          await equipmentWorkflow.create(req.body)

        return res.status(201).json({
          equipment
        })
      } catch (error) {
        return handleEquipmentError(error, res)
      }
    }
  )

  // Keep maintenance history: the database clears its equipment link on deletion.
  app.delete('/api/admin/equipment/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
      const { data, error } = await supabase.from('gym_equipment')
        .delete().eq('id', req.params.id).select('id').maybeSingle()
      if (error) throw error
      if (!data) return res.status(404).json({ message: 'Equipment not found.' })
      return res.json({ message: 'Equipment deleted.' })
    } catch (error) {
      return handleEquipmentError(error, res)
    }
  })

  // PATCH: Update equipment and record maintenance.
  app.patch(
    '/api/admin/equipment/:id',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
      try {
        const equipment =
          await equipmentWorkflow.update({
            equipmentId: req.params.id,
            body: req.body
          })

        return res.json({
          equipment
        })
      } catch (error) {
        return handleEquipmentError(error, res)
      }
    }
  )


}
