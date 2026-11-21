import { loadAccount, loadDatabase, saveDatabase } from '../lib/database.js'

/** Dependency-injected facade over the existing snapshot-based Supabase adapter.
 * Important: Database writes and their order remain entirely in lib/database.js.
 */
export class SupabaseDatabaseGateway {
  constructor(supabase) {
    this.supabase = supabase
  }

  loadAccount(id) {
    return loadAccount(this.supabase, id)
  }

  loadDatabase(sections) {
    return loadDatabase(this.supabase, sections)
  }

  saveDatabase(database) {
    return saveDatabase(this.supabase, database)
  }
}
