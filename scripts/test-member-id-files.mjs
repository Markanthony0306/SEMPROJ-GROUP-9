import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import sharp from 'sharp'
import { memberIdVerificationRoutes } from '../server/routes/memberIdVerification.js'
import { memberIdFileLimit } from '../shared/memberIdTypes.js'
import {
  memberIdFileType,
  memberIdFrontImage,
  validateMemberIdFiles
} from '../server/services/memberIdFiles.js'
import { checkIdAttemptLimit, requireMemberIdApproval } from '../server/services/memberIdRecords.js'

const scan = async (ink) =>
  sharp(
    Buffer.from(`<svg width="420" height="260">
  <rect width="420" height="260" fill="#eee"/>
  <rect width="300" height="150" x="40" y="40" fill="${ink}"/>
</svg>`)
  )
    .png()
    .toBuffer()

const file = (side, bytes) => ({ side, bytes, mimeType: memberIdFileType(bytes) })

function storedZip(entries) {
  const local = []
  const central = []
  let offset = 0
  for (const [name, contents] of Object.entries(entries)) {
    const bytes = Buffer.from(contents)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50)
    header.writeUInt32LE(bytes.length, 18)
    header.writeUInt32LE(bytes.length, 22)
    header.writeUInt16LE(name.length, 26)
    local.push(header, Buffer.from(name), bytes)
    const reference = Buffer.alloc(46)
    reference.writeUInt32LE(0x02014b50)
    reference.writeUInt32LE(bytes.length, 20)
    reference.writeUInt32LE(bytes.length, 24)
    reference.writeUInt16LE(name.length, 28)
    reference.writeUInt32LE(offset, 42)
    central.push(reference, Buffer.from(name))
    offset += header.length + name.length + bytes.length
  }
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50)
  eocd.writeUInt16LE(central.length / 2, 8)
  eocd.writeUInt16LE(central.length / 2, 10)
  eocd.writeUInt32LE(Buffer.concat(central).length, 12)
  eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, ...central, eocd])
}

function wordDoc(...images) {
  // Header + FAT + directory + 8192-byte WordDocument stream.
  const bytes = Buffer.alloc(19 * 512)
  Buffer.from('d0cf11e0a1b11ae1', 'hex').copy(bytes)
  bytes.writeUInt16LE(0xfffe, 28)
  bytes.writeUInt16LE(9, 30)
  bytes.writeUInt32LE(1, 44)
  bytes.writeUInt32LE(1, 48)
  const fat = bytes.subarray(512, 1024)
  fat.writeUInt32LE(0xfffffffd, 0)
  fat.writeUInt32LE(0xfffffffe, 4)
  for (let sector = 2; sector < 17; sector += 1) fat.writeUInt32LE(sector + 1, sector * 4)
  fat.writeUInt32LE(0xfffffffe, 68)
  const directory = bytes.subarray(1024, 1536)
  directory.write('Root Entry', 0, 'utf16le')
  directory.writeUInt16LE(22, 64)
  directory[66] = 5
  directory.write('WordDocument', 128, 'utf16le')
  directory.writeUInt16LE(26, 192)
  directory[194] = 2
  directory.writeUInt32LE(2, 244)
  directory.writeBigUInt64LE(8192n, 248)
  bytes.writeUInt16LE(0xa5ec, 1536)
  Buffer.concat(images).copy(bytes, 1600)
  return bytes
}

