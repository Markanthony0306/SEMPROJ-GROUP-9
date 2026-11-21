import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import {
  createSupabaseAccountService,
  getProviderRole
} from '../server/services/supabaseAccounts.js'
import { createMemberCode, ensureMemberCodes } from '../server/services/memberCodes.js'

// These SDK doubles are entirely in memory: no .env, real records, or network requests.
function mockProject() {
  const state = {
    users: [],
    profiles: [],
    roles: [
      { role_id: 1, role_name: 'admin' },
      { role_id: 2, role_name: 'member' },
      { role_id: 5, role_name: 'staff' }
    ],
    writes: [],
    authClients: 0,
    recoveryTokens: new Map(),
    accessTokens: new Map(),
    fail: null
  }
  const successful = (data) => ({ data, error: null })
  const failed = (code) => ({ data: null, error: { code } })
  const clone = (value) => structuredClone(value)

  function query(table) {
    let operation = 'read'
    let attributes
    const predicates = []
    let single = false
    const execute = async () => {
      if (state.fail === operation) {
        state.fail = null
        return failed('test_failure')
      }
      const rows = table === 'users' ? state.profiles : state.roles
      const matches = rows.filter((row) => predicates.every((matchesRow) => matchesRow(row)))
      if (operation !== 'read')
        state.writes.push({ operation, table, attributes: clone(attributes) })
      if (operation === 'insert') {
        const row = { member_code: 'FP-A1B2C3D4', ...clone(attributes) }
        rows.push(row)
        return successful(single ? clone(row) : [clone(row)])
      }
      if (operation === 'update') matches.forEach((row) => Object.assign(row, clone(attributes)))
      if (operation === 'delete') {
        state.profiles = rows.filter((row) => !matches.includes(row))
        return successful(null)
      }
      if (single && matches.length > 1) return failed('multiple_rows')
      return successful(single ? clone(matches[0] || null) : clone(matches))
    }
    const builder = {
      select() {
        return builder
      },
      eq(column, value) {
        predicates.push((row) => row[column] === value)
        return builder
      },
      ilike(column, value) {
        const literal = value.replace(/\\([\\%_])/g, '$1').toLowerCase()
        predicates.push((row) => row[column]?.toLowerCase() === literal)
        return builder
      },
      maybeSingle() {
        single = true
        return execute()
      },
      single() {
        single = true
        return execute()
      },
      insert(input) {
        operation = 'insert'
        attributes = input
        return builder
      },
      update(input) {
        operation = 'update'
        attributes = input
        return builder
      },
      delete() {
        operation = 'delete'
        return builder
      },
      then(resolve, reject) {
        return execute().then(resolve, reject)
      }
    }
    return builder
  }

  const adminClient = {
    from: query,
    auth: {
      admin: {
        async listUsers({ page, perPage }) {
          return successful({
            users: clone(state.users.slice((page - 1) * perPage, page * perPage))
          })
        },
        async getUserById(id) {
          return successful({ user: clone(state.users.find((user) => user.id === id) || null) })
        },
        async createUser(attributes) {
          state.writes.push({ operation: 'createUser', attributes: clone(attributes) })
          if (
            state.users.some((user) => user.id === attributes.id || user.email === attributes.email)
          ) {
            return failed('email_exists')
          }
          const { password, password_hash, ...safe } = attributes
          const user = {
            ...safe,
            id: attributes.id || crypto.randomUUID(),
            encrypted_password: password_hash || (await bcrypt.hash(password, 4))
          }
          state.users.push(user)
          return successful({ user: clone(user) })
        },
        async updateUserById(id, attributes) {
          state.writes.push({ operation: 'updateUser', attributes: clone(attributes), id })
          if (state.fail === 'updateUser') {
            state.fail = null
            return failed('test_failure')
          }
          const user = state.users.find((row) => row.id === id)
          if (!user) return failed('user_not_found')
          const { password, ...safe } = attributes
          Object.assign(user, clone(safe))
          if (password !== undefined) user.encrypted_password = await bcrypt.hash(password, 4)
          return successful({ user: clone(user) })
        },
        async deleteUser(id) {
          state.writes.push({ operation: 'deleteUser', id })
          state.users = state.users.filter((user) => user.id !== id)
          return successful({ user: null })
        },
        async generateLink({ type, email }) {
          assert.equal(type, 'recovery')
          const user = state.users.find((row) => row.email === email)
          const token = crypto.randomUUID()
          state.recoveryTokens.set(token, user.id)
          return successful({ properties: { hashed_token: token }, user: clone(user) })
        }
      }
    }
  }

  function createAuthClient() {
    state.authClients += 1
    return {
      auth: {
        async signInWithPassword({ email, password }) {
          const user = state.users.find((row) => row.email?.toLowerCase() === email.toLowerCase())
          if (!user || !(await bcrypt.compare(password, user.encrypted_password))) {
            return failed('invalid_credentials')
          }
          return successful({
            user: clone(user),
            session: { access_token: 'private-provider-token' }
          })
        },
        async verifyOtp({ token_hash: tokenHash, type }) {
          assert.equal(type, 'recovery')
          const id = state.recoveryTokens.get(tokenHash)
          if (!id) return failed('otp_expired')
          state.recoveryTokens.delete(tokenHash)
          return successful({ user: clone(state.users.find((row) => row.id === id)) })
        },
        async getUser(token) {
          const id = state.accessTokens.get(token)
          return id
            ? successful({ user: clone(state.users.find((row) => row.id === id)) })
            : failed('bad_jwt')
        }
      }
    }
  }
  const service = createSupabaseAccountService({ adminClient, createAuthClient })
  return { state, service, adminClient }
}

