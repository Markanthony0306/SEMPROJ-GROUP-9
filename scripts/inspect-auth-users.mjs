

import { supabase } from '../server/lib/supabase.js';

async function main() {
  // Fetch all Supabase Auth users, one page at a time.
  const authUsers = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list Auth users: ${error.message}`);
    }

    const users = data.users ?? [];
    authUsers.push(...users);

    if (users.length < perPage) break;
    page += 1;
  }

  // Fetch the IDs linking public.users profiles to Auth accounts.
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('id, auth_user_id');

  if (profileError) {
    throw new Error(
      `Could not read user profiles: ${profileError.message}`
    );
  }

  const authIds = new Set(authUsers.map(user => user.id));
  const profileAuthIds = new Set(
    profiles
      .map(profile => profile.auth_user_id)
      .filter(Boolean)
  );

  const authUsersWithProfiles = authUsers.filter(user =>
    profileAuthIds.has(user.id)
  );

  const authUsersWithoutProfiles = authUsers.filter(user =>
    !profileAuthIds.has(user.id)
  );

  const profilesWithoutAuthUsers = profiles.filter(profile =>
    !profile.auth_user_id || !authIds.has(profile.auth_user_id)
  );

  console.log('\n=== FitPulse Auth/Profile Inspection ===');
  console.log(`Total Auth users: ${authUsers.length}`);
  console.log(
    `Auth users with matching profiles: ${authUsersWithProfiles.length}`
  );
  console.log(
    `Auth users without matching profiles: ${authUsersWithoutProfiles.length}`
  );
  console.log(
    `Profiles without matching Auth users: ${profilesWithoutAuthUsers.length}`
  );

  console.log(
    '\nInspection complete. No accounts or profiles were modified.'
  );
}

main().catch(error => {
  console.error('Inspection failed:', error.message);
  process.exitCode = 1;
});
