import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionAuth } from './sessionAuth.js'

const makeAccount = (overrides = {}) => ({
  id: 'test-user', name: 'Test User', email: 'member@example.test', role: 'member',
  plan: 'Monthly', status: 'active', authVersion: 2,
  phone: '', joined: null, avatarId: '', membershipStart: null,
  membershipEnd: null, mustChangePassword: false, ...overrides
})
const response = () => ({
  statusCode: 200, data: undefined,
  status(code) { this.statusCode = code; return this },
  json(value) { this.data = value; return this }
})
const middleware = (account) => createSessionAuth({
  jwtSecret: 'test-key-used-only-for-unit-tests',
  loadAccount: async () => account,
  membershipStatus: () => 'active'
})
const request = (token, path = '/api/me', method = 'GET') => ({
  headers: { authorization: token ? `Bearer ${token}` : '' }, path, method,
  ip: '127.0.0.1', baseUrl: '', route: { path }
})

test('session middleware rejects missing credentials', async () => {
  const auth=middleware(makeAccount()), req=request(null), res=response()
  let nextCount=0
  await auth.authenticate(req,res,()=>nextCount++)
  assert.equal(res.statusCode,401)
  assert.equal(nextCount,0)
})

test('active member token continues with current role', async () => {
  const account=makeAccount(), auth=middleware(account), req=request(auth.createSession(account).token), res=response()
  let called=false
  await auth.authenticate(req,res,()=>{called=true})
  assert.equal(called,true)
  assert.equal(req.user.role,'member')
  assert.equal(res.statusCode,200)
})

test('session invalidated when account version increments or account deactivates', async () => {
  const account=makeAccount(), auth=middleware(account), token=auth.createSession(account).token
  account.authVersion=3
  const res=response()
  await auth.authenticate(request(token),res,()=>{})
  assert.equal(res.statusCode,401)
  account.authVersion=2
  account.status='inactive'
  const res2=response()
  await auth.authenticate(request(token),res2,()=>{})
  assert.equal(res2.statusCode,401)
})

test('temporary password permits only current-user and change-password endpoints', async () => {
  const account=makeAccount({mustChangePassword:true}), auth=middleware(account), token=auth.createSession(account).token
  const cases=[['GET','/api/me',true],['POST','/api/profile/change-password',true],['GET','/api/payments',false]]
  for(const [method,path,allowed] of cases){
    let called=false
    const res=response()
    await auth.authenticate(request(token,path,method),res,()=>{called=true})
    assert.equal(called,allowed)
    if(!allowed){assert.equal(res.statusCode,403);assert.equal(res.data.code,'PASSWORD_CHANGE_REQUIRED')}
  }
})

test('admin route permissions and rate limits retain existing behavior', () => {
  const auth=middleware(makeAccount()), denied=response()
  auth.requireRole('admin')({user:{role:'member'}},denied,()=>{throw new Error('must reject')})
  assert.equal(denied.statusCode,403)
  let nextCount=0
  const limit=auth.rateLimit({max:1})
  const req={ip:'198.51.100.5',method:'GET',baseUrl:'',route:{path:'/api/test'},path:'/api/test'}
  limit(req,response(),()=>nextCount++)
  const exceeded=response()
  limit(req,exceeded,()=>nextCount++)
  assert.equal(nextCount,1)
  assert.equal(exceeded.statusCode,429)
})
