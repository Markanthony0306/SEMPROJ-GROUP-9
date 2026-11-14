
import {
  MemberDeletionService
} from './MemberDeletionService.js'

import {
  MemberDeletionRepository
} from '../repositories/MemberDeletionRepository.js'

import {
  MemberDeletionWorkflow
} from './MemberDeletionWorkflow.js'

// Keep the original function interface.
// Both manual deletion and automatic cleanup use it.
export async function deleteMemberAccount({
  supabase,
  account,
  beforeDelete
}) {
  const service = new MemberDeletionService()

  const repository =
    new MemberDeletionRepository(supabase)

  const workflow = new MemberDeletionWorkflow({
    service,
    repository
  })

  return workflow.execute({
    account,
    beforeDelete
  })
}
