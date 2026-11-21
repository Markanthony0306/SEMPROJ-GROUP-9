import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MemberUpdateWorkflow,
  MemberUpdateWorkflowError
} from './MemberUpdateWorkflow.js'

// Create mock dependencies.
// These do not connect to Supabase.
function createWorkflow({
  linkedAuthUserId = 'auth-123',
  duplicateEmail = false,
  validationError = null
} = {}) {
  const calls = []

  const service = {
    prepare({ member, body }) {
      calls.push('service.prepare')

      if (validationError) {
        throw validationError
      }

      return {
        input: {
          name: body.name || member.name,
          email: body.email || member.email,
          phone: member.phone,
          plan: member.plan
        },
        authUpdates: {},
        passwordChanged: false
      }
    }
  }

  const repository = {
    async getLinkedAuthUserId(memberId) {
      calls.push('repository.getLinkedAuthUserId')

      assert.equal(memberId, 'member-123')

      return linkedAuthUserId
    },

    async emailExistsForAnotherMember({ memberId, email }) {
      calls.push('repository.emailExistsForAnotherMember')

      assert.equal(memberId, 'member-123')
      assert.equal(email, 'mia@example.com')

      return duplicateEmail
    },

    async updateProfile() {
      throw new Error(
        'Preflight must not update the database.'
      )
    },


    async updateDetailsAtomic({
      actorId,
      memberId,
      input,
      planChanged
    }) {
      calls.push('repository.updateDetailsAtomic')

      assert.equal(actorId, 'admin-123')
      assert.equal(memberId, 'member-123')
      assert.equal(planChanged, true)

      if (profileError) {
        throw profileError
      }

      return {
        updatedProfile: {
          id: memberId,
          name: input.name,
          email: input.email,
          phone_number: input.phone || null
        },
        subscriptionId: 'subscription-123',
        planChanged: true
      }
    }

  }

  const workflow = new MemberUpdateWorkflow({
    service,
    repository
  })

  return { workflow, calls }
}

function createMember() {
  return {
    id: 'member-123',
    name: 'Mia Cruz',
    email: 'mia@example.com',
    phone: '09171234567',
    plan: 'Monthly'
  }
}

// TEST 1
test('prepares a valid update before database writes', async () => {
  const { workflow, calls } = createWorkflow()

  const result = await workflow.preflight({
    member: createMember(),
    body: {
      name: 'Mia Santos'
    },
    accounts: [createMember()]
  })

  assert.equal(result.authUserId, 'auth-123')
  assert.equal(result.input.name, 'Mia Santos')
  assert.equal(result.input.email, 'mia@example.com')

  assert.deepEqual(calls, [
    'service.prepare',
    'repository.getLinkedAuthUserId',
    'repository.emailExistsForAnotherMember'
  ])
})

// TEST 2
test('rejects a member without a linked Auth account', async () => {
  const { workflow, calls } = createWorkflow({
    linkedAuthUserId: null
  })

  await assert.rejects(
    () => workflow.preflight({
      member: createMember(),
      body: {},
      accounts: [createMember()]
    }),
    (error) =>
      error instanceof MemberUpdateWorkflowError &&
      error.status === 500 &&
      error.message ===
        'Unable to find the member login account.'
  )

  // No email lookup or writes should occur afterward.
  assert.deepEqual(calls, [
    'service.prepare',
    'repository.getLinkedAuthUserId'
  ])
})

// TEST 3
test('rejects an email used by another Supabase profile', async () => {
  const { workflow } = createWorkflow({
    duplicateEmail: true
  })

  await assert.rejects(
    () => workflow.preflight({
      member: createMember(),
      body: {},
      accounts: [createMember()]
    }),
    (error) =>
      error instanceof MemberUpdateWorkflowError &&
      error.status === 409 &&
      error.message ===
        'An account with this email already exists.'
  )
})

// TEST 4
test('stops before database lookups when validation fails', async () => {
  const validationError = Object.assign(
    new Error('Invalid member information.'),
    { status: 400 }
  )

  const { workflow, calls } = createWorkflow({
    validationError
  })

  await assert.rejects(
    () => workflow.preflight({
      member: createMember(),
      body: { name: '' },
      accounts: [createMember()]
    }),
    (error) =>
      error.status === 400 &&
      error.message === 'Invalid member information.'
  )

  assert.deepEqual(calls, [
    'service.prepare'
  ])
})

