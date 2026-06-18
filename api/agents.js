import supabase from './_supabase.js';

// Fetch agents from profiles table (realtors) - single source of truth

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, limit = '20' } = req.query;

      // If specific id requested, fetch from profiles
      if (id) {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (profile) {
          const name = profile.first_name || profile.full_name || (profile.email || '').split('@')[0] || 'Agent';
          
          // Fetch properties for this agent
          const { data: props } = await supabase
            .from('properties')
            .select('*')
            .eq('agent_id', id)
            .order('created_at', { ascending: false });

          return res.status(200).json({
            id: profile.id,
            name,
            email: profile.email,
            phone: profile.phone || '',
            bio: profile.bio || '',
            company: profile.company || '',
            license: profile.license || '',
            rating: 5,
            reviews_count: 0,
            avatar_url: profile.avatar_url || null,
            properties: props || [],
          });
        }

        if (profileErr) throw profileErr;
        return res.status(404).json({ error: 'Agent not found' });
      }

      // List all realtors from profiles table
      const { data: realtors, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'realtor')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit, 10));

      if (error) {
        console.error('[agents.js] Realtors list lookup error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch agents' });
      }

      // Fetch properties for all realtors
      const realtorIds = (realtors || []).map((r) => r.id);
      const { data: allProps } = realtorIds.length
        ? await supabase
            .from('properties')
            .select('*')
            .in('agent_id', realtorIds)
        : { data: [] };

      const propsByAgent = {};
      (allProps || []).forEach((property) => {
        if (!propsByAgent[property.agent_id]) propsByAgent[property.agent_id] = [];
        propsByAgent[property.agent_id].push(property);
      });

      const enrichedAgents = (realtors || []).map((realtor) => {
        const name = realtor.first_name || realtor.full_name || (realtor.email || '').split('@')[0] || 'Agent';
        return {
          id: realtor.id,
          name,
          email: realtor.email,
          phone: realtor.phone || '',
          bio: realtor.bio || '',
          company: realtor.company || '',
          license: realtor.license || '',
          rating: 5,
          reviews_count: 0,
          avatar_url: realtor.avatar_url || null,
          properties: propsByAgent[realtor.id] || [],
        };
      });

      return res.status(200).json(enrichedAgents || []);
    }

    if (req.method === 'POST') {
      // POST requests go to createRealtor.js instead
      return res.status(405).json({ error: 'Use POST /api/createRealtor instead' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[agents.js] Error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
