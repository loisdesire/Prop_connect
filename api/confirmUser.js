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
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return res.status(400).json({ error: listError.message });
    }

    const authUser = usersData.users.find(user => user.email === email);
    if (!authUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      user: data.user,
      message: 'User confirmed',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