const password = 'Existing-password-123'
const existingAccount = {
  id: crypto.randomUUID(),
  name: 'Test Member',
  email: 'test_member@fitpulse.test',
  phone: '09123456789',
  role: 'user',
  memberCode: 'FP-112233',
  must_change_password: true,
  passwordHash: await bcrypt.hash(password, 4)
}
let checks = 0
async function check(name, action) {
  await action()
  checks += 1
  console.log(`PASS ${name}`)
}

await check('Short display codes preserve account UUIDs, existing codes, and staff records', () => {
  const database = {
    accounts: [
      { id: 'uuid-one', role: 'member', memberCode: 'FP-ABCDEF12' },
      { id: 'uuid-two', role: 'user' },
      { id: 'uuid-three', role: 'staff' }
    ]
  }
  assert.equal(ensureMemberCodes(database), true)
  assert.equal(database.accounts[0].memberCode, 'FP-ABCDEF12')
  assert.match(database.accounts[1].memberCode, /^FP-[A-F0-9]{6}$/)
  assert.equal(database.accounts[1].id, 'uuid-two')
  assert.equal(database.accounts[2].memberCode, undefined)
  assert.equal(ensureMemberCodes(database), false)
  assert.notEqual(createMemberCode(database.accounts), database.accounts[1].memberCode)
})

await check('Duplicate display codes are repaired without changing the first existing code', () => {
  const database = {
    accounts: [
      { role: 'member', memberCode: 'FP-ABCDEF' },
      { role: 'user', memberCode: 'FP-abcdef' }
    ]
  }
  ensureMemberCodes(database)
  assert.equal(database.accounts[0].memberCode, 'FP-ABCDEF')
  assert.notEqual(database.accounts[1].memberCode.toUpperCase(), 'FP-ABCDEF')
})

await check('Provider roles allow admin, staff and member; legacy user maps to member', () => {
  assert.equal(getProviderRole('user'), 'member')
  assert.equal(getProviderRole('STAFF'), 'staff')
  assert.equal(getProviderRole('service_role'), null)
})

const project = mockProject()
let linkedAccount
await check(
  'Migration imports only bcrypt hashes and preserves real UUIDs and passwords',
  async () => {
    const before = structuredClone(existingAccount)
    const result = await project.service.importAccount(existingAccount)
    linkedAccount = { ...existingAccount, ...result.accountPatch }
    assert.equal(result.pending, false)
    assert.equal(result.accountPatch.supabaseAuthId, existingAccount.id)
    assert.equal(result.accountPatch.supabaseProfileId, existingAccount.id)
    assert.deepEqual(existingAccount, before)
    const authWrite = project.state.writes.find((write) => write.operation === 'createUser')
    assert.equal(authWrite.attributes.password, undefined)
    assert.equal(authWrite.attributes.password_hash, existingAccount.passwordHash)
    assert.equal(authWrite.attributes.role, undefined)
    assert.equal(authWrite.attributes.app_metadata.fitpulse_role, 'member')
  }
)

await check('Linked imports are read-only and remain idempotent', async () => {
  const writes = project.state.writes.length
  await project.service.importAccount(linkedAccount)
  assert.equal(project.state.writes.length, writes)
})

await check(
  'Import retry recovers its own cloud identity after a lost local mapping save',
  async () => {
    const writes = project.state.writes.length
    const retry = await project.service.importAccount(existingAccount)
    assert.equal(retry.pending, false)
    assert.equal(retry.accountPatch.supabaseAuthId, existingAccount.id)
    assert.equal(retry.accountPatch.supabaseProfileId, existingAccount.id)
    assert.equal(project.state.writes.length, writes)
    assert.equal(project.state.users[0].encrypted_password, existingAccount.passwordHash)
  }
)

