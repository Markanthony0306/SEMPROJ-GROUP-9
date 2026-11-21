
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MemberUpdateRepository,
  MemberUpdateRepositoryError
} from './MemberUpdateRepository.js'

// Simulate Supabase without connecting to a database.
function createSupabase({
  linkedProfile = { auth_user_id: 'auth-123' },
  linkedError = null,
  duplicateProfile = null,
  emailError = null
} = {}) {
  const calls = []

  return {
    calls,

    from(table) {
      const call = {
        table,
        columns: null,
        filters: []
      }

      calls.push(call)

      return {
        select(columns) {
          call.columns = columns
          return this
        },

        eq(column, value) {
          call.filters.push(['eq', column, value])
          return this
        },

        neq(column, value) {
          call.filters.push(['neq', column, value])
          return this
        },

        async maybeSingle() {
          if (call.columns === 'auth_user_id') {
            return {
              data: linkedProfile,
              error: linkedError
            }
          }

          if (call.columns === 'id') {
            return {
              data: duplicateProfile,
              error: emailError
            }
          }

          throw new Error('Unexpected Supabase query')
        }
      }
    }
  }
}

// TEST 1
test('retrieves the linked Supabase Auth user ID', async () => {
  const supabase = createSupabase()
  const repository = new MemberUpdateRepository(supabase)

  const authUserId =
    await repository.getLinkedAuthUserId('member-123')

  assert.equal(authUserId, 'auth-123')

  assert.deepEqual(supabase.calls[0], {
    table: 'users',
    columns: 'auth_user_id',
    filters: [['eq', 'id', 'member-123']]
  })
})

// TEST 2
test('returns null when no linked Auth account exists', async () => {
  const supabase = createSupabase({
    linkedProfile: null
  })

  const repository = new MemberUpdateRepository(supabase)

  const result =
    await repository.getLinkedAuthUserId('member-123')

  assert.equal(result, null)
})

// TEST 3
test('reports a Supabase error during Auth lookup', async () => {
  const supabase = createSupabase({
    linkedError: { message: 'Database unavailable' }
  })

  const repository = new MemberUpdateRepository(supabase)

  await assert.rejects(
    () => repository.getLinkedAuthUserId('member-123'),
    (error) =>
      error instanceof MemberUpdateRepositoryError &&
      error.code === 'AUTH_LOOKUP_FAILED'
  )
})

// TEST 4
test('detects an email used by another profile', async () => {
  const supabase = createSupabase({
    duplicateProfile: { id: 'member-456' }
  })

  const repository = new MemberUpdateRepository(supabase)

  const exists =
    await repository.emailExistsForAnotherMember({
      memberId: 'member-123',
      email: 'taken@example.com'
    })

  assert.equal(exists, true)

  assert.deepEqual(supabase.calls[0], {
    table: 'users',
    columns: 'id',
    filters: [
      ['eq', 'email', 'taken@example.com'],
      ['neq', 'id', 'member-123']
    ]
  })
})

// TEST 5
test('allows an email not used by another profile', async () => {
  const supabase = createSupabase({
    duplicateProfile: null
  })

  const repository = new MemberUpdateRepository(supabase)

  const exists =
    await repository.emailExistsForAnotherMember({
      memberId: 'member-123',
      email: 'available@example.com'
    })

  assert.equal(exists, false)
})

// TEST 6
test('reports a database error during email lookup', async () => {
  const supabase = createSupabase({
    emailError: { message: 'Email lookup failed' }
  })

  const repository = new MemberUpdateRepository(supabase)

  await assert.rejects(
    () => repository.emailExistsForAnotherMember({
      memberId: 'member-123',
      email: 'new@example.com'
    }),
    (error) =>
      error instanceof MemberUpdateRepositoryError &&
      error.code === 'EMAIL_LOOKUP_FAILED'
  )
})

/*
 * PROFILE UPDATE TESTS
 *
 * These tests simulate Supabase writes.
 * No real database connection is created.
 */

function createProfileUpdateSupabase({
  profile = {
    id: 'member-123',
    name: 'Mia Santos',
    email: 'mia@example.com',
    phone_number: '09991234567'
  },
  error = null
} = {}) {
  const call = {
    table: null,
    changes: null,
    filters: [],
    columns: null
  }

  return {
    call,

    from(table) {
      call.table = table

      return {
        update(changes) {
          call.changes = changes
          return this
        },

        eq(column, value) {
          call.filters.push(['eq', column, value])
          return this
        },

        select(columns) {
          call.columns = columns
          return this
        },

        async maybeSingle() {
          return {
            data: profile,
            error
          }
        }
      }
    }
  }
}

