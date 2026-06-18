import supabase from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return res.status(400).json({ error: profileError.message });
    }

    if (profile) {
      return res.status(200).json({
        exists: true,
        profile,
        message: 'Profile found in database',
      });
    }

    // Profile doesn't exist, try to get the auth user and create profile
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      return res.status(400).json({ error: usersError.message });
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      return res.status(404).json({
        exists: false,
        message: 'User not found in auth or profiles',
      });
    }

    // Auth user exists but profile doesn't - create it with minimal fields
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id,
          email,
          first_name: authUser.user_metadata?.first_name || 'New',
          last_name: authUser.user_metadata?.last_name || 'Realtor',
          role: 'realtor',
        },
      ])
      .select();

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    return res.status(201).json({
      exists: false,
      created: true,
      profile: newProfile[0],
      message: 'Profile created from existing auth user',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
