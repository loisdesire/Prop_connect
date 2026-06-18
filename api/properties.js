import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, type, minPrice, maxPrice, bedrooms, bathrooms, city, status, search, limit = '20', offset = '0' } = req.query;
      
      let query = supabase.from('properties').select('*', { count: 'exact' });
      if (id) query = query.eq('id', parseInt(id));
      
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (bedrooms) query = query.gte('bedrooms', parseInt(bedrooms));
      if (bathrooms) query = query.gte('bathrooms', parseFloat(bathrooms));
      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
      if (city) query = query.ilike('city', `%${city}%`);
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      
      if (error) throw error;
      
      // Fetch agent profiles for enrichment
      const agentIds = [...new Set((data || []).map(p => p.agent_id).filter(Boolean))];
      let agentMap = {};
      
      if (agentIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', agentIds)
          .eq('role', 'realtor');
        
        if (profilesData) {
          agentMap = Object.fromEntries(
            profilesData.map(p => {
              const displayName = p.first_name || p.full_name || ((p.email || '').split('@')[0] || 'Agent') || 'Agent';
              return [p.id, {
                id: p.id,
                name: displayName,
                email: p.email || '',
                phone: p.phone || '',
                bio: p.bio || '',
                company: p.company || '',
                license: p.license || '',
                rating: 5,
                reviews_count: 0,
                avatar_url: p.avatar_url || null,
              }];
            })
          );
        }
      }
      
      // Attach agent info to each property
      const enriched = (data || []).map(p => ({
        ...p,
        agents: p.agent_id ? (agentMap[p.agent_id] || null) : null,
      }));
      
      return res.status(200).json({ data: enriched, count: count || 0 });
    }
    
    if (req.method === 'POST') {
      const { agent_id, title, description, price, bedrooms, bathrooms, sqft, address, city, state, zip, lat, lng, type, images, features } = req.body;

      if (!agent_id) {
        return res.status(400).json({ error: 'agent_id is required' });
      }

      if (!title || !price) {
        return res.status(400).json({ error: 'title and price are required' });
      }

      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'At least one property image is required' });
      }
      
      const { data, error } = await supabase
        .from('properties')
        .insert({ 
          agent_id, title, description, price, bedrooms, bathrooms, sqft, address, city, state, zip, lat, lng, type,
          images: images || [], features: features || [], status: 'available' 
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Properties API error:', err);
    res.status(500).json({ error: err.message });
  }
}
