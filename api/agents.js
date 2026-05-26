import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, limit = '20' } = req.query;
      
      if (id) {
        const { data: agent, error } = await supabase
          .from('agents')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        
        // Get agent's properties
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .eq('agent_id', parseInt(id))
          .order('created_at', { ascending: false });
        
        return res.status(200).json({ ...agent, properties: props || [] });
      }
      
      const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .order('rating', { ascending: false })
        .limit(parseInt(limit));
      
      if (error) throw error;
      
      // Attach properties count and sample listings to each agent
      if (agents && agents.length > 0) {
        const agentIds = agents.map(a => a.id);
        const { data: allProps } = await supabase
          .from('properties')
          .select('*')
          .in('agent_id', agentIds);
        
        const propsByAgent = {};
        (allProps || []).forEach(p => {
          if (!propsByAgent[p.agent_id]) propsByAgent[p.agent_id] = [];
          propsByAgent[p.agent_id].push(p);
        });
        
        agents.forEach(agent => {
          agent.properties = propsByAgent[agent.id] || [];
        });
      }
      
      return res.status(200).json(agents || []);
    }
    
    if (req.method === 'POST') {
      const { name, email, phone, bio, company, license, avatar } = req.body;
      const { data, error } = await supabase
        .from('agents')
        .insert({ name, email, phone, bio, company, license, avatar, rating: 5.0, reviews_count: 0 })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Agents API error:', err);
    res.status(500).json({ error: err.message });
  }
}
