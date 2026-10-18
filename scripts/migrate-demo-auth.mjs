
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const dataPath = path.join(root, 'server', 'data.json');

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SECRET_KEY in your root .env file.'
  );
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function readHiddenPassword(label) {
  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      'Run this script in a terminal that supports hidden password input.'
    );
  }

  output.write(`${label}: `);

  const chunks = [];
  const stdin = input;

  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') {
          cleanup();
          output.write('\nCancelled.\n');
          reject(new Error('Cancelled.'));
          return;
        }

        if (char === '\r' || char === '\n') {
          cleanup();
          output.write('\n');
          resolve(Buffer.concat(chunks));
          return;
        }

        if (char === '\u007f' || char === '\b') {
          chunks.pop();
          continue;
        }

        if (char >= ' ') {
          chunks.push(Buffer.from(char, 'utf8'));
        }
      }
    };

    function cleanup() {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    stdin.on('data', onData);
  }).then((buffer) => buffer.toString('utf8'));
}

async function ensureAuthUser(email, password, name) {
  let page = 1;
  let existingUser = null;

  while (true) {
    const { data, error } =
      await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

    if (error) {
      throw new Error(
        `Could not look up ${email}: ${error.message}`
      );
    }

    existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email
    );

    if (existingUser || data.users.length < 1000) {
      break;
    }

    page++;
  }

  if (existingUser) {
    const { data, error } =
      await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata || {}),
            name,
          },
        }
      );

    if (error) {
      throw new Error(
        `Could not update ${email}: ${error.message}`
      );
    }

    return data.user;
  }

  const { data, error } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

  if (error) {
    throw new Error(
      `Could not create ${email}: ${error.message}`
    );
  }

  return data.user;
}

async function migrateDemoAccounts() {
  const database = JSON.parse(
    await fs.readFile(dataPath, 'utf8')
  );

  const demoAccounts = [
    {
      email: 'admin@fitpulse.com',
      expectedRole: 'admin',
      fallbackMemberCode: 'FP-ADMIN',
    },
    {
      email: 'member@fitpulse.com',
      expectedRole: 'member',
      fallbackMemberCode: 'FP-DEMO-MEMBER',
    },
  ];

  const rl = readline.createInterface({ input, output });
  const credentials = [];

  try {
    for (const item of demoAccounts) {
      const account = database.accounts?.find(
        (candidate) =>
          candidate.email?.toLowerCase() === item.email
      );

      if (!account) {
        throw new Error(
          `Could not find ${item.email} in server/data.json.`
        );
      }

      const password = await readHiddenPassword(
        `Enter the current password for ${item.email}`
      );

      if (
        !password ||
        Buffer.byteLength(password, 'utf8') > 72
      ) {
        throw new Error(
          `Password for ${item.email} must be non-empty and no longer than 72 UTF-8 bytes.`
        );
      }

      credentials.push({
        ...item,
        account,
        password,
      });
    }
  } finally {
    rl.close();
  }

  const { data: roles, error: rolesError } =
    await supabase
      .from('roles')
      .select('role_id, role_name');

  if (rolesError) {
    throw new Error(
      `Could not read Supabase roles: ${rolesError.message}`
    );
  }

  const roleMap = new Map(
    (roles || []).map((role) => [
      role.role_name.toLowerCase(),
      role.role_id,
    ])
  );

  const adminRoleId = roleMap.get('admin');
  const memberRoleId = roleMap.get('member');

  if (!adminRoleId || !memberRoleId) {
    throw new Error(
      'Supabase roles must include admin and member.'
    );
  }

  console.log(
    '\nProvisioning demo accounts in Supabase Auth...'
  );

  for (const item of credentials) {
    const authUser = await ensureAuthUser(
      item.email,
      item.password,
      item.account.name
    );

    const { data: existingRows, error: findError } =
      await supabase
        .from('users')
        .select('id, member_code')
        .eq('email', item.email)
        .limit(1);

    if (findError) {
      throw new Error(
        `Could not check public.users for ${item.email}: ${findError.message}`
      );
    }

    const existingRow = existingRows?.[0];

    const row = {
      id: existingRow?.id || item.account.id,
      auth_user_id: authUser.id,
      member_code:
        existingRow?.member_code ||
        item.account.memberCode ||
        item.fallbackMemberCode,
      role_id:
        item.expectedRole === 'admin'
          ? adminRoleId
          : memberRoleId,
      name: item.account.name,
      email: item.email,
      phone_number: item.account.phone || null,
      emergency_contact:
        item.account.emergencyContact || null,
      status:
        item.account.status === 'suspended'
          ? 'suspended'
          : item.account.status === 'archived'
            ? 'archived'
            : 'active',
      must_change_password: Boolean(item.account.mustChangePassword),
      created_at: item.account.joined || new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(row, { onConflict: 'email' });

    if (upsertError) {
      throw new Error(
        `Could not link ${item.email} to public.users: ${upsertError.message}`
      );
    }

    if (item.expectedRole === 'member') {
      const planName = item.account.plan || 'Unlimited Monthly';
      const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('plan_id, duration_days')
        .ilike('plan_name', planName)
        .eq('is_active', true)
        .maybeSingle();
      if (planError || !plan) {
        throw new Error(`Could not find an active ${planName} plan: ${planError?.message || 'no matching plan'}`);
      }
      const { data: existingSubscription, error: subscriptionLookupError } = await supabase
        .from('subscriptions')
        .select('subscription_id')
        .eq('user_id', row.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subscriptionLookupError) {
        throw new Error(`Could not look up the subscription for ${item.email}: ${subscriptionLookupError.message}`);
      }
      const startDate = item.account.membershipStart || new Date().toISOString();
      const endDate = item.account.membershipEnd ||
        new Date(Date.parse(startDate) + Number(plan.duration_days) * 86400000).toISOString();
      const { error: subscriptionError } = await supabase.from('subscriptions').upsert({
        subscription_id: existingSubscription?.subscription_id || randomUUID(),
        user_id: row.id,
        plan_id: plan.plan_id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        created_at: startDate
      }, { onConflict: 'subscription_id' });
      if (subscriptionError) {
        throw new Error(`Could not save the subscription for ${item.email}: ${subscriptionError.message}`);
      }
    }

    console.log(
      `Successfully linked ${item.email} (${item.expectedRole}).`
    );
  }

  console.log('\nDemo-account provisioning completed.');
  console.log('The app reads and writes account data through Supabase.');
  console.log('This helper only provisions the two demo Auth accounts and their profiles.');
}

migrateDemoAccounts().catch((error) => {
  console.error(`\nMigration stopped: ${error.message}`);
  process.exitCode = 1;
});