await check(
  'An identical cloud profile without trusted import ownership remains pending',
  async () => {
    const originalMarker = project.state.users[0].app_metadata.fitpulse_account_id
    delete project.state.users[0].app_metadata.fitpulse_account_id
    const writes = project.state.writes.length
    assert.deepEqual(await project.service.importAccount(existingAccount), { pending: true })
    assert.equal(project.state.writes.length, writes)
    project.state.users[0].app_metadata.fitpulse_account_id = originalMarker
  }
)

await check(
  'Login uses isolated clients and returns no provider session, hash, or secret',
  async () => {
    const first = await project.service.login(linkedAccount, password)
    await project.service.login(linkedAccount, password)
    assert.equal(project.state.authClients, 2)
    assert.equal(first.user.id, existingAccount.id)
    assert.equal(first.profile.must_change_password, true)
    assert.equal(first.profile.role, 'member')
    assert.equal(JSON.stringify(first).includes('private-provider-token'), false)
    assert.equal(JSON.stringify(first).includes('encrypted_password'), false)
  }
)

await check('Linked bad passwords reject login without a local-password fallback', async () => {
  await assert.rejects(project.service.login(linkedAccount, 'wrong'), { status: 401 })
  assert.equal(await project.service.verifyCurrentPassword(linkedAccount, 'wrong'), false)
  assert.equal(await project.service.verifyCurrentPassword(linkedAccount, password), true)
})

await check(
  'Existing cloud email collisions preserve every remote password and profile',
  async () => {
    const collision = { ...existingAccount, id: crypto.randomUUID() }
    const writes = project.state.writes.length
    assert.deepEqual(await project.service.importAccount(collision), { pending: true })
    assert.deepEqual(await project.service.login(collision, 'different-local-password'), {
      pending: true
    })
    assert.equal(project.state.writes.length, writes)
    const verified = await project.service.login(collision, password)
    assert.equal(verified.accountPatch.supabaseAuthId, existingAccount.id)
    assert.notEqual(verified.accountPatch.supabaseProfileId, collision.id)
    assert.equal(project.state.writes.length, writes)
  }
)

await check(
  'Email collision checks are case-insensitive and treat underscores literally',
  async () => {
    const collision = {
      ...existingAccount,
      id: crypto.randomUUID(),
      email: existingAccount.email.toUpperCase()
    }
    const writes = project.state.writes.length
    assert.deepEqual(await project.service.importAccount(collision), { pending: true })
    assert.equal(project.state.writes.length, writes)
  }
)

await check('Provider role mismatch rejects collision linking and performs no writes', async () => {
  const writes = project.state.writes.length
  await assert.rejects(
    project.service.login({ ...existingAccount, id: crypto.randomUUID(), role: 'admin' }, password),
    {
      status: 403,
      code: 'ROLE_MISMATCH'
    }
  )
  assert.equal(project.state.writes.length, writes)
})

await check('Suspended and archived profiles remain readable but cannot sign in', async () => {
  for (const status of ['suspended', 'archived']) {
    project.state.profiles[0].status = status
    assert.equal((await project.service.loadProfile(linkedAccount)).accountStatus, status)
    await assert.rejects(project.service.login(linkedAccount, password), {
      code: 'ACCOUNT_INACTIVE'
    })
  }
  project.state.profiles[0].status = 'active'
})

await check('Supabase bans are reflected as suspended status and rejected at login', async () => {
  project.state.users[0].banned_until = new Date(Date.now() + 60000).toISOString()
  assert.equal((await project.service.loadProfile(linkedAccount)).accountStatus, 'suspended')
  await assert.rejects(project.service.login(linkedAccount, password), { code: 'ACCOUNT_INACTIVE' })
  delete project.state.users[0].banned_until
})

await check('A mismatched profile ID cannot access another cloud profile', async () => {
  await assert.rejects(
    project.service.loadProfile({ ...linkedAccount, supabaseProfileId: crypto.randomUUID() }),
    {
      code: 'PROFILE_LINK_INVALID'
    }
  )
})

await check('Profile updates preserve trusted roles and synchronize email and phone', async () => {
  const result = await project.service.updateAccount(linkedAccount, {
    name: 'Changed Name',
    email: 'changed@fitpulse.test',
    phone: '',
    role: 'admin',
    role_id: 1
  })
  linkedAccount.email = result.profile.email
  assert.equal(result.profile.name, 'Changed Name')
  assert.equal(result.profile.phone, '')
  assert.equal(project.state.users[0].email, linkedAccount.email)
  assert.equal(project.state.profiles[0].role_id, 2)
})