// TEST 7
test('updates member profile fields in Supabase', async () => {
  const supabase = createProfileUpdateSupabase()

  const repository = new MemberUpdateRepository(supabase)

  const result = await repository.updateProfile({
    memberId: 'member-123',
    input: {
      name: 'Mia Santos',
      email: 'mia@example.com',
      phone: '09991234567',

      // These must NOT be written to public.users
      // by the profile-update method.
      plan: 'Monthly',
      password: 'DoNotStoreThisPassword123!'
    }
  })

  assert.equal(result.name, 'Mia Santos')

  assert.equal(supabase.call.table, 'users')

  assert.deepEqual(supabase.call.changes, {
    name: 'Mia Santos',
    email: 'mia@example.com',
    phone_number: '09991234567'
  })

  assert.deepEqual(supabase.call.filters, [
    ['eq', 'id', 'member-123']
  ])

  assert.equal(
    supabase.call.columns,
    'id, name, email, phone_number'
  )
})

// TEST 8
test('reports an error when profile update fails', async () => {
  const supabase = createProfileUpdateSupabase({
    profile: null,
    error: {
      message: 'Database update failed'
    }
  })

  const repository = new MemberUpdateRepository(supabase)

  await assert.rejects(
    () => repository.updateProfile({
      memberId: 'member-123',
      input: {
        name: 'Mia Santos',
        email: 'mia@example.com',
        phone: ''
      }
    }),
    (error) =>
      error instanceof MemberUpdateRepositoryError &&
      error.code === 'PROFILE_UPDATE_FAILED'
  )
})

// TEST 9
test('rejects an update when no profile is returned', async () => {
  const supabase = createProfileUpdateSupabase({
    profile: null,
    error: null
  })

  const repository = new MemberUpdateRepository(supabase)

  await assert.rejects(
    () => repository.updateProfile({
      memberId: 'member-123',
      input: {
        name: 'Mia Santos',
        email: 'mia@example.com',
        phone: ''
      }
    }),
    (error) =>
      error instanceof MemberUpdateRepositoryError &&
      error.code === 'PROFILE_UPDATE_FAILED'
  )
})


// ATOMIC MEMBER DETAILS UPDATE TESTS

function createAtomicSupabase({
  data = {
    member: {
      id: 'member-123',
      name: 'Mia Santos',
      email: 'mia@example.com',
      phone_number: '09991234567'
    },
    subscription_id: 'subscription-123',
    plan_changed: false
  },
  error = null
} = {}) {
  const calls = []

  return {
    calls,
    async rpc(functionName, args) {
      calls.push({ functionName, args })
      return { data, error }
    }
  }
}

test('atomically updates profile without changing membership plan', async () => {
  const supabase = createAtomicSupabase()
  const repository = new MemberUpdateRepository(supabase)

  const result = await repository.updateDetailsAtomic({
    actorId: 'admin-123',
    memberId: 'member-123',
    input: {
      name: 'Mia Santos',
      email: 'mia@example.com',
      phone: '09991234567',
      plan: 'Monthly'
    },
    planChanged: false
  })

  assert.equal(result.updatedProfile.name, 'Mia Santos')
  assert.equal(result.planChanged, false)

  assert.deepEqual(supabase.calls[0], {
    functionName: 'update_fitpulse_member_details_atomic',
    args: {
      p_actor_id: 'admin-123',
      p_member_id: 'member-123',
      p_name: 'Mia Santos',
      p_phone: '09991234567',
      p_plan_name: null
    }
  })
})

test('sends the new plan when membership changes', async () => {
  const supabase = createAtomicSupabase({
    data: {
      member: {
        id: 'member-123',
        name: 'Mia Cruz',
        email: 'mia@example.com',
        phone_number: null
      },
      subscription_id: 'subscription-123',
      plan_changed: true
    }
  })

  const repository = new MemberUpdateRepository(supabase)

  const result = await repository.updateDetailsAtomic({
    actorId: 'admin-123',
    memberId: 'member-123',
    input: {
      name: 'Mia Cruz',
      email: 'mia@example.com',
      phone: '',
      plan: 'Quarterly'
    },
    planChanged: true
  })

  assert.equal(
    supabase.calls[0].args.p_plan_name,
    'Quarterly'
  )

  assert.equal(result.planChanged, true)
  assert.equal(result.subscriptionId, 'subscription-123')
})

test('reports an atomic database update failure', async () => {
  const supabase = createAtomicSupabase({
    data: null,
    error: {
      message: 'Membership plan unavailable',
      code: 'P0001'
    }
  })

  const repository = new MemberUpdateRepository(supabase)

  await assert.rejects(
    () => repository.updateDetailsAtomic({
      actorId: 'admin-123',
      memberId: 'member-123',
      input: {
        name: 'Mia Cruz',
        phone: '',
        plan: 'Invalid Plan'
      },
      planChanged: true
    }),
    (error) =>
      error instanceof MemberUpdateRepositoryError &&
      error.code === 'DETAILS_UPDATE_FAILED'
  )
})
