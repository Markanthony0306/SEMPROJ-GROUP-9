/** Data access for existing startup account/demo seeding. */
export class AccountSeedRepository {
  constructor({ supabase, loadDatabase, saveDatabase }) {
    this.supabase = supabase
    this.loadDatabase = loadDatabase
    this.saveDatabase = saveDatabase
  }

  async findAuthUsersPage(page) {
    return this.supabase.auth.admin.listUsers({ page, perPage: 1000 })
  }

  async createAuthUser({ email, password, name }) {
    return this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
  }

  async load(tables) {
    return this.loadDatabase(tables)
  }

  async save(database) {
    return this.saveDatabase(database)
  }
}
