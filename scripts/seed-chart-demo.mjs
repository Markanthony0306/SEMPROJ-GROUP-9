import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MemberRegistrationWorkflow } from '../server/services/MemberRegistrationWorkflow.js'
import { MemberRegistrationRepository } from '../server/repositories/MemberRegistrationRepository.js'
import { generateTemporaryPassword } from '../server/lib/temporaryPassword.js'
import { manilaDateKey } from '../server/services/AnalyticsService.js'
import { isRetiredPlan } from '../shared/membershipPlans.js'

export const DEMO_SEED = 'fitpulse-chart-demo-v1'
const DAY_MS = 86400000
const root = fileURLToPath(new URL('../', import.meta.url))
const credentialsPath = path.join(root, '.env.chart-demo-accounts.jsonl')

export function assertDemoEnvironment(env) {
  if (!['development', 'test'].includes(env.NODE_ENV) || env.ID_VERIFICATION_ENABLED !== 'false') {
    throw new Error('Demo seeding requires NODE_ENV=development/test and ID_VERIFICATION_ENABLED=false.')
  }
}

function demoId(value) {
  const hex = createHash('sha256').update(`${DEMO_SEED}:${value}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

// Build five fictional members and six months of receipts, with no attendance data.
export function buildChartDemo(plans, now = new Date()) {
  const activePlans = plans.filter((plan) => plan.is_active && !isRetiredPlan(plan.plan_name))
  const choosePlan = (name) => {
    const plan = activePlans.find((item) => item.plan_name === name)
    if (!plan || !(Number(plan.duration_days) > 0) || !(Number(plan.price) > 0)) {
      throw new Error(`The demo requires an active ${name} plan with a positive price and duration.`)
    }
    return plan
  }
  const definitions = [
    ['Ana Reyes', 'Monthly - Student', 20],
    ['Marco Santos', 'Quarterly', 70],
    ['Lia Cruz', 'Weekly', 2],
    ['Paolo Garcia', 'Monthly - Non-student', -5],
    ['Nina Ramos', 'Monthly - Student', -16]
  ]
  const members = definitions.map(([name, planName, remainingDays], index) => {
    const plan = choosePlan(planName)
    const end = now.getTime() + remainingDays * DAY_MS
    const start = end - Number(plan.duration_days) * DAY_MS
    if (start > now.getTime()) throw new Error('Demo plan duration is shorter than its remaining days.')
    return {
      name: `[Demo] ${name}`,
      email: `chart.member${index + 1}@demo.fitpulse.invalid`,
      plan,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      method: index % 2 === 0 ? 'Cash' : 'GCash',
      history: []
    }
  })
  const [year, month] = manilaDateKey(now).split('-').map(Number)
  const historyPlans = [choosePlan('Weekly'), choosePlan('Monthly - Student'), choosePlan('Monthly - Non-student')]
  for (let monthIndex = 0; monthIndex < 5; monthIndex++) {
    const used = new Set()
    for (let slot = 0; slot < 2 + monthIndex % 3; slot++) {
      const plan = historyPlans[(monthIndex + slot) % historyPlans.length]
      const day = new Date(Date.UTC(year, month - 6 + monthIndex, 3 + slot)).toISOString().slice(0, 10)
      const start = new Date(`${day}T10:00:00+08:00`).getTime()
      const end = start + Number(plan.duration_days) * DAY_MS
      const eligible = members.filter((member) => Date.parse(member.start) >= end)
      const unused = eligible.filter((member) => !used.has(member.email))
      const candidates = unused.length ? unused : eligible
      if (!candidates.length) throw new Error('Historical demo memberships would overlap current memberships.')
      const member = candidates[(monthIndex + slot) % candidates.length]
      used.add(member.email)
      member.history.push({
        key: `${day}:${slot}`, plan,
        start: new Date(start).toISOString(), end: new Date(end).toISOString(),
        method: (monthIndex + slot) % 2 === 0 ? 'Cash' : 'GCash'
      })
    }
  }
  return members
}

function checked(result, operation) {
  if (result.error) {
    throw new Error(`${operation} failed (${result.error.code || 'DATABASE_ERROR'}): ${result.error.message}`)
  }
  return result.data
}

export async function seedChartDemo({ client, members, actorId, env, saveCredentials, logger = console }) {
  assertDemoEnvironment(env)
  const workflow = new MemberRegistrationWorkflow({
    repository: new MemberRegistrationRepository(client),
    generateTemporaryPassword,
    authAdmin: {
      createUser: (input) => client.auth.admin.createUser({
        ...input,
        app_metadata: { ...input.app_metadata, fitpulse_demo_seed: DEMO_SEED }
      }),
      deleteUser: (id) => client.auth.admin.deleteUser(id)
    }
  })
  const methods = checked(await client.from('payment_methods').select('method_id,method_name'), 'Payment methods')
  const methodIds = new Map(methods.map((method) => [method.method_name, method.method_id]))
  if (!methodIds.has('Cash') || !methodIds.has('GCash')) throw new Error('Cash and GCash must be configured.')
  const result = { created: 0, reused: 0, paymentsCreated: 0 }

  for (const fixture of members) {
    let member = checked(await client.from('users').select('id,auth_user_id,verification_status')
      .eq('email', fixture.email).maybeSingle(), 'Demo account lookup')
    let auth
    if (member) {
      auth = checked(await client.auth.admin.getUserById(member.auth_user_id), 'Demo ownership check').user
      if (member.verification_status !== 'skipped' || auth?.app_metadata?.fitpulse_demo_seed !== DEMO_SEED) {
        throw new Error(`Refusing to modify an account not owned by this demo seed: ${fixture.email}`)
      }
      if (auth.app_metadata.fitpulse_demo_complete) {
        result.reused++
        continue
      }
    } else {
      const created = await workflow.execute({
        actorId,
        prepared: {
          input: { name: fixture.name, email: fixture.email, phone: '' },
          planRecord: fixture.plan, recordPayment: false, method: fixture.method
        }
      })
      member = { id: created.persisted.member_id, auth_user_id: created.authUserId }
      // Save the one-time password privately before performing optional history writes.
      await saveCredentials({
        kind: 'account', seed: DEMO_SEED, memberId: member.id, email: fixture.email,
        temporaryPassword: created.temporaryPassword
      })
      auth = checked(await client.auth.admin.getUserById(member.auth_user_id), 'Created demo account').user
      result.created++
    }

    const subscription = checked(await client.from('subscriptions').select('subscription_id')
      .eq('user_id', member.id).order('created_at', { ascending: false }).limit(1).single(), 'Demo subscription')
    const periods = [
      { ...fixture, subscriptionId: subscription.subscription_id },
      ...fixture.history.map((period) => ({ ...period, subscriptionId: demoId(`${member.id}:subscription:${period.key}`) }))
    ]
    const joined = periods.map((period) => period.start).sort()[0]
    checked(await client.from('users').update({ created_at: joined })
      .eq('id', member.id).eq('auth_user_id', member.auth_user_id), 'Demo join date')
    checked(await client.from('subscriptions').update({
      start_date: fixture.start, end_date: fixture.end, created_at: fixture.start,
      status: Date.parse(fixture.end) <= Date.now() ? 'expired' : 'active'
    }).eq('subscription_id', subscription.subscription_id).eq('user_id', member.id), 'Demo membership dates')

    for (const period of periods) {
      if (period.subscriptionId !== subscription.subscription_id) {
        // Stable IDs + ignoreDuplicates make interrupted runs safe to resume.
        checked(await client.from('subscriptions').upsert({
          subscription_id: period.subscriptionId, user_id: member.id, plan_id: period.plan.plan_id,
          start_date: period.start, end_date: period.end, created_at: period.start, status: 'expired'
        }, { onConflict: 'subscription_id', ignoreDuplicates: true }), 'Demo historical membership')
      }
      const savedPayments = checked(await client.from('payments').upsert({
        payment_id: demoId(`${period.subscriptionId}:payment`), subscription_id: period.subscriptionId,
        method_id: methodIds.get(period.method), processed_by_user_id: actorId,
        amount_paid: Number(period.plan.price), payment_status: 'paid',
        created_at: period.start, legacy_plan_name: period.plan.plan_name
      }, { onConflict: 'payment_id', ignoreDuplicates: true }).select('payment_id'), 'Demo payment')
      result.paymentsCreated += savedPayments.length
    }
    checked(await client.auth.admin.updateUserById(member.auth_user_id, {
      app_metadata: { ...auth.app_metadata, fitpulse_demo_complete: true }
    }), 'Demo completion marker')
    logger.log(`Prepared ${fixture.name}.`)
  }
  return result
}

async function main() {
  await import('dotenv/config')
  assertDemoEnvironment(process.env)
  const { supabase: client } = await import('../server/lib/supabase.js')
  const project = new URL(process.env.SUPABASE_URL).hostname
  let ledger = []
  try {
    ledger = (await fs.readFile(credentialsPath, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const manifest = ledger.find((entry) => entry.kind === 'manifest')
  if (manifest && (manifest.project !== project || manifest.seed !== DEMO_SEED)) {
    throw new Error('The private demo ledger belongs to a different project or seed.')
  }
  const now = manifest ? new Date(manifest.createdAt) : new Date()
  const plans = checked(await client.from('membership_plans')
    .select('plan_id,plan_name,duration_days,price,is_active'), 'Membership plans')
  const members = buildChartDemo(plans, now)
  const expectedPayments = members.reduce((sum, member) => sum + 1 + member.history.length, 0)
  console.log(`Chart demo: ${members.length} members and ${expectedPayments} paid receipts across six months.`)
  console.log(`Target: ${project}. Attendance writes: 0.`)
  if (!process.argv.includes('--apply')) {
    console.log('Preview only. Run node scripts/seed-chart-demo.mjs --apply to create this dataset.')
    return
  }
  const admin = checked(await client.from('users').select('id,status,roles!inner(role_name)')
    .eq('email', String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()).single(), 'Admin account')
  if (admin.status !== 'active' || admin.roles?.role_name?.toLowerCase() !== 'admin') {
    throw new Error('An active ADMIN_EMAIL administrator is required.')
  }
  const before = await client.from('attendance_logs').select('attendance_id', { count: 'exact', head: true })
  checked(before, 'Attendance baseline')
  if (!manifest) {
    await fs.appendFile(credentialsPath, JSON.stringify({ kind: 'manifest', seed: DEMO_SEED, project, createdAt: now.toISOString() }) + '\n')
  }
  const result = await seedChartDemo({
    client, members, actorId: admin.id, env: process.env,
    saveCredentials: (entry) => fs.appendFile(credentialsPath, JSON.stringify(entry) + '\n')
  })
  const after = await client.from('attendance_logs').select('attendance_id', { count: 'exact', head: true })
  checked(after, 'Attendance verification')
  console.log(JSON.stringify({ ...result, attendanceBefore: before.count, attendanceAfter: after.count }))
  console.log(`Private one-time credentials: ${credentialsPath} (ignored by Git; never publish this file).`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    console.error('Stopped. Existing real accounts were not overwritten. Check demo Auth/profile state before retrying an uncertain failure.')
    process.exitCode = 1
  })
}
