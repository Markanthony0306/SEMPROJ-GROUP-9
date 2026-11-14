import assert from 'node:assert/strict'
import { test } from 'node:test'
import faceApi from 'face-api.js'
import sharp from 'sharp'
import {
  FACE_EVIDENCE_COUNT, FACE_FRAME_BYTES, FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH,
  createFaceGestureSequence, estimateFaceYaw, faceActions
} from '../shared/faceLiveness.js'
import { encryptFaceDescriptor, FACE_MATCH_THRESHOLD, facesMatch } from '../server/lib/face-auth.js'
import { faceVerificationRoutes } from '../server/routes/faceVerification.js'
import { memberIdVerificationRoutes } from '../server/routes/memberIdVerification.js'
import { saveMemberIdFiles } from '../server/services/memberIdRecords.js'
import { passwordLoginHandler } from '../server/routes/passwordLogin.js'
import {
  createFaceAttemptLock, createFaceChallenges, readLiveFace, saveFaceEnrollment
} from '../server/services/faceVerification.js'

const blank = Buffer.alloc(FACE_FRAME_BYTES).toString('base64')
const descriptor = (first) => [first, ...Array(127).fill(0.02)]

test('the real model rejects a blank camera frame', async () => {
  const frames = Array.from({ length: FACE_EVIDENCE_COUNT }, (_, index) =>
    index ? Buffer.alloc(FACE_FRAME_BYTES, index).toString('base64') : blank)
  await assert.rejects(readLiveFace(frames, faceActions), { code: 'FACE_NOT_DETECTED' })
  await assert.rejects(readLiveFace(['invalid-image', ...frames.slice(1)], faceActions), { code: 'FACE_CAPTURE_INVALID' })
})

function faceLandmarks(gesture, shift = 0) {
  const eye = (left) => {
    const x = left + shift
    const aperture = gesture === 'blink' ? 0.5 : 1.7
    return [
      { x, y: 66 },
      { x: x + 3, y: 66 - aperture },
      { x: x + 7, y: 66 - aperture },
      { x: x + 10, y: 66 },
      { x: x + 7, y: 66 + aperture },
      { x: x + 3, y: 66 + aperture }
    ]
  }
  const offset = gesture === 'left' ? 16 : gesture === 'right' ? -16 : 0
  return {
    shiftBy() { return this },
    getLeftEye: () => eye(77),
    getRightEye: () => eye(125),
    getNose: () => [{ x: 106, y: 83 }, { x: 106, y: 87 }, { x: 106, y: 91 }, { x: 106 + offset + shift, y: 94 }],
    getMouth: () => [{ x: 98, y: 109 }, { x: 116, y: 114 }],
    align: () => new faceApi.Box({ x: 48, y: 24, width: 120, height: 116 })
  }
}

const gestureFrames = (actions) => [
  null,
  ...actions.flatMap((action) => action === 'blink'
    ? Array.from({ length: 3 }, () => ['blink', 'blink', null]).flat()
    : [action, null])
]

test('blink counts only on reopening after two closed samples and a shift is not a turn', () => {
  const sequence = createFaceGestureSequence(['blink', 'right', 'left'])
  const sample = (gesture, shift) => sequence.observe(faceLandmarks(gesture, shift), () => gesture)
  sample(null)
  sample('blink')
  sample(null)
  assert.equal(sequence.blinks, 0)
  for (let index = 0; index < 3; index += 1) {
    for (let closed = 0; closed < 5; closed += 1) sample('blink')
    assert.equal(sequence.blinks, index)
    sample(null)
    sample(null)
    assert.equal(sequence.blinks, index + 1)
  }
  assert.equal(estimateFaceYaw(faceLandmarks(null, 15)), 0)
  sample(null, 15)
  sample('left')
  sample(null)
  assert.equal(sequence.step, 'right')
  sample('right')
  sample(null)
  sample('left')
  sample(null)
  assert.equal(sequence.complete, true)
  assert.equal(sequence.evidence.length, FACE_EVIDENCE_COUNT)
})

