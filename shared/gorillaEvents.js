// Share event wording between persisted API operations and local UI actions.
export const gorillaTitles = {
  memberCreated: 'New member created',
  expiring: 'Membership expiring',
  expired: 'Membership expired',
  equipmentAdded: 'Equipment added',
  equipmentUpdated: 'Equipment updated',
  equipmentBroken: 'Equipment out of service',
  payment: 'Payment recorded',
  qrCheckIn: 'QR check-in recorded',
  loginLocked: 'OOPS! Too many attempts'
}

const pesos = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export const gorillaEvents = {
  memberCreated: (name, memberId) => ({
    type: 'success',
    title: gorillaTitles.memberCreated,
    message: `${name} joined FitPulse.`,
    target: { section: 'Members', memberId }
  }),
  expiring: (name, days) => ({
    type: 'warning',
    title: gorillaTitles.expiring,
    message: `${name ? `${name}’s` : 'Your'} membership expires in ${days} ${days === 1 ? 'day' : 'days'}.`,
    target: { section: 'Notifications' }
  }),
  expired: (name) => ({
    type: 'warning',
    title: gorillaTitles.expired,
    message: `${name ? `${name}’s` : 'Your'} membership has expired.`,
    target: { section: 'Notifications' }
  }),
  equipmentAdded: (item) => ({
    type: 'success',
    title: gorillaTitles.equipmentAdded,
    message: `${item} was added to Equipment.`,
    target: { section: 'Equipment' }
  }),
  equipmentUpdated: (item, detail, type = 'success') => ({
    type,
    title: gorillaTitles.equipmentUpdated,
    message: `${item}: ${detail}.`,
    target: { section: 'Equipment' }
  }),
  equipmentBroken: (item) => ({
    type: 'error',
    title: gorillaTitles.equipmentBroken,
    message: `${item} is out of service.`,
    target: { section: 'Equipment' }
  }),
  payment: (name, amount, method) => ({
    type: 'success',
    title: gorillaTitles.payment,
    message: `${name ? `${name} paid` : 'We received'} ${pesos.format(amount)} by ${method}.`,
    target: { section: 'Payments' }
  }),
  qrCheckIn: (name) => ({
    type: 'success',
    title: gorillaTitles.qrCheckIn,
    message: name ? `${name} checked in at FitPulse.` : 'Your FitPulse check-in was recorded.',
    target: { section: 'Attendance' }
  }),
  loginLocked: () => ({
    type: 'error',
    title: gorillaTitles.loginLocked,
    message: 'Please refresh the page to try again.'
  })
}
