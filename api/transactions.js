import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { buyer_id, agent_id, property_id, status } = req.query;
      let query = supabase.from('transactions').select('*, properties(*), agents(*)').order('created_at', { ascending: false });
      
      if (buyer_id) query = query.eq('buyer_id', buyer_id);
      if (agent_id) query = query.eq('agent_id', agent_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (status) query = query.eq('status', status);
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    
    if (req.method === 'POST') {
      const { property_id, buyer_id, buyer_name, agent_id, amount } = req.body;
      
      // Get property details
      const { data: prop } = await supabase.from('properties').select('*').eq('id', property_id).single();
      
      const milestones = [
        { name: 'Earnest Money Deposit', amount: Math.round(amount * 0.03), status: 'pending', description: 'Good faith deposit to show serious intent' },
        { name: 'Inspection Contingency', amount: 0, status: 'pending', description: 'Home inspection period - funds released upon approval' },
        { name: 'Appraisal & Title', amount: Math.round(amount * 0.02), status: 'pending', description: 'Professional appraisal and title search fees' },
        { name: 'Closing & Final Payment', amount: Math.round(amount * 0.95), status: 'pending', description: 'Final payment at closing - releases to seller' }
      ];
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          property_id,
          buyer_id,
          buyer_name,
          agent_id,
          amount,
          status: 'escrow',
          milestones,
          current_milestone: 0
        })
        .select('*, properties(*), agents(*)')
        .single();
      
      if (error) throw error;
      
      // Update property status
      await supabase.from('properties').update({ status: 'pending' }).eq('id', property_id);
      
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { id, action, milestone_index } = req.body;
      
      const { data: txn } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (!txn) return res.status(404).json({ error: 'Transaction not found' });
      
      if (action === 'advance_milestone') {
        const milestones = [...txn.milestones];
        const idx = milestone_index ?? txn.current_milestone;
        milestones[idx].status = 'completed';
        
        const nextMilestone = idx + 1;
        const newStatus = nextMilestone >= milestones.length ? 'completed' : 
                          nextMilestone === 1 ? 'inspection' :
                          nextMilestone === 2 ? 'appraisal' : 'escrow';
        
        const { data, error } = await supabase
          .from('transactions')
          .update({ milestones, current_milestone: nextMilestone, status: newStatus })
          .eq('id', id)
          .select('*, properties(*), agents(*)')
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      
      if (action === 'complete') {
        const { data, error } = await supabase
          .from('transactions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', id)
          .select('*, properties(*), agents(*)')
          .single();
        if (error) throw error;
        
        await supabase.from('properties').update({ status: 'sold' }).eq('id', txn.property_id);
        
        return res.status(200).json(data);
      }
      
      res.status(400).json({ error: 'Invalid action' });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
