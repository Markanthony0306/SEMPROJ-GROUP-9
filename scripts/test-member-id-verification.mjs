import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { normalizeIdNumber, namesMatch, parseMemberId } from '../server/services/memberIdParsing.js'
import { protectIdNumber } from '../server/services/memberIdRecords.js'
import { scanMemberId } from '../server/services/memberIdScan.js'

function tsv(lines, confidence = 93) {
  return lines
    .map((line, index) =>
      line
        .split(' ')
        .map((word, wordIndex) =>
          [5, 1, 1, 1, index + 1, wordIndex + 1, 10, 10, 50, 20, confidence, word].join('\t')
        )
        .join('\n')
    )
    .join('\n')
}

test('Philippine ID parsers extract the visible fields and preserve OCR confidence', () => {
  const parsed = parseMemberId('drivers_license', {
    tsv: tsv([
      'LAND TRANSPORTATION OFFICE',
      'DRIVER’S LICENSE',
      'Last Name, First Name, Middle Name',
      'Dela Cruz, José, M.',
      'License No. A01-00-000000',
      'Date of Birth 1998/09/05',
      'Expiration Date 2030/04/20'
    ])
  })
  assert.equal(parsed.typeRecognized, true)
  assert.deepEqual(parsed.fields, {
    name: { value: 'José M. Dela Cruz', confidence: 93 },
    idNumber: { value: 'A0100000000', confidence: 93 },
    birthDate: { value: '1998-09-05', confidence: 93 },
    address: { value: null, confidence: 0 },
    expiryDate: { value: '2030-04-20', confidence: 93 }
  })
  assert.equal(namesMatch(parsed.fields.name.value, 'Jose Dela Cruz'), true)
  assert.equal(namesMatch(parsed.fields.name.value, 'Jose Delos Cruz'), false)

  const national = parseMemberId('national_id', {
    tsv: tsv(
      [
        'PHILIPPINE IDENTIFICATION CARD',
        'PCN 1234-5678-9012-3456',
        'GIVEN NAMES Juan',
        'LAST NAME Dela Cruz',
        'DATE OF BIRTH September 05, 1998'
      ],
      62
    )
  })
  assert.equal(national.fields.idNumber.value, '1234567890123456')
  assert.equal(national.fields.idNumber.confidence, 62)
  assert.equal(national.fields.expiryDate.value, null)
  assert.equal(normalizeIdNumber('drivers_license', 'A1-000'), null)
})

test('bilingual ID labels and an unlabelled SSS number produce review details', () => {
  const senior = parseMemberId('senior_id', { tsv: tsv([
    'SENIOR CITIZEN ID', 'Apelyido/Surname', 'REYES', 'Pangalan/Given Name', 'ANA',
    'Panggitnang Apelyido/Middle Name', 'RAMOS', 'Date of Birth 20 April 1960',
    'ID NO. SC-10001', 'Address 1 Fixture Street'
  ]) })
  assert.equal(senior.typeRecognized, true)
  assert.equal(senior.fields.name.value, 'ANA RAMOS REYES')
  assert.equal(senior.fields.birthDate.value, '1960-04-20')
  assert.equal(senior.fields.address.value, '1 Fixture Street')
  assert.equal(senior.fields.idNumber.value, 'SC10001')

  const sss = parseMemberId('sss_id', { tsv: tsv([
    'SOCIAL SECURITY SYSTEM', 'ANA RAMOS REYES', '00-1234567-8'
  ]) })
  assert.equal(sss.fields.idNumber.value, '0012345678')
  assert.equal(sss.fields.name.value, 'ANA RAMOS REYES')
  assert.equal(sss.fields.expiryDate.value, null)

  const pwd = parseMemberId('pwd_id', { tsv: tsv([
    'PERSONS WITH DISABILITIES', 'Name: Ana Reyes', 'PWD No. ABC-12345'
  ]) })
  assert.equal(pwd.typeRecognized, true)
  assert.equal(pwd.fields.idNumber.value, 'ABC12345')
})

test('Duplicate detection uses a stable fingerprint and random ciphertext', () => {
  const key = Buffer.alloc(32, 7)
  const first = protectIdNumber(key, 'student_id', 'FIX123', 'fixture school')
  const repeat = protectIdNumber(key, 'student_id', 'FIX123', 'fixture school')
  const differentSchool = protectIdNumber(key, 'student_id', 'FIX123', 'other school')
  assert.equal(first.id_fingerprint, repeat.id_fingerprint)
  assert.notEqual(first.id_number, repeat.id_number)
  assert.notEqual(first.id_fingerprint, differentSchool.id_fingerprint)
  assert.ok(!first.id_number.includes('FIX123'))
})