test('the shared match cutoff rejects distances above the threshold', () => {
  assert.ok(facesMatch(descriptor(0), descriptor(FACE_MATCH_THRESHOLD)))
  assert.ok(!facesMatch(descriptor(0), descriptor(FACE_MATCH_THRESHOLD + 0.01)))
  assert.ok(!facesMatch(descriptor(0), null))
})

test('admin skips Terms, member keeps Terms, and the API gates sessions on live and ID matches', async (t) => {
  // Supply deterministic model outputs for the protocol tests. The test above
  // independently exercises the installed detector against real frame bytes.
  const { tinyFaceDetector, faceLandmark68TinyNet, faceRecognitionNet } = faceApi.nets
  const size = new faceApi.Dimensions(FACE_FRAME_WIDTH, FACE_FRAME_HEIGHT)
  const box = new faceApi.Box({ x: 0.2, y: 0.12, width: 0.56, height: 0.76 })
  const detected = new faceApi.FaceDetection(0.97, box, size)
  const closer = new faceApi.FaceDetection(0.97, new faceApi.Box({ x: 0.13, y: 0.04, width: 0.72, height: 0.92 }), size)
  let mode = 'clear'
  let activeGestures = []
  let frameIndex = 0
  let identity = 0.2
  let useCloseShot = false
  t.mock.method(tinyFaceDetector, 'locateFaces', async (_tensor, options) => {
    if (mode === 'error') throw new Error('Synthetic model failure')
    if (mode === 'multiple') return [detected, detected]
    if (mode === 'unclear') return [new faceApi.FaceDetection(0.6, box, size)]
    frameIndex += 1
    if (options.inputSize === 608)
      return [new faceApi.FaceDetection(0.97, box, new faceApi.Dimensions(320, 240))]
    if (useCloseShot && frameIndex === FACE_EVIDENCE_COUNT + 1) return [closer]
    return [detected]
  })
  t.mock.method(faceLandmark68TinyNet, 'detectLandmarks', async () =>
    faceLandmarks(mode === 'static' ? null : activeGestures[frameIndex - 1]))
  t.mock.method(faceRecognitionNet, 'computeFaceDescriptor', async () =>
    Float32Array.from(descriptor(identity))
  )

  const key = Buffer.alloc(32, 17)
  const enrolled = encryptFaceDescriptor(descriptor(0.2), key)
  const mismatch = encryptFaceDescriptor(descriptor(0.85), key)
  const admin = {
    id: 'a',
    authUserId: 'auth-admin',
    authVersion: 0,
    role: 'admin',
    status: 'active',
    email: 'admin@fixture.test'
  }
  const member = {
    id: 'm',
    authUserId: 'auth-member',
    authVersion: 0,
    role: 'user',
    status: 'active',
    email: 'member@fixture.test'
  }
  const adminEnrollment = {
    enrollment_id: 'enrollment-a',
    user_id: admin.id,
    status: 'active',
    descriptor_encrypted: enrolled,
    id_portrait_encrypted: enrolled
  }
  const memberEnrollment = {
    enrollment_id: 'enrollment-m',
    user_id: member.id,
    status: 'active',
    descriptor_encrypted: enrolled
  }
  const newCase = {
    id: 'a324e290-015b-4fb3-9d8a-df43e7fb0982',
    member_id: null, revision: 1, applicant_email: 'new@fixture.test',
    opened_by: admin.id, document_passed: true,
    verification_status: 'awaiting_face', has_documents: true, face_enrolled: false, reasons: []
  }
  const tables = {
    users: [admin, member].map((account) => ({
      ...account,
      auth_user_id: account.authUserId,
      role_id: account.id
    })),
    roles: [
      { role_id: admin.id, role_name: 'admin' },
      { role_id: member.id, role_name: 'member' }
    ],
    face_enrollments: [adminEnrollment, memberEnrollment],
    member_id_verifications: [newCase],
    member_id_verification_files: []
  }
  const supabase = {
    from(table) {
      let rows = tables[table]
      let changes
      return {
        select() {
          return this
        },
        eq(key, value) {
          rows = rows.filter((row) => row[key] === value)
          return this
        },
        is(key, value) {
          return this.eq(key, value)
        },
        in(key, values) {
          rows = rows.filter((row) => values.includes(row[key]))
          return this
        },
        update(value) {
          changes = value
          return this
        },
        not(key, operator, value) {
          assert.equal(operator, 'is')
          rows = rows.filter((row) => row[key] !== value)
          return this
        },
        limit(count) {
          rows = rows.slice(0, count)
          return this
        },
        order(key) {
          rows = [...rows].sort((a, b) => a[key].localeCompare(b[key]))
          return this
        },
        async range(start, end) {
          return { data: rows.slice(start, end + 1) }
        },
        async maybeSingle() {
          if (changes && rows[0]) Object.assign(rows[0], changes, { revision: rows[0].revision + 1 })
          return { data: rows[0] || null }
        }
      }
    },
    async rpc(name, args) {
      if (name === 'save_fitpulse_member_id_files') {
        tables.member_id_verification_files = args.p_files.map((file) => ({
          verification_id: args.p_id,
          side: file.side,
          mime_type: file.mime_type,
          encrypted_file: '\\x' + Buffer.from(file.ciphertext, 'base64').toString('hex')
        }))
        return { data: true }
      }
      assert.equal(name, 'save_fitpulse_face_enrollment')
      assert.equal(args.p_user_id, admin.id)
      assert.deepEqual(args.p_checked_ids, ['enrollment-a', 'enrollment-m'])
      adminEnrollment.descriptor_encrypted = args.p_encrypted_descriptor
      adminEnrollment.id_portrait_encrypted = args.p_admin_id_portrait ?? adminEnrollment.id_portrait_encrypted
      return { data: true }
    }
  }
  const createAuthClient = () => ({
    auth: {
      signInWithPassword: async ({ email }) => ({
        data: {
          user: { id: [admin, member].find((account) => account.email === email).authUserId }
        }
      })
    }
  })
  let clock = Date.now()
  const challenges = createFaceChallenges(() => clock)
  const claim = (account) => ({
    userId: account.id,
    authVersion: account.authVersion,
    role: account.role
  })
  const loadAccount = async (id) => [admin, member].find((account) => account.id === id)
  const pass = (_req, _res, next) => next()
  const loginHandler = passwordLoginHandler({
    supabase,
    createAuthClient,
    loadAccount,
    createSession: (account, options) => {
      assert.deepEqual(options, { allowUnenrolledAdmin: true })
      return { token: 'password-session-fixture', user: { id: account.id } }
    },
    createAdminFaceChallenge: (account) =>
      challenges.issue(claim(account)),
    createTermsChallenge: (account) => challenges.issueTerms(claim(account))
  })
  let sessions = 0
  const router = faceVerificationRoutes({
    supabase,
    loadAccount,
    createAuthClient,
    challenges,
    reserveAttempt: createFaceAttemptLock(() => clock),
    key,
    memberIdKey: key,
    staffFaceEnabled: false,
    authenticate: pass,
    requireRole: () => pass,
    rateLimit: () => pass,
    createSession: (account, options) => {
      assert.equal(options?.faceVerified, true)
      sessions += 1
      return { token: 'signed-session-fixture', user: { id: account.id } }
    }
  })
  const memberRouter = memberIdVerificationRoutes({
    supabase, challenges, key, faceKey: key, authenticate: pass, rateLimit: () => pass,
    requireRole: (...roles) => (req, res, next) =>
      roles.includes(req.user.role) ? next() : res.status(403).json({})
  })
  const request = async (route, body, options) => {
    const response = { status: 200 }
    const res = {
      set(name, value) {
        if (name === 'Retry-After') response.retryAfter = value
        return this
      },
      status(code) {
        response.status = code
        return this
      },
      json(payload) {
        Object.assign(response, payload)
        return this
      }
    }
    const handlers =
      route === '/auth/login'
        ? [loginHandler]
        : [...router.stack, ...memberRouter.stack]
            .find((layer) => layer.route.path === route)
            .route.stack.map((layer) => layer.handle)
    const req = { body, ...options }
    for (const handler of handlers) {
      let continueRoute = false
      await handler(req, res, () => {
        continueRoute = true
      })
      if (!continueRoute) break
    }
    return response
  }
  const login = (account) =>
    request('/auth/login', { email: account.email, password: 'fixture-password' })
  const allFrames = Array.from({ length: FACE_EVIDENCE_COUNT + 1 }, (_, seed) => {
    const bytes = Buffer.alloc(FACE_FRAME_BYTES)
    for (let index = 0; index < bytes.length; index += 1)
      bytes[index] = 100 + (index % 17) * 4 + seed
    return bytes.toString('base64')
  })
  const frames = allFrames.slice(0, FACE_EVIDENCE_COUNT)
  const verify = (challenge, sample = frames) => {
    activeGestures = gestureFrames(challenge.actions)
    frameIndex = 0
    return request('/auth/face-verify', {
      challengeToken: challenge.challengeToken,
      frames: sample
    })
  }

  const direct = await login(admin)
  assert.equal(direct.requiresTermsAcceptance, undefined)
  assert.equal(direct.requiresFaceVerification, true)
  assert.deepEqual([...direct.actions].sort(), ['blink', 'left', 'right'])
  assert.equal(direct.token, undefined)
  assert.equal(
    (await request('/auth/accept-terms', { termsToken: direct.challengeToken, accepted: true }))
      .status,
    401
  )

  for (const [failedMode, code] of [
    ['static', 'FACE_LIVENESS_FAILED'],
    ['multiple', 'FACE_MULTIPLE'],
    ['unclear', 'FACE_UNCLEAR'],
    ['error', 'FACE_SERVICE_UNAVAILABLE']
  ]) {
    const challenge = await login(admin)
    mode = failedMode
    const failure = await verify(challenge)
    assert.equal(failure.code, code)
    assert.equal(failure.token, undefined)
    assert.equal((await verify(challenge)).status, 401)
  }
  mode = 'clear'
  assert.equal(
    (await verify(await login(admin), Array(FACE_EVIDENCE_COUNT).fill(frames[0]))).code,
    'FACE_LIVENESS_FAILED'
  )
  assert.equal((await verify(await login(admin), frames.slice(0, 3))).code, 'FACE_CAPTURE_INVALID')
  const lockedChallenge = await login(admin)
  const locked = await verify(lockedChallenge)
  assert.equal(locked.status, 429)
  assert.equal(locked.code, 'FACE_ATTEMPT_LIMIT')
  assert.equal(locked.retryAfter, '900')
  assert.equal(locked.token, undefined)
  assert.equal((await verify(lockedChallenge)).status, 401)
  clock += 15 * 60_000
  const fresh = await login(admin)
  adminEnrollment.descriptor_encrypted = mismatch
  assert.equal((await verify(await login(admin))).code, 'FACE_MISMATCH')
  adminEnrollment.descriptor_encrypted = enrolled
  adminEnrollment.id_portrait_encrypted = mismatch
  assert.equal((await verify(await login(admin))).code, 'FACE_MISMATCH')
  adminEnrollment.id_portrait_encrypted = null
  assert.equal((await verify(await login(admin))).code, 'ID_UNREADABLE')
  assert.equal(sessions, 0)

  const terms = await login(member)
  assert.equal(terms.requiresTermsAcceptance, true)
  assert.equal(terms.challengeToken, undefined)
  assert.equal(terms.token, undefined)
  const accepted = await request('/auth/accept-terms', {
    termsToken: terms.termsToken,
    accepted: true
  })
  assert.equal(accepted.requiresFaceVerification, true)
  assert.deepEqual([...accepted.actions].sort(), ['blink', 'left', 'right'])
  assert.equal(accepted.token, undefined)
  assert.equal((await verify(accepted)).code, 'ID_UNREADABLE')
  assert.equal(sessions, 0)

  adminEnrollment.id_portrait_encrypted = enrolled
  const success = await verify(fresh)
  assert.equal(success.status, 200)
  assert.equal(success.token, undefined)
  assert.equal(sessions, 0)
  const redeem = (verificationToken) => request('/auth/face-session', { verificationToken })
  assert.equal((await redeem(fresh.challengeToken)).status, 401)
  assert.equal((await redeem(success.verificationToken)).user.id, admin.id)
  assert.equal(sessions, 1)
  assert.equal((await redeem(success.verificationToken)).status, 401)
  assert.equal((await verify(fresh)).status, 401)
  const expiredProof = await verify(await login(admin))
  clock += 30_000
  assert.equal((await redeem(expiredProof.verificationToken)).status, 401)
  const replacedProof = await verify(await login(admin))
  adminEnrollment.enrollment_id = 'new-enrollment-a'
  assert.equal((await redeem(replacedProof.verificationToken)).status, 403)
  adminEnrollment.enrollment_id = 'enrollment-a'

  const idOnly = { userId: admin.id, descriptor: null, key, adminIdPortrait: descriptor(0.2) }
  await assert.rejects(saveFaceEnrollment(supabase, idOnly), { code: 'FACE_ALREADY_ENROLLED' })
  adminEnrollment.descriptor_encrypted = null
  memberEnrollment.descriptor_encrypted = mismatch
  await saveFaceEnrollment(supabase, idOnly)
  const beforeEnrollment = await login(admin)
  assert.equal(beforeEnrollment.requiresFaceVerification, undefined)
  assert.ok(beforeEnrollment.token)

  const path = '/admin/members/:id/face-enrollment'
  const requestOptions = { params: { id: admin.id }, user: { ...admin, faceVerified: false } }
  const capture = await request(path + '/challenge', {}, requestOptions)
  activeGestures = gestureFrames(capture.actions)
  frameIndex = 0
  const registered = await request(path, {
    challengeToken: capture.challengeToken,
    consent: true,
    currentPassword: 'fixture-password',
    frames
  }, requestOptions)
  assert.equal(registered.status, 201, registered.message)
  assert.equal(registered.signInRequired, true)
  const afterEnrollment = await login(admin)
  assert.equal(afterEnrollment.requiresFaceVerification, true)
  assert.equal(afterEnrollment.token, undefined)
  assert.equal((await verify(afterEnrollment)).status, 200)

  const enrollPath = '/admin/id-verifications/:id/face'
  const caseOptions = { params: { id: newCase.id }, user: admin }
  const png = await sharp({ create: { width: 320, height: 240, channels: 3, background: '#aaa' } }).png().toBuffer()
  await saveMemberIdFiles(supabase, key, newCase.id, admin.id, 'student_id', [
    { side: 'front', mimeType: 'image/png', bytes: png }
  ], newCase.revision)
  const enroll = async ({ reorder = false, closer = true } = {}) => {
    const capture = await request(enrollPath + '/challenge', {}, caseOptions)
    activeGestures = gestureFrames(reorder ? [...capture.actions].reverse() : capture.actions)
    frameIndex = 0
    useCloseShot = closer
    return request(enrollPath, { challengeToken: capture.challengeToken, frames: allFrames }, caseOptions)
  }
  assert.equal((await enroll({ reorder: true })).code, 'FACE_LIVENESS_FAILED')
  assert.equal((await enroll({ closer: false })).code, 'FACE_TOO_FAR')
  assert.equal((await enroll()).code, 'FACE_ALREADY_ENROLLED')
  assert.equal(newCase.face_enrolled, false)
  identity = -0.45
  assert.equal((await enroll()).code, 'FACE_MISMATCH')
  // Save a new copy so the ID portrait cache recalculates the test descriptor.
  await saveMemberIdFiles(supabase, key, newCase.id, admin.id, 'student_id', [
    { side: 'front', mimeType: 'image/png', bytes: png }
  ], newCase.revision)
  const staged = await enroll()
  assert.equal(staged.status, 200)
  assert.equal(staged.faceEnrolled, true)
  assert.ok(newCase.staged_face_encrypted)
  assert.ok(!JSON.stringify(staged).includes(newCase.staged_face_encrypted))
})
