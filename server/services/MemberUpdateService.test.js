
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MemberUpdateService,
  MemberUpdateError
} from './MemberUpdateService.js'

// Create a service with mock validation functions.
function createService() {
  return new MemberUpdateService({
    validAccountInput(body) {
      const name = String(body.name || '').trim()
      const email = String(body.email || '')
        .trim()
        .toLowerCase()
      const plan = String(body.plan || '').trim()

      if (!name || name.length > 100) {
        return { error: 'Invalid member name.' }
      }

      if (!email.includes('@')) {
        return { error: 'Invalid member email.' }
      }

      if (!plan) {
        return { error: 'Invalid membership plan.' }
      }

      return {
        name,
        email,
        plan,
        phone: String(body.phone || '').trim()
      }
    },

    // Simplified password policy for unit testing.
    passwordPolicy(password) {
      return typeof password === 'string' &&
        password.length >= 8
    },

    passwordPolicyMessage: 'Use a stronger password.'
  })
}

// A sample existing member.
function createMember() {
  return {
    id: 'member-123',
    name: 'Mia Cruz',
    email: 'mia@example.com',
    phone: '09171234567',
    plan: 'Monthly'
  }
}

test('prepares a valid member profile update', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: {
      name: '  Mia Santos  ',
      phone: ' 09991234567 '
    }
  })

  assert.equal(result.input.name, 'Mia Santos')
  assert.equal(result.input.email, 'mia@example.com')
  assert.equal(result.input.phone, '09991234567')
  assert.equal(result.input.plan, 'Monthly')
})

test('preserves existing values when fields are omitted', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: { name: 'Updated Mia' }
  })

  assert.equal(result.input.email, 'mia@example.com')
  assert.equal(result.input.phone, '09171234567')
  assert.equal(result.input.plan, 'Monthly')
})

test('prepares an Auth update when the email changes', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: {
      email: ' NEW@EXAMPLE.COM '
    }
  })

  assert.deepEqual(result.authUpdates, {
    email: 'new@example.com',
    email_confirm: true
  })
})

test('does not update Auth when the email is unchanged', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: {
      email: ' MIA@EXAMPLE.COM '
    }
  })

  assert.deepEqual(result.authUpdates, {})
})

test('prepares a valid password change', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: {
      password: 'StrongPassword123!'
    }
  })

  assert.equal(
    result.authUpdates.password,
    'StrongPassword123!'
  )

  assert.equal(result.passwordChanged, true)
})

test('ignores an empty password', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: {
      password: ''
    }
  })

  assert.deepEqual(result.authUpdates, {})
  assert.equal(result.passwordChanged, false)
})

test('rejects invalid member information', () => {
  const service = createService()

  assert.throws(
    () => service.prepare({
      member: createMember(),
      body: { name: '' }
    }),
    (error) =>
      error instanceof MemberUpdateError &&
      error.status === 400 &&
      error.message === 'Invalid member name.'
  )
})

test('rejects a password that violates the policy', () => {
  const service = createService()

  assert.throws(
    () => service.prepare({
      member: createMember(),
      body: {
        password: '123'
      }
    }),
    (error) =>
      error instanceof MemberUpdateError &&
      error.status === 400 &&
      error.message === 'Use a stronger password.'
  )
})

test('does not modify the original member object', () => {
  const service = createService()
  const member = createMember()
  const original = structuredClone(member)

  service.prepare({
    member,
    body: {
      name: 'Updated Mia',
      email: 'updated@example.com'
    }
  })

  assert.deepEqual(member, original)
})

test('rejects an email already used by another member', () => {
  const service = createService()

  const accounts = [
    createMember(),
    {
      id: 'member-456',
      email: 'taken@example.com'
    }
  ]

  assert.throws(
    () => service.prepare({
      member: createMember(),
      body: {
        email: 'TAKEN@EXAMPLE.COM'
      },
      accounts
    }),
    (error) =>
      error instanceof MemberUpdateError &&
      error.status === 409 &&
      error.message ===
        'An account with this email already exists.'
  )
})

test('allows a member to keep their existing email', () => {
  const service = createService()

  const member = createMember()

  const result = service.prepare({
    member,
    body: {
      name: 'Updated Mia'
    },
    accounts: [member]
  })

  assert.equal(result.input.email, member.email)
})

test('allows an email that no other member uses', () => {
  const service = createService()

  const result = service.prepare({
    member: createMember(),
    body: {
      email: 'available@example.com'
    },
    accounts: [
      createMember(),
      {
        id: 'member-456',
        email: 'another@example.com'
      }
    ]
  })

  assert.equal(
    result.input.email,
    'available@example.com'
  )
})
