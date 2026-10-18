import { fileURLToPath } from 'node:url'

const logoPath = fileURLToPath(new URL('../../public/fitpulse-email-logo.png', import.meta.url))
const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[character]
  )

function emailLayout({
  eyebrow,
  title,
  name,
  message,
  details = [],
  actionUrl,
  actionLabel,
  note
}) {
  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;color:#566d80;font-size:13px;border-bottom:1px solid #d5dfee">${escapeHtml(label)}</td><td style="padding:10px 0;color:#003049;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #d5dfee;word-break:break-word">${escapeHtml(value)}</td></tr>`
    )
    .join('')
  const safeUrl = new URL(actionUrl)
  if (!['http:', 'https:'].includes(safeUrl.protocol))
    throw new Error('Email action must use HTTP or HTTPS.')
  return {
    attachments: [
      {
        filename: 'fitpulse-logo.png',
        path: logoPath,
        cid: 'fitpulse-brand',
        contentDisposition: 'inline'
      }
    ],
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#d5dfee;font-family:Arial,Helvetica,sans-serif;color:#003049">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(message)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#d5dfee"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#f5f8fd;border-radius:28px;overflow:hidden;box-shadow:8px 10px 26px #00304920">
<tr><td style="padding:32px 32px 22px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td><img src="cid:fitpulse-brand" width="52" height="52" alt="FitPulse logo" style="display:block;border:0;border-radius:14px"></td><td style="padding-left:12px;font-size:26px;font-weight:800;color:#003049">Fit<span style="color:#f77f00">Pulse</span><br><span style="font-size:10px;letter-spacing:2px;color:#566d80">YOUR FITNESS. YOUR MOMENTUM.</span></td></tr></table></td></tr>
<tr><td style="padding:8px 32px 32px"><p style="font-size:11px;font-weight:bold;letter-spacing:2px;color:#c45400;margin:0 0 14px">${escapeHtml(eyebrow)}</p>
<h1 style="font-size:28px;line-height:1.25;margin:0 0 24px">${escapeHtml(title)}</h1><p style="font-size:15px;line-height:1.7;margin:0 0 12px">Hi ${escapeHtml(name || 'there')},</p><p style="font-size:15px;line-height:1.7;color:#566d80;margin:0 0 22px">${escapeHtml(message)}</p>
${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e7edf7;border-radius:18px;padding:10px 18px;margin:0 0 24px">${rows}</table>` : ''}
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="background:#e65d13;border-radius:28px"><a href="${escapeHtml(safeUrl.href)}" style="display:inline-block;padding:15px 26px;color:#fff;text-decoration:none;font-size:14px;font-weight:bold">${escapeHtml(actionLabel)} &rarr;</a></td></tr></table>
<p style="margin:24px 0 0;font-size:12px;line-height:1.8;color:#566d80">${escapeHtml(note)}</p></td></tr>
<tr><td style="padding:22px 32px;background:#e7edf7;border-top:1px solid #d5dfee;font-size:12px;line-height:1.8;color:#566d80"><strong style="color:#003049">A little stronger, every day.</strong><br>Need a hand? Your gym’s front desk is here to help.<br>This is an automated FitPulse account message.</td></tr>
</table></td></tr></table></body></html>`
  }
}

export function welcomeEmail({ name, email, temporaryPassword, loginUrl }) {
  const message =
    'Your gym account is ready. Sign in with the details below, then choose a new password to keep your account secure.'
  return {
    subject: 'Welcome to FitPulse — your membership starts here',
    text: `Hi ${name},\n\n${message}\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nSign in: ${loginUrl}\n\nKeep these details private. Change your temporary password after signing in. Need help? Contact your gym’s front desk.`,
    ...emailLayout({
      eyebrow: 'WELCOME TO YOUR NEXT CHAPTER',
      title: 'Your next session starts here.',
      name,
      message,
      details: [
        ['Email address', email],
        ['Temporary password', temporaryPassword]
      ],
      actionUrl: loginUrl,
      actionLabel: 'Sign in to FitPulse',
      note: 'Keep your sign-in details private. FitPulse staff will never ask you to share your password. Change this temporary password after your first sign-in.'
    })
  }
}

export function expiryEmail({ name, plan, expiryDate, expired, loginUrl }) {
  const message = expired
    ? 'Your membership has ended, but your momentum doesn’t have to. Visit the front desk to renew your plan and get back to your next session.'
    : 'Your membership is coming up for renewal. Drop by the front desk before it ends so you can keep training without missing a beat.'
  return {
    subject: expired
      ? 'Ready for your next session? Renew your FitPulse membership'
      : 'Keep your momentum — your FitPulse renewal is coming up',
    text: `Hi ${name},\n\n${message}\n\nPlan: ${plan}\n${expired ? 'Expired' : 'Expires'}: ${expiryDate}\n\nView your membership: ${loginUrl}\n\nIf you have already renewed, please ask the front desk to check your record.`,
    ...emailLayout({
      eyebrow: 'A FRIENDLY MEMBERSHIP REMINDER',
      title: expired ? 'Let’s get you moving again.' : 'Keep your good thing going.',
      name,
      message,
      details: [
        ['Your plan', plan],
        [expired ? 'Expired on' : 'Valid until', expiryDate]
      ],
      actionUrl: loginUrl,
      actionLabel: 'View my membership',
      note: 'Already renewed? Thank you! Ask the front desk to confirm your updated membership record. Payments and renewals are handled at the gym.'
    })
  }
}

export function recoveryEmail({ name, recoveryUrl }) {
  const message =
    'We received a request to reset your FitPulse password. Use the button below to choose a new one and get back to your fitness journey.'
  return {
    subject: 'Reset your FitPulse password',
    text: `Hi ${name || 'there'},\n\n${message}\n\nReset password: ${recoveryUrl}\n\nThis link is time-limited and can only be used once. If you didn’t request a reset, ignore this email; your password stays unchanged. Never share this link.`,
    ...emailLayout({
      eyebrow: 'LET’S GET YOU BACK IN',
      title: 'A fresh start for your password.',
      name,
      message,
      actionUrl: recoveryUrl,
      actionLabel: 'Choose a new password',
      note: 'This link is time-limited and can only be used once. If you didn’t request this reset, you can safely ignore this email. Never share this link.'
    })
  }
}
