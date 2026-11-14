
export class EquipmentWorkflow {
  constructor({ service, repository }) {
    this.service = service
    this.repository = repository
  }

  // Retrieve equipment and maintenance history.
  async getAll() {
    const database =
      await this.repository.loadRecords()

    return {
      equipment: database.equipment,
      maintenance: database.maintenance
    }
  }

  // Register new equipment.
  async create(body = {}) {
    // STEP 1: Validate and prepare equipment.
    const equipment =
      this.service.prepareCreate(body)

    // STEP 2: Load database records.
    const database =
      await this.repository.loadRecords()

    // STEP 3: Save the equipment.
    return this.repository.create(
      database,
      equipment
    )
  }

  // Update equipment and create maintenance logs.
  async update({ equipmentId, body = {} }) {
    // STEP 1: Load existing records.
    const database =
      await this.repository.loadRecords()

    // STEP 2: Find the requested equipment.
    const existingEquipment =
      database.equipment.find(
        (item) => item.id === equipmentId
      )

    // STEP 3: Validate and prepare changes.
    const prepared =
      this.service.prepareUpdate({
        equipment: existingEquipment,
        body
      })

    // STEP 4: Persist equipment and maintenance.
    return this.repository.update(
      database,
      prepared
    )
  }
}