await check('Profile failure compensates cloud email and profile fields', async () => {
  project.state.fail = 'update'
  await assert.rejects(
    project.service.updateAccount(linkedAccount, { email: 'failure@fitpulse.test', name: 'Wrong' }),
    {
      code: 'PROFILE_UPDATE_FAILED'
    }
  )
  assert.equal(project.state.users[0].email, linkedAccount.email)
  assert.equal(project.state.profiles[0].email, linkedAccount.email)
  assert.equal(project.state.profiles[0].name, 'Changed Name')
})

await check(
  'Password changes are never rolled back by changing the password a second time',
  async () => {
    project.state.fail = 'update'
    const writeCount = project.state.writes.length
    await assert.rejects(project.service.updatePassword(linkedAccount, 'New-password-456'), {
      passwordChanged: true
    })
    assert.equal(
      project.state.writes
        .slice(writeCount)
        .filter((write) => write.operation === 'updateUser' && write.attributes.password).length,
      1
    )
    assert.equal(
      await project.service.verifyCurrentPassword(linkedAccount, 'New-password-456'),
      true
    )
    assert.equal(project.state.profiles[0].must_change_password, true)
    await project.service.updatePassword(linkedAccount, 'Final-password-789')
    assert.equal(project.state.profiles[0].must_change_password, false)
  }
)

await check(
  'Member creation preserves the one-time password requirement and staff role lookup',
  async () => {
    const staff = {
      ...existingAccount,
      id: crypto.randomUUID(),
      email: 'staff@fitpulse.test',
      role: 'staff'
    }
    const result = await project.service.createAccount(staff, 'Temporary-staff-123')
    const profile = project.state.profiles.find(
      (row) => row.id === result.accountPatch.supabaseProfileId
    )
    assert.equal(profile.role_id, 5)
    assert.equal(profile.must_change_password, true)
    await project.service.deleteCreatedAccount(result.accountPatch)
    assert.equal(
      project.state.profiles.some((row) => row.id === staff.id),
      false
    )
    assert.equal(
      project.state.users.some((row) => row.id === staff.id),
      false
    )
  }
)

await check('Failed profile creation removes only the newly-created cloud login', async () => {
  const beforeIds = project.state.users.map((user) => user.id)
  project.state.fail = 'insert'
  await assert.rejects(
    project.service.createAccount(
      { ...existingAccount, id: crypto.randomUUID(), email: 'new@fitpulse.test' },
      'Temporary-123'
    )
  )
  assert.deepEqual(
    project.state.users.map((user) => user.id),
    beforeIds
  )
})

await check('Rollback rejects pre-existing account IDs', async () => {
  const independentService = createSupabaseAccountService({
    adminClient: project.adminClient,
    createAuthClient: () => ({ auth: {} })
  })
  await assert.rejects(independentService.deleteCreatedAccount(linkedAccount), {
    code: 'ROLLBACK_DENIED'
  })
})

await check('Recovery generation and fixed recovery verification use one-time tokens', async () => {
  const token = await project.service.generateRecovery(linkedAccount)
  assert.equal(
    await project.service.verifyRecovery({ tokenHash: token }),
    linkedAccount.supabaseAuthId
  )
  await assert.rejects(project.service.verifyRecovery({ tokenHash: token }), {
    code: 'RECOVERY_INVALID'
  })
})

await check(
  'Ordinary sign-in tokens cannot be used as password recovery authorization',
  async () => {
    function token(method, override = {}) {
      const claims = {
        sub: linkedAccount.supabaseAuthId,
        exp: Math.floor(Date.now() / 1000) + 60,
        amr: [{ method }],
        ...override
      }
      const accessToken = `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
      project.state.accessTokens.set(accessToken, linkedAccount.supabaseAuthId)
      return accessToken
    }
    await assert.rejects(project.service.verifyRecovery({ accessToken: token('password') }), {
      code: 'RECOVERY_INVALID'
    })
    await assert.rejects(project.service.verifyRecovery({ accessToken: token('magiclink') }), {
      code: 'RECOVERY_INVALID'
    })
    await assert.rejects(
      project.service.verifyRecovery({ accessToken: token('recovery', { exp: 1 }) }),
      { code: 'RECOVERY_INVALID' }
    )
    await assert.rejects(
      project.service.verifyRecovery({ accessToken: token('recovery', { amr: 'recovery' }) }),
      { code: 'RECOVERY_INVALID' }
    )
    assert.equal(
      await project.service.verifyRecovery({ accessToken: token('recovery') }),
      linkedAccount.supabaseAuthId
    )
  }
)

console.log(`${checks}/${checks} Supabase account service checks passed.`)