/*
 * MEMBER UPDATE EXECUTION TESTS
 *
 * These use mock dependencies.
 * No real Supabase records are modified.
 */

function createExecutionWorkflow({
  profileError = null
} = {}) {
  const calls = []

  const service = {
    prepare({ member, body = {} }) {
      calls.push('service.prepare')

      const input = {
        name: body.name ?? member.name,
        email: String(body.email ?? member.email)
          .trim()
          .toLowerCase(),
        phone: body.phone ?? member.phone,
        plan: body.plan ?? member.plan
      }

      const authUpdates = {}

      if (input.email !== member.email.toLowerCase()) {
        authUpdates.email = input.email
        authUpdates.email_confirm = true
      }

      if (body.password) {
        authUpdates.password = body.password
      }

      return {
        input,
        authUpdates,
        passwordChanged: Boolean(body.password)
      }
    }
  }

  const repository = {
    async getLinkedAuthUserId(memberId) {
      calls.push('repository.getLinkedAuthUserId')
      return 'auth-123'
    },

    async emailExistsForAnotherMember({ memberId, email }) {
      calls.push('repository.emailExistsForAnotherMember')
      return false
    },

    
    async updateProfile({ memberId, input }) {
      calls.push('repository.updateProfile')

      if (profileError) {
        throw profileError
      }

      return {
        id: memberId,
        name: input.name,
        email: input.email,
        phone_number: input.phone || null
      }
    },

    // Mock the atomic database operation.
    async updateDetailsAtomic({
      actorId,
      memberId,
      input,
      planChanged
    }) {
      calls.push('repository.updateDetailsAtomic')

      assert.equal(actorId, 'admin-123')
      assert.equal(memberId, 'member-123')
      assert.equal(planChanged, true)

      if (profileError) {
        throw profileError
      }

      return {
        updatedProfile: {
          id: memberId,
          name: input.name,
          email: input.email,
          phone_number: input.phone || null
        },
        subscriptionId: 'subscription-123',
        planChanged: true
      }
    }

  }

  return {
    workflow: new MemberUpdateWorkflow({
      service,
      repository
    }),
    calls
  }
}

// TEST 5
test('executes a profile-only update successfully', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  const result = await workflow.execute({
    member: createMember(),
    body: {
      name: 'Mia Santos',
      phone: '09991234567'
    },
    accounts: [createMember()]
  })

  assert.equal(result.updatedProfile.name, 'Mia Santos')
  assert.equal(
    result.updatedProfile.phone_number,
    '09991234567'
  )

  assert.deepEqual(calls, [
    'service.prepare',
    'repository.getLinkedAuthUserId',
    'repository.emailExistsForAnotherMember',
    'repository.updateProfile'
  ])
})

// TEST 6
test('reports a failed profile update', async () => {
  const { workflow } = createExecutionWorkflow({
    profileError: Object.assign(
      new Error('Database update failed'),
      { code: 'PROFILE_UPDATE_FAILED' }
    )
  })

  await assert.rejects(
    () => workflow.execute({
      member: createMember(),
      body: {
        name: 'Mia Santos'
      },
      accounts: [createMember()]
    }),
    (error) =>
      error instanceof MemberUpdateWorkflowError &&
      error.status === 500 &&
      error.code === 'PROFILE_UPDATE_FAILED'
  )
})

// TEST 7

test('updates the Auth email before saving the profile', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  workflow.authAdmin = {
    async updateUserById(authUserId, changes) {
      calls.push('auth.updateUserById')

      assert.equal(authUserId, 'auth-123')
      assert.deepEqual(changes, {
        email: 'new@example.com',
        email_confirm: true
      })

      return {
        data: {
          user: {
            id: authUserId,
            email: changes.email
          }
        },
        error: null
      }
    }
  }

  const result = await workflow.execute({
    member: createMember(),
    body: {
      name: 'Mia Santos',
      email: 'NEW@EXAMPLE.COM'
    },
    accounts: [createMember()]
  })

  assert.equal(result.emailChanged, true)
  assert.equal(result.updatedProfile.email, 'new@example.com')

  assert.deepEqual(calls, [
    'service.prepare',
    'repository.getLinkedAuthUserId',
    'repository.emailExistsForAnotherMember',
    'auth.updateUserById',
    'repository.updateProfile'
  ])
})

