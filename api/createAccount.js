import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, firstName, lastName, company, license } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const accountRole = role === 'realtor' ? 'realtor' : 'buyer';

  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: accountRole,
        first_name: firstName || 'New',
        last_name: lastName || (accountRole === 'realtor' ? 'Realtor' : 'Buyer'),
        company: accountRole === 'realtor' ? company || null : null,
        license: accountRole === 'realtor' ? license || null : null,
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const fullProfilePayload = {
      id: authUser.user.id,
      email,
      first_name: firstName || 'New',
      last_name: lastName || (accountRole === 'realtor' ? 'Realtor' : 'Buyer'),
      role: accountRole,
    };

    let profileResult = await supabase.from('profiles').insert([fullProfilePayload]).select();

    if (profileResult.error && /column|schema cache/i.test(profileResult.error.message || '')) {
      profileResult = await supabase
        .from('profiles')
        .insert([{ id: authUser.user.id, email, role: accountRole }])
        .select();
    }

    if (profileResult.error) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return res.status(400).json({ error: profileResult.error.message });
    }

    const profile = profileResult.data?.[0];

    // All user data (including realtor info) is now in profiles table
    // No separate agents table needed - profiles table is single source of truth

    return res.status(201).json({
      success: true,
      user: authUser.user,
      profile: profile,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