function pdf(streams) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Count ${streams.length} /Kids [${streams.map((_, index) => `${index * 2 + 3} 0 R`).join(' ')}] >>`,
    ...streams.flatMap((stream, index) => [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 600] /Contents ${index * 2 + 4} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    ])
  ]
  let source = '%PDF-1.4\n'
  const offsets = objects.map((object, index) => {
    const offset = source.length
    source += `${index + 1} 0 obj\n${object}\nendobj\n`
    return offset
  })
  const xref = source.length
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  source += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(source)
}

test('the server requires two distinct decodable images, correct MIME, and a 5 MiB limit', async () => {
  const front = file('front', await scan('#15599b'))
  const back = file('back', await scan('#790938'))
  await validateMemberIdFiles([front, back])
  await assert.rejects(validateMemberIdFiles([front]), /front and one of the back/)
  await assert.rejects(validateMemberIdFiles([front, { ...front, side: 'back' }]), /unreadable/)
  await assert.rejects(
    validateMemberIdFiles([{ ...front, mimeType: 'image/jpeg' }, back]),
    /Upload JPG/
  )
  await assert.rejects(
    validateMemberIdFiles([{ ...front, bytes: Buffer.alloc(memberIdFileLimit + 1) }, back]),
    /5 MB/
  )
  await assert.rejects(
    validateMemberIdFiles([front, file('back', await scan('#fff'))]),
    /unreadable/
  )
})

test('Word containers must contain both sides and a real Word document structure', async () => {
  const front = await scan('#15599b')
  const back = await scan('#790938')
  const contents = {
    '[Content_Types].xml':
      '<Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    'word/document.xml':
      '<w:document><a:blip r:embed="first"/><a:blip r:embed="second"/></w:document>',
    'word/_rels/document.xml.rels':
      '<Relationships><Relationship Id="first" Target="media/front.png"/><Relationship Id="second" Target="media/back.png"/></Relationships>',
    'word/media/front.png': front,
    'word/media/back.png': back
  }
  for (const container of [storedZip(contents), wordDoc(front, back)]) {
    const document = file('document', container)
    await validateMemberIdFiles([document])
    const decoded = await memberIdFrontImage(document)
    assert.equal((await sharp(decoded).metadata()).width, 420)
  }
  const fakeWord = wordDoc(front, back)
  fakeWord.writeUInt16LE(0, 1536)
  await assert.rejects(validateMemberIdFiles([file('document', fakeWord)]), /Upload JPG/)
  await assert.rejects(
    validateMemberIdFiles([
      file(
        'document',
        storedZip({
          ...contents,
          'word/document.xml': '<w:document><a:blip r:embed="first"/></w:document>'
        })
      )
    ]),
    /unreadable/
  )
})

let hasPdfRenderer
try {
  execFileSync(process.env.ID_PDF_RENDERER || 'pdftoppm', ['-v'], { stdio: 'ignore' })
  hasPdfRenderer = true
} catch {
  hasPdfRenderer = false
}
test(
  'PDF validation accepts two pages or separated sides on one page',
  { skip: !hasPdfRenderer },
  async () => {
    const upper = '0.1 0.3 0.6 rg 50 340 400 210 re f'
    const lower = '0.5 0.2 0.1 rg 50 50 400 210 re f'
    await validateMemberIdFiles([file('document', pdf([upper, lower]))])
    await validateMemberIdFiles([file('document', pdf([upper + '\n' + lower]))])
    await assert.rejects(validateMemberIdFiles([file('document', pdf([upper]))]), /unreadable/)
    await assert.rejects(validateMemberIdFiles([file('document', pdf([upper, '']))]), /unreadable/)
    await assert.rejects(
      validateMemberIdFiles([file('document', Buffer.from('%PDF-1.7 fake'))]),
      /unreadable/
    )
  }
)

test('the normalized email limit is checked before any approval lookup or create', async () => {
  const supabase = {
    from(table) {
      assert.equal(table, 'member_id_rejected_emails')
      return {
        select: () => ({
          eq(column, email) {
            assert.equal(column, 'email')
            assert.equal(email, 'member@example.com')
            return { maybeSingle: async () => ({ data: { rejected_attempts: 5 } }) }
          }
        })
      }
    }
  }
  const email = ' Member@Example.com '
  const blocked = { status: 409, code: 'ID_ATTEMPT_LIMIT' }
  await assert.rejects(checkIdAttemptLimit(supabase, email), blocked)
  await assert.rejects(requireMemberIdApproval(supabase, {}, { email }), blocked)
})

test('review decisions report remaining attempts and only an admin can delete or reset them', async () => {
  const email = 'member@example.com'
  let attempts = 4
  let review = {
    id: '11111111-1111-4111-8111-111111111111',
    revision: 1,
    member_id: null,
    applicant_email: email,
    opened_by: 'staff',
    has_documents: true,
    verification_status: 'needs_review'
  }
  const supabase = {
    from(table) {
      let changes
      let deleting = false
      let matches = true
      return {
        select() {
          return this
        },
        eq(column, value) {
          if (table === 'member_id_verifications') matches &&= review?.[column] === value
          return this
        },
        is() {
          return this
        },
        update(values) {
          changes = values
          return this
        },
        delete() {
          deleting = true
          return this
        },
        async maybeSingle() {
          if (table === 'member_id_rejected_emails')
            return { data: { rejected_attempts: attempts } }
          if (!matches) return { data: null }
          if (changes) {
            assert.equal(changes.event, 'manual_reject')
            attempts += 1 // stand-in for the atomic SQL trigger
            review = { ...review, ...changes, revision: review.revision + 1 }
          }
          const data = review
          if (deleting) review = null
          return { data }
        }
      }
    },
    async rpc(name, values) {
      assert.equal(name, 'reset_fitpulse_id_rejections')
      assert.equal(values.p_actor, 'admin')
      assert.equal(values.p_email, email)
      attempts = 0
      return {}
    }
  }
  const pass = (_req, _res, next) => next()
  const router = memberIdVerificationRoutes({
    supabase,
    authenticate: pass,
    rateLimit: () => pass,
    requireRole:
      (...roles) =>
      (req, res, next) =>
        roles.includes(req.user.role) ? next() : res.status(403).json({})
  })
  const prefix = '/admin/id-verifications'
  const id = review.id
  async function request(method, suffix, role, body) {
    const response = { status: 200 }
    const req = { body, user: { role, id: role }, params: { id } }
    const res = {
      set() {
        return this
      },
      status(code) {
        response.status = code
        return this
      },
      json(payload) {
        Object.assign(response, payload)
      }
    }
    const layer = router.stack.find(
      ({ route }) => route?.path === prefix + suffix && route.methods[method]
    )
    for (const { handle } of layer.route.stack) {
      let next = false
      await handle(req, res, () => {
        next = true
      })
      if (!next) break
    }
    return response
  }
  const rejected = await request('post', '/:id/review', 'admin', {
    decision: 'reject',
    notes: 'ID damaged'
  })
  assert.equal(rejected.verification.rejectedAttempts, 5)
  assert.equal(rejected.verification.remainingAttempts, 0)
  assert.equal(
    (await request('post', '/:id/review', 'admin', { decision: 'reject' })).code,
    'ID_ATTEMPT_LIMIT'
  )
  assert.equal((await request('delete', '/:id', 'staff')).status, 403)
  assert.equal((await request('post', '/reset-attempts', 'staff', { email })).status, 403)
  assert.equal((await request('delete', '/:id', 'admin')).status, 200)
  assert.equal(review, null)
  assert.equal(attempts, 5)
  assert.equal(
    (await request('post', '/reset-attempts', 'admin', { email: ' Member@Example.COM ' })).status,
    200
  )
  assert.equal(attempts, 0)
})
