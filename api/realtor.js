import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // For demo, we use agent_id=1 as the logged-in realtor
    const AGENT_ID = 1;

    if (req.method === 'GET') {
      // Return complete realtor dashboard data in one call
      const [propsRes, txnsRes, msgsRes, agentRes] = await Promise.all([
        supabase.from('properties').select('*').eq('agent_id', AGENT_ID).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*, properties(*)').eq('agent_id', AGENT_ID).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').or(`receiver_id.eq.${AGENT_ID},sender_id.eq.agent-${AGENT_ID}`).order('created_at', { ascending: false }).limit(50),
        supabase.from('agents').select('*').eq('id', AGENT_ID).single(),
      ]);

      const properties = propsRes.data || [];
      const transactions = txnsRes.data || [];
      const messages = msgsRes.data || [];
      const agent = agentRes.data;

      // Compute stats
      const activeListings = properties.filter(p => p.status === 'available').length;
      const pendingListings = properties.filter(p => p.status === 'pending').length;
      const soldListings = properties.filter(p => p.status === 'sold').length;
      const totalValue = properties.reduce((sum, p) => sum + Number(p.price || 0), 0);
      const avgPrice = properties.length > 0 ? totalValue / properties.length : 0;

      const completedTxns = transactions.filter(t => t.status === 'completed');
      const pendingTxns = transactions.filter(t => t.status !== 'completed');
      const totalEarnings = completedTxns.reduce((sum, t) => sum + Number(t.amount || 0) * 0.03, 0); // 3% commission
      const pendingEarnings = pendingTxns.reduce((sum, t) => sum + Number(t.amount || 0) * 0.03, 0);

      // Unread messages count
      const unreadMessages = messages.filter(m => !m.read && String(m.receiver_id) === String(AGENT_ID)).length;

      // Recent leads (unique buyers who messaged)
      const leadMap = new Map();
      messages.forEach(m => {
        const senderId = m.sender_id !== `agent-${AGENT_ID}` ? m.sender_id : m.receiver_id;
        if (!leadMap.has(senderId)) {
          leadMap.set(senderId, { name: m.sender_name || 'Unknown Buyer', property: m.property_title, lastMessage: m.content, lastDate: m.created_at, messageCount: 1 });
        } else {
          leadMap.get(senderId).messageCount++;
        }
      });
      const leads = Array.from(leadMap.values());

      // Monthly performance (last 6 months)
      const now = new Date();
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const monthProps = properties.filter(p => {
          const pd = new Date(p.created_at);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        });
        const monthTxns = completedTxns.filter(t => {
          const td = new Date(t.created_at);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });
        monthlyData.push({
          month: monthName,
          listings: monthProps.length,
          sales: monthTxns.length,
          revenue: monthTxns.reduce((s, t) => s + Number(t.amount || 0) * 0.03, 0),
        });
      }

      return res.status(200).json({
        agent,
        stats: {
          activeListings,
          pendingListings,
          soldListings,
          totalProperties: properties.length,
          totalValue,
          avgPrice,
          totalTransactions: transactions.length,
          pendingTransactions: pendingTxns.length,
          completedTransactions: completedTxns.length,
          totalEarnings,
          pendingEarnings,
          unreadMessages,
          totalLeads: leads.length,
        },
        properties,
        transactions,
        messages: messages.slice(0, 20),
        leads,
        monthlyPerformance: monthlyData,
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Realtor API error:', err);
    res.status(500).json({ error: err.message });
  }
}
