import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [m, p, t] = await Promise.all([
      supabase.from('messages').delete().gte('id', 0),
      supabase.from('properties').delete().gte('id', 0),
      supabase.from('transactions').delete().gte('id', 0),
    ]);

    const errors = [m.error, p.error, t.error].filter(Boolean);
    if (errors.length) {
      console.error('clearDatabase errors:', errors);
      return res.status(500).json({ error: errors.map(e => e.message).join('; ') });
    }

    return res.status(200).json({ ok: true, cleared: ['messages', 'properties', 'transactions'] });
  } catch (err) {
    console.error('clearDatabase error:', err);
    return res.status(500).json({ error: err.message });
  }
}
