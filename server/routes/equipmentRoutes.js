import { EQUIPMENT_CATEGORIES } from '../../shared/equipmentCategories.js'
import { EquipmentService, EquipmentError } from '../services/EquipmentService.js'
import { EquipmentRepository } from '../repositories/EquipmentRepository.js'
import { EquipmentWorkflow } from '../services/EquipmentWorkflow.js'

export function registerEquipmentRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase }) {
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
    })
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
