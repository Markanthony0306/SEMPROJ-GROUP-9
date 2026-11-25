import React from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import CreateMemberSheet from '../../src/components/mobile/CreateMemberSheet'
import { Modal } from '../../src/components/admin/AdminDialogParts'
import { DashboardSheetContext } from '../../src/components/Dialog'
import '../../src/styles/fitpulse-v3.css'
import '../../src/styles/experience.css'
import '../../src/styles/dashboard-features.css'
import '../../src/pages/AdminStaffPage.css'
import '../../src/components/mobile/mobile.css'

const root = createRoot(document.getElementById('root'))
const results = []
let closes = 0
let instance = 0
const pause = () => new Promise(resolve => setTimeout(resolve, 30))
const check = (condition, message) => {
  if (!condition) throw new Error(message)
  results.push(message)
}
const close = () => {
  closes++
  flushSync(() => root.render(null))
}
async function open(mobile, busy = false, standard = false) {
  closes = 0
  flushSync(() => root.render(
    <DashboardSheetContext.Provider value={mobile} key={++instance}>
      <div className={`app admin-app${mobile ? ' fitpulse-mobile' : ''}`}>
        {standard ? <Modal title="Existing dialog" onClose={close}>Existing dialog</Modal> : (
          <CreateMemberSheet plans={[]} planOptionLabel={plan => plan.plan_name}
            pending={busy} onClose={close} onCreate={() => { throw new Error('Unexpected submission') }} />
        )}
      </div>
    </DashboardSheetContext.Provider>
  ))
  await pause()
  const dialog = document.querySelector('dialog')
  if (!dialog?.open) throw new Error('Native modal did not open')
  return dialog
}
function requestEscape(dialog) {
  if (typeof dialog.requestClose === 'function') dialog.requestClose()
  else dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
}
async function run() {
  for (const mobile of [false, true]) {
    const mode = mobile ? 'Mobile' : 'Desktop'
    let dialog = await open(mobile)
    const input = dialog.querySelector('input[name="name"]')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Saved draft name')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await pause()
    dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await pause()
    check(dialog.open && closes === 0 && input.value === 'Saved draft name', `${mode}: outside click preserves the form`)
    requestEscape(dialog)
    await pause()
    check(dialog.open && closes === 0 && input.value === 'Saved draft name', `${mode}: Escape cancellation preserves the form`)
    dialog.querySelector('.fp-verification-footer .btn.ghost').click()
    await pause()
    check(closes === 1 && !document.querySelector('dialog'), `${mode}: Cancel closes the form`)
    dialog = await open(mobile)
    dialog.querySelector('.dialog-close').click()
    await pause()
    check(closes === 1 && !document.querySelector('dialog'), `${mode}: X closes the form`)
    dialog = await open(mobile, true)
    const cancel = dialog.querySelector('.fp-verification-footer .btn.ghost')
    check(cancel.matches(':disabled') && dialog.querySelector('.dialog-close').disabled, `${mode}: explicit close buttons stay locked while saving`)
    cancel.click()
    dialog.querySelector('.dialog-close').click()
    dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    requestEscape(dialog)
    await pause()
    check(dialog.open && closes === 0, `${mode}: saving blocks dismissal`)
    dialog = await open(mobile, false, true)
    dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await pause()
    check(closes === 1, `${mode}: other dialogs retain backdrop dismissal`)
    dialog = await open(mobile, false, true)
    requestEscape(dialog)
    await pause()
    check(closes === 1, `${mode}: other dialogs retain Escape dismissal`)
  }
  document.getElementById('result').textContent = `PASS: ${results.length} browser interaction checks\n\n${results.join('\n')}`
  document.documentElement.dataset.ready = 'true'
}
run().catch(error => {
  flushSync(() => root.render(null))
  document.getElementById('result').textContent = `FAIL: ${error.message}\n${results.join('\n')}`
  document.documentElement.dataset.ready = 'true'
  throw error
})
