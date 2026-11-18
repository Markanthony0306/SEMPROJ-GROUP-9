import assert from 'node:assert/strict'
import test from 'node:test'
import { networkErrorCode } from './networkErrors.js'

test('identifies refused OCR connections and DNS failures from fetch causes', () => {
  assert.equal(networkErrorCode(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } })), 'ECONNREFUSED')
  assert.equal(networkErrorCode({ cause: { errors: [{ code: 'ENOTFOUND' }] } }), 'ENOTFOUND')
  assert.equal(networkErrorCode({ name: 'TimeoutError' }), 'ETIMEDOUT')
})

test('extracts only known connection codes from PostgREST details', () => {
  assert.equal(networkErrorCode({ code: '', details: 'Caused by: getaddrinfo ENOTFOUND private-host' }), 'ENOTFOUND')
  assert.equal(networkErrorCode({ code: '42501', details: 'private provider details' }), '')
  assert.equal(networkErrorCode({}), '')
})