test('does not update the profile when Supabase Auth rejects the email', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  workflow.authAdmin = {
    async updateUserById() {
      calls.push('auth.updateUserById')

      return {
        data: { user: null },
        error: { message: 'Email update rejected' }
      }
    }
  }

  await assert.rejects(
    () => workflow.execute({
      member: createMember(),
      body: { email: 'new@example.com' },
      accounts: [createMember()]
    }),
    (error) =>
      error instanceof MemberUpdateWorkflowError &&
      error.code === 'AUTH_UPDATE_FAILED'
  )

  assert.equal(calls.includes('repository.updateProfile'), false)
})

test('requires reconciliation if the profile write fails after Auth succeeds', async () => {
  const { workflow, calls } = createExecutionWorkflow({
    profileError: new Error('Database unavailable')
  })

  workflow.authAdmin = {
    async updateUserById(authUserId, changes) {
      calls.push('auth.updateUserById')

      return {
        data: {
          user: {
            id: authUserId,
            email: changes.email
          }
        },
        error: null
      }
    }
  }

  await assert.rejects(
    () => workflow.execute({
      member: createMember(),
      body: { email: 'new@example.com' },
      accounts: [createMember()]
    }),
    (error) =>
      error instanceof MemberUpdateWorkflowError &&
      error.code === 'EMAIL_RECONCILIATION_REQUIRED'
  )

  assert.equal(
    calls.includes('repository.updateProfile'),
    true
  )
})


test('updates email and plan through the consolidated workflow', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  workflow.authAdmin = {
    async updateUserById(id, changes) {
      calls.push('auth.updateUserById')
      return {
        data: {
          user: {
            id,
            email: changes.email
          }
        },
        error: null
      }
    }
  }

  const result = await workflow.execute({
    actorId: 'admin-123',
    member: createMember(),
    body: {
      email: 'new@example.com',
      plan: 'Quarterly'
    },
    accounts: [createMember()]
  })

  assert.equal(result.emailChanged, true)
  assert.equal(result.planChanged, true)
  assert.equal(result.updatedProfile.email, 'new@example.com')

  assert.ok(calls.includes('repository.updateDetailsAtomic'))
  assert.ok(calls.includes('repository.updateProfile'))
})



test('updates password and invalidates existing sessions', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  workflow.repository.beginPasswordChange = async () => {
    calls.push('repository.beginPasswordChange')
    return 2
  }

  workflow.repository.completePasswordChange = async ({
    authVersion
  }) => {
    calls.push('repository.completePasswordChange')
    assert.equal(authVersion, 2)
    return { auth_version: 2, must_change_password: false }
  }

  workflow.authAdmin = {
    async updateUserById(id, changes) {
      calls.push('auth.updateUserById')
      assert.equal(changes.password, 'StrongPassword123!')

      return {
        data: { user: { id } },
        error: null
      }
    }
  }

  const result = await workflow.execute({
    actorId: 'admin-123',
    member: createMember(),
    body: {
      password: 'StrongPassword123!'
    },
    accounts: [createMember()]
  })

  assert.equal(result.passwordChanged, true)
  assert.equal(result.authVersion, 2)

  const invalidateIndex =
    calls.indexOf('repository.beginPasswordChange')
  const authIndex =
    calls.indexOf('auth.updateUserById')
  const finalizeIndex =
    calls.indexOf('repository.completePasswordChange')

  assert.ok(invalidateIndex < authIndex)
  assert.ok(authIndex < finalizeIndex)
})


test('updates a membership plan through the atomic repository', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  const result = await workflow.execute({
    actorId: 'admin-123',
    member: createMember(),
    body: {
      name: 'Mia Santos',
      plan: 'Quarterly'
    },
    accounts: [createMember()]
  })

  assert.equal(result.updatedProfile.name, 'Mia Santos')
  assert.equal(result.planChanged, true)
  assert.equal(result.subscriptionId, 'subscription-123')

  assert.equal(
    calls.includes('repository.updateDetailsAtomic'),
    true
  )

  assert.equal(
    calls.includes('repository.updateProfile'),
    false
  )
})

test('rejects membership-plan changes without an administrator ID', async () => {
  const { workflow, calls } = createExecutionWorkflow()

  await assert.rejects(
    () => workflow.execute({
      member: createMember(),
      body: {
        plan: 'Quarterly'
      },
      accounts: [createMember()]
    }),
    (error) =>
      error instanceof MemberUpdateWorkflowError &&
      error.code === 'ACTOR_ID_REQUIRED'
  )

  assert.equal(
    calls.includes('repository.updateDetailsAtomic'),
    false
  )
})

