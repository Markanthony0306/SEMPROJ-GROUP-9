import { memberIdTypes } from '../../shared/memberIdTypes.js'

const idPatterns = {
  passport: /^(?=.*\d)[A-Z\d]{6,9}$/,
  drivers_license: /^[A-Z]\d{10}$/,
  national_id: /^\d{16}$/,
  student_id: /^(?=.*\d)[A-Z\d]{3,32}$/
}

const numberLabels = {
  passport: /(?:PASSPORT\s*(?:NO\.?|NUMBER)|PASAPORTE\s*BLG\.?)\s*[:#]?\s*/i,
  drivers_license: /(?:LICEN[CS]E\s*(?:NO\.?|NUMBER)|DL\s*(?:NO\.?|NUMBER))\s*[:#]?\s*/i,
  national_id: /(?:PHILSYS CARD NUMBER|CARD NUMBER|PCN)\s*[:#]?\s*/i,
  student_id: /(?:STUDENT\s*(?:ID|NO\.?|NUMBER)|ID\s*(?:NO\.?|NUMBER))\s*[:#]?\s*/i
}

const dateOfBirthLabel = /(?:DATE OF BIRTH|BIRTH\s*DATE|DOB|PETSA NG KAPANGANAKAN)\s*[:.]?\s*/i
const expiryLabel =
  /(?:DATE OF EXPIRY|EXPIRATION DATE|EXPIRY DATE|EXPIR(?:ES|Y)|VALID UNTIL)\s*[:.]?\s*/i
const monthNames = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC'
]
const datePattern =
  /\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}\s*[A-Z]{3,9}\s*\d{4}|[A-Z]{3,9}\s+\d{1,2},?\s+\d{4})\b/i

export const isMemberIdType = (type) =>
  typeof type === 'string' && Object.hasOwn(memberIdTypes, type)

export function normalizeIdNumber(type, value) {
  if (!isMemberIdType(type) || typeof value !== 'string' || value.length > 55) return null
  const normalized = value.toUpperCase().replace(/[\s-]+/g, '')
  return idPatterns[type].test(normalized) ? normalized : null
}

export function manilaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Manila'
  }).formatToParts(now)
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${date.year}-${date.month}-${date.day}`
}

export function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
}

function toIso(year, month, day) {
  return isoDate([year, String(month).padStart(2, '0'), String(day).padStart(2, '0')].join('-'))
}

function readDate(value) {
  const numeric = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value)
  if (numeric) return toIso(numeric[1], numeric[2], numeric[3])
  const named = /^(\d{1,2})\s*([A-Z]{3,9})\s*(\d{4})$/i.exec(value)
  if (named)
    return toIso(named[3], monthNames.indexOf(named[2].slice(0, 3).toUpperCase()) + 1, named[1])
  const monthFirst = /^([A-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/i.exec(value)
  return monthFirst
    ? toIso(
        monthFirst[3],
        monthNames.indexOf(monthFirst[1].slice(0, 3).toUpperCase()) + 1,
        monthFirst[2]
      )
    : null
}

const nameTokens = (value) =>
  (value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .match(/\p{L}+/gu) || []

export function namesMatch(left, right) {
  const a = nameTokens(left)
  const b = nameTokens(right)
  if (a.length < 2 || b.length < 2) return false
  if (a[0] !== b[0] || a.at(-1) !== b.at(-1)) return false
  const aMiddle = a.slice(1, -1)
  const bMiddle = b.slice(1, -1)
  const fullWords = (tokens) => tokens.filter((token) => token.length > 1)
  if (fullWords(aMiddle).join(' ') === fullWords(bMiddle).join(' ')) return true
  return (
    aMiddle.length === bMiddle.length &&
    aMiddle.every(
      (part, index) =>
        part === bMiddle[index] ||
        ((part.length === 1 || bMiddle[index].length === 1) && part[0] === bMiddle[index][0])
    )
  )
}

// Word confidence is evidence about OCR accuracy, not document authenticity.
function ocrLines({ tsv, text }) {
  const lines = new Map()
  for (const row of (tsv || '').split('\n')) {
    const columns = row.split('\t')
    if (columns[0] !== '5' || !columns[11]?.trim()) continue
    const key = columns.slice(1, 5).join(':')
    const words = lines.get(key) || []
    words.push({ text: columns[11].trim(), confidence: Number(columns[10]) })
    lines.set(key, words)
  }
  if (!lines.size) {
    return (text || '')
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({ text: line.trim(), confidence: 0 }))
  }
  return Array.from(lines.values(), (words) => ({
    text: words.map((word) => word.text).join(' '),
    confidence: Math.round(Math.min(...words.map((word) => Math.max(0, word.confidence || 0))))
  }))
}

const blank = () => ({ value: null, confidence: 0 })

function labeled(lines, label, parse) {
  for (const [index, line] of lines.entries()) {
    const match = label.exec(line.text)
    if (!match) continue
    const sameLine = parse(line.text.slice(match.index + match[0].length).trim())
    if (sameLine) return { value: sameLine, confidence: line.confidence }
    const next = lines[index + 1]
    const nextValue = next && parse(next.text)
    if (nextValue) return { value: nextValue, confidence: next.confidence }
  }
  return blank()
}

function cleanName(value) {
  const name = value.trim()
  return name.length <= 100 &&
    /^[\p{L}\p{M} .,'’-]+$/u.test(name) &&
    !/^(?:name|given names?|middle name|first name|last name|surname|sex|nationality|signature|address|date of birth)$/i.test(
      name
    )
    ? name
    : null
}

function checkDigit(value, check) {
  const weights = [7, 3, 1]
  const sum = Array.from(value).reduce((total, char, index) => {
    const number = char === '<' ? 0 : parseInt(char, 36)
    return total + number * weights[index % 3]
  }, 0)
  return /^\d$/.test(check) && sum % 10 === Number(check)
}

function passportMrz(lines, today) {
  const compact = lines.map((line) => ({
    ...line,
    text: line.text.toUpperCase().replace(/\s+/g, '')
  }))
  const index = compact.findIndex((line) => /^P<PHL[A-Z<]{39}$/.test(line.text))
  const first = compact[index]
  const second = compact[index + 1]
  if (index < 0 || !second || !/^[A-Z\d<]{44}$/.test(second.text)) return null
  const row = second.text
  const number = row.slice(0, 9)
  const birth = row.slice(13, 19)
  const expiry = row.slice(21, 27)
  if (!checkDigit(number, row[9]) || !checkDigit(birth, row[19]) || !checkDigit(expiry, row[27]))
    return null
  const [surname, given] = first.text.slice(5).split('<<')
  const idNumber = normalizeIdNumber('passport', number.replace(/<+$/, ''))
  const shortDate = (value, century) =>
    toIso(century + value.slice(0, 2), value.slice(2, 4), value.slice(4, 6))
  let birthDate = shortDate(birth, '20')
  if (birthDate && birthDate > today) birthDate = shortDate(birth, '19')
  let expiryDate = shortDate(expiry, '20')
  if (expiryDate && Number(expiryDate.slice(0, 4)) > Number(today.slice(0, 4)) + 15)
    expiryDate = shortDate(expiry, '19')
  return {
    name: {
      value: cleanName([given, surname].join(' ').replace(/<+/g, ' ')),
      confidence: first.confidence
    },
    idNumber: { value: idNumber, confidence: second.confidence },
    birthDate: { value: birthDate, confidence: second.confidence },
    expiryDate: { value: expiryDate, confidence: second.confidence }
  }
}

function readName(lines, type) {
  const given = labeled(lines, /^(?:FIRST NAME|GIVEN NAMES?|MGA PANGALAN)\s*[:./-]?\s*/i, cleanName)
  const surname = labeled(lines, /^(?:LAST NAME|SURNAME|APELYIDO)\s*[:./-]?\s*/i, cleanName)
  if (given.value && surname.value) {
    const middle = labeled(lines, /^(?:MIDDLE NAME|GITNANG PANGALAN)\s*[:./-]?\s*/i, cleanName)
    const parts = [given, middle, surname].filter((field) => field.value)
    return {
      value: parts.map((field) => field.value).join(' '),
      confidence: Math.min(...parts.map((field) => field.confidence))
    }
  }
  if (type === 'drivers_license') {
    const combined = labeled(
      lines,
      /LAST NAME[,\s]+FIRST NAME[,\s]+MIDDLE NAME\s*:?\s*/i,
      (value) => {
        const [last, first, middle] = value.split(',').map(cleanName)
        return last && first ? [first, middle, last].filter(Boolean).join(' ') : null
      }
    )
    if (combined.value) return combined
  }
  return labeled(lines, /^(?:FULL NAME|NAME)\s*:?\s*/i, cleanName)
}

export function parseMemberId(type, data, today = manilaDate()) {
  if (!isMemberIdType(type)) throw new Error('Unsupported ID type.')
  const lines = ocrLines(data)
  const mrz = type === 'passport' && passportMrz(lines, today)
  if (mrz) return { fields: mrz, typeRecognized: true, lineCount: lines.length }
  const parseDate = (value) => {
    const match = datePattern.exec(value)
    return match ? readDate(match[0]) : null
  }
  const unlabelledNumber = {
    national_id: /\b\d{4}(?:[ -]?\d{4}){3}\b/,
    drivers_license: /\b[A-Z]\d{2}[ -]?\d{2}[ -]?\d{6}\b/i
  }[type]
  let idNumber = labeled(lines, numberLabels[type], (value) => normalizeIdNumber(type, value))
  if (!idNumber.value && unlabelledNumber) {
    const row = lines.find((line) => unlabelledNumber.test(line.text))
    if (row)
      idNumber = {
        value: normalizeIdNumber(type, row.text.match(unlabelledNumber)[0]),
        confidence: row.confidence
      }
  }
  const headings = {
    passport: [/PASSPORT|PASAPORTE/i, /PHILIPPINES|PILIPINAS/i],
    drivers_license: [/LAND TRANSPORTATION OFFICE/i, /DRIVER.?S LICEN[CS]E/i],
    national_id: [/PAMBANSANG PAGKAKAKILANLAN|PHILIPPINE IDENTIFICATION (?:CARD|SYSTEM)|PHILSYS/i],
    student_id: [/STUDENT|SCHOOL|UNIVERSITY/i]
  }[type]
  return {
    fields: {
      name: readName(lines, type),
      idNumber,
      birthDate: labeled(lines, dateOfBirthLabel, parseDate),
      expiryDate: labeled(lines, expiryLabel, parseDate)
    },
    typeRecognized: headings.every((heading) => lines.some((line) => heading.test(line.text))),
    lineCount: lines.length
  }
}
