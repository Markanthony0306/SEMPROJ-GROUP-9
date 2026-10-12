function csvCell(value) {
  let text = String(value ?? '')
  // Spreadsheet applications execute formula-like cells even inside CSV quotes.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function paymentsCsv(payments, { includeMember = false } = {}) {
  const headings = [
    ...(includeMember ? ['Member', 'Member ID'] : []),
    'Payment ID',
    'Type',
    'Plan',
    'Amount (PHP)',
    'Method',
    'Date (Asia/Manila)'
  ]
  const rows = payments.map((payment) => [
    ...(includeMember ? [payment.memberName, payment.memberId] : []),
    payment.id,
    payment.type || 'Membership',
    payment.plan,
    Number(payment.amount || 0).toFixed(2),
    payment.method,
    payment.date
      ? new Date(payment.date).toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      : ''
  ])
  return '\uFEFF' + [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function downloadPayments(payments, options = {}) {
  downloadCsv('fitpulse-payments', paymentsCsv(payments, options))
}

export function downloadCsvRows(name, headings, rows) {
  const csv = '\uFEFF' + [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  downloadCsv(name, csv)
}

function downloadCsv(name, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}-${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
