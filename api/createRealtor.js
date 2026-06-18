import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, firstName, lastName, company, license } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        role: 'realtor',
        first_name: firstName || 'New',
        last_name: lastName || 'Realtor',
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile with column-missing resilience
    const fullProfilePayload = {
      id: authUser.id,
      email,
      first_name: firstName || 'New',
      last_name: lastName || 'Realtor',
      role: 'realtor',
    };

    let profileResult = await supabase.from('profiles').insert([fullProfilePayload]).select();

    if (profileResult.error && /column|schema cache/i.test(profileResult.error.message || '')) {
      profileResult = await supabase
        .from('profiles')
        .insert([{ id: authUser.id, email, role: 'realtor' }])
        .select();
    }

    if (profileResult.error) {
      await supabase.auth.admin.deleteUser(authUser.id);
      return res.status(400).json({ error: profileResult.error.message });
    }

    const profile = profileResult.data?.[0];

    // All realtor data is now in profiles table - no separate agents table needed
    // Return success with profile
    console.log(`[createRealtor] Realtor account created for ${email}`);
    return res.status(201).json({
      userId: authUser.id,
      email,
      role: 'realtor',
      profile,
      message: 'Realtor account created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
