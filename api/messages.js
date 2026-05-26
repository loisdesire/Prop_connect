import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { sender_id, receiver_id, property_id } = req.query;
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
      
      if (sender_id && receiver_id) {
        query = query.or(`and(sender_id.eq.${sender_id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${sender_id})`);
      }
      if (property_id) query = query.eq('property_id', property_id);
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    
    if (req.method === 'POST') {
      const { sender_id, sender_name, receiver_id, receiver_name, property_id, property_title, content } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: String(sender_id || 'unknown'),
          sender_name: String(sender_name || 'Someone'),
          receiver_id: String(receiver_id || 'unknown'),
          receiver_name: String(receiver_name || 'Someone'),
          property_id: property_id ? parseInt(property_id) : null,
          property_title: property_title || null,
          content: String(content).trim(),
          read: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
      const { error } = await supabase.from('messages').update({ read: true }).in('id', ids);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Messages API error:', err);
    res.status(500).json({ error: err.message });
  }
}
