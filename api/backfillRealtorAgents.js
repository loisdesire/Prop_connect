import supabase from './_supabase.js';

const buildAgentPayload = (profile) => ({
  name: profile.first_name || profile.full_name || profile.email?.split('@')[0] || 'Realtor',
  email: profile.email,
  phone: profile.phone || '',
  bio: profile.bio || 'Realtor on PropConnect',
  company: profile.company || '',
  license: profile.license || '',
  rating: 5,
  reviews_count: 0,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: realtorProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'realtor');

    if (profilesError) throw profilesError;

    const { data: existingAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id, email');

    if (agentsError) throw agentsError;

    const existingEmails = new Set((existingAgents || []).map((agent) => String(agent.email || '').toLowerCase()));
    const missingProfiles = (realtorProfiles || []).filter((profile) => profile.email && !existingEmails.has(String(profile.email).toLowerCase()));

    const created = [];
    const skipped = [];

    for (const profile of missingProfiles) {
      const { data, error } = await supabase
        .from('agents')
        .insert(buildAgentPayload(profile))
        .select()
        .single();

      if (error) {
        skipped.push({ email: profile.email, error: error.message });
        continue;
      }

      created.push(data);
    }

    return res.status(200).json({
      ok: true,
      scanned: realtorProfiles?.length || 0,
      alreadyLinked: (existingAgents || []).length,
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
}