
import { randomUUID } from 'node:crypto'

export class EquipmentError extends Error {
  constructor(message, status = 400) {
    super(message)

    this.name = 'EquipmentError'
    this.status = status
  }
}

export class EquipmentService {
  constructor({
    categories,
    now = () => new Date().toISOString(),
    makeId = randomUUID
  }) {
    this.categories = categories
    this.now = now
    this.makeId = makeId
  }

  // STEP 1: Validate and prepare new equipment.
  prepareCreate(body = {}) {
    const name =
      typeof body?.name === 'string'
        ? body.name.trim()
        : ''

    if (!name) {
      throw new EquipmentError(
        'Equipment name is required.'
      )
    }

    if (!this.categories.includes(body.category)) {
      throw new EquipmentError(
        'Choose a valid equipment category.'
      )
    }

    return {
      id: this.makeId(),
      name,
      category: body.category,
      condition: 'Good',
      lastInspected: this.now()
    }
  }

  // STEP 2: Validate and prepare equipment changes.
  prepareUpdate({ equipment, body = {} }) {
    if (!equipment) {
      throw new EquipmentError(
        'Equipment not found.',
        404
      )
    }

    if (
      body.category !== undefined &&
      !this.categories.includes(body.category)
    ) {
      throw new EquipmentError(
        'Choose a valid equipment category.'
      )
    }

    const validConditions = [
      'Good',
      'Needs Maintenance',
      'Out of Service'
    ]

    if (
      body.condition !== undefined &&
      !validConditions.includes(body.condition)
    ) {
      throw new EquipmentError(
        'Choose a valid equipment condition.'
      )
    }

    const note =
      typeof body.maintenanceNote === 'string'
        ? body.maintenanceNote.trim()
        : ''

    if (
      body.maintenanceNote !== undefined &&
      (!note || note.length > 500)
    ) {
      throw new EquipmentError(
        'Use a maintenance note of 1–500 characters.'
      )
    }

    // Prepare a new object rather than changing
    // the original equipment record immediately.
    const updatedEquipment = {
      ...equipment
    }

    const maintenanceEntries = []

    // STEP 3: Update the equipment category.
    if (body.category !== undefined) {
      updatedEquipment.category = body.category
    }

    // STEP 4: Update equipment condition.
    if (body.condition !== undefined) {
      updatedEquipment.condition = body.condition

      // Preserve the original automatic condition log.
      if (!note) {
        maintenanceEntries.push({
          id: this.makeId(),
          equipmentId: equipment.id,
          item: equipment.name,
          note: `Condition set to ${body.condition}`,
          date: this.now()
        })
      }
    }

    // STEP 5: Record a maintenance note.
    if (note) {
      maintenanceEntries.push({
        id: this.makeId(),
        equipmentId: equipment.id,
        item: equipment.name,
        note,
        date: this.now()
      })
    }

    // STEP 6: Record an inspection.
    if (body.inspected) {
      updatedEquipment.lastInspected = this.now()

      maintenanceEntries.push({
        id: this.makeId(),
        equipmentId: equipment.id,
        item: equipment.name,
        note: 'Inspection completed',
        date: updatedEquipment.lastInspected
      })
    }

    return {
      equipment: updatedEquipment,
      maintenanceEntries
    }
  }
}
