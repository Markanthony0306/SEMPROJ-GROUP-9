
export class EquipmentRepository {
  constructor({ loadDatabase, saveDatabase }) {
    this.loadDatabase = loadDatabase
    this.saveDatabase = saveDatabase
  }

  // STEP 1: Retrieve equipment and maintenance records.
  async loadRecords() {
    return this.loadDatabase([
      'equipment',
      'maintenance'
    ])
  }

  // STEP 2: Save newly registered equipment.
  async create(database, equipment) {
    database.equipment.push(equipment)

    await this.saveDatabase(database)

    return equipment
  }

  // STEP 3: Save changes and maintenance records.
  async update(database, {
    equipment,
    maintenanceEntries
  }) {
    const index = database.equipment.findIndex(
      (item) => item.id === equipment.id
    )

    if (index === -1) {
      throw new Error(
        'Equipment record disappeared before saving.'
      )
    }

    database.equipment[index] = equipment

    // Preserve the ordering used by the original
    // endpoint: newest maintenance records first.
    for (const entry of maintenanceEntries) {
      database.maintenance.unshift(entry)
    }

    // Existing database.js persists changes to:
    // gym_equipment and gym_maintenance.
    await this.saveDatabase(database)

    return equipment
  }
}