test('Passport machine-readable lines supply dates only when their check digits match', () => {
  const first = 'P<PHLERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<'
  const second = 'L898902C36PHL7408122F1204159ZE184226B<<<<<10'
  const fields = parseMemberId('passport', { tsv: tsv([first, second]) }, '2026-11-09').fields
  assert.equal(fields.name.value, 'ANNA MARIA ERIKSSON')
  assert.equal(fields.idNumber.value, 'L898902C3')
  assert.equal(fields.expiryDate.value, '2012-04-15')
  const changed = 'X' + second.slice(1)
  const invalid = parseMemberId('passport', { tsv: tsv([first, changed]) }, '2026-11-09')
  assert.equal(invalid.fields.idNumber.value, null)
})

test('Image validation rejects disguised files and overexposed pictures before OCR', async () => {
  await assert.rejects(
    scanMemberId(Buffer.from('not a PNG'), 'image/png', 'passport'),
    /could not be read/
  )
  const overexposed = await sharp({
    create: { width: 800, height: 500, channels: 3, background: '#fff' }
  })
    .jpeg()
    .toBuffer()
  await assert.rejects(scanMemberId(overexposed, 'image/jpeg', 'passport'), /overexposed/)
})

test('The server reads PaddleOCR results and rejects clipped text or an unavailable reader', async (t) => {
  const lines = ['SENIOR CITIZEN ID', 'Name: ANA REYES', 'ID NO. SC-10001']
  const image = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <rect width="800" height="500" fill="#eee"/>
    <g fill="#123" font-family="sans-serif" font-size="46">
      ${lines.map((line, index) => `<text x="70" y="${100 + index * 90}">${line}</text>`).join('')}
    </g>
  </svg>`)).png().toBuffer()
  const result = {
    rec_texts: lines,
    rec_scores: [0.91, 0.92, 0.93],
    rec_polys: lines.map((_, index) => {
      const top = 60 + index * 90
      return [[65, top], [490, top], [490, top + 50], [65, top + 50]]
    })
  }
  const recognize = t.mock.method(globalThis, 'fetch', async () => Response.json({
    result: { ocrResults: [{ prunedResult: result }] }
  }))

  const scan = () => scanMemberId(image, 'image/png', 'senior_id', { front: false })
  const parsed = await scan()
  assert.equal(parsed.typeRecognized, true)
  assert.deepEqual(parsed.fields.name, { value: 'ANA REYES', confidence: 92 })
  assert.deepEqual(parsed.fields.idNumber, { value: 'SC10001', confidence: 93 })
  const [, request] = recognize.mock.calls[0].arguments
  const { file, fileType, visualize } = JSON.parse(request.body)
  assert.equal((await sharp(Buffer.from(file, 'base64')).metadata()).format, 'png')
  assert.equal(fileType, 1)
  assert.equal(visualize, false)
  assert.equal(request.redirect, 'error')

  result.rec_polys[0][0][0] = 0
  await assert.rejects(scan(), /Text appears cut off/)
  result.rec_scores.pop()
  await assert.rejects(scan(), { code: 'ID_READER_UNAVAILABLE', status: 503 })
})

test(
  'The live PaddleOCR service and portrait pipeline read a synthetic card',
  { skip: process.env.FITPULSE_TEST_ID_OCR !== '1' },
  async () => {
    const portrait = await sharp('vendor/face-api.js/test/images/face1.png')
      .resize(250, 330, { fit: 'contain', background: '#eee' })
      .png()
      .toBuffer()
    const lines = [
      'LAND TRANSPORTATION OFFICE',
      'DRIVER’S LICENSE',
      'FULL NAME: JUAN M. DELA CRUZ',
      'LICENSE NO: A01-00-000000',
      'DATE OF BIRTH: 1998/09/05',
      'EXPIRATION DATE: 2030/04/20'
    ]
    const card = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620">
    <rect width="1200" height="620" fill="#e7ecef"/>
    <g fill="#123" font-family="sans-serif" font-size="37">
      ${lines.map((line, i) => `<text x="355" y="${120 + i * 66}">${line}</text>`).join('')}
    </g>
  </svg>`)
    const image = await sharp(card)
      .composite([{ input: portrait, left: 65, top: 160 }])
      .png()
      .toBuffer()
    const result = await scanMemberId(image, 'image/png', 'drivers_license')
    assert.equal(result.fields.idNumber.value, 'A0100000000')
    assert.equal(result.fields.expiryDate.value, '2030-04-20')
    assert.equal(result.portrait.length, 128)
  }
)
