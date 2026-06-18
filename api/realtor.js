import supabase from './_supabase.js';

const buildAgentFromProfile = (profile, fallbackEmail) => {
  const name = profile.first_name || profile.full_name || (profile.email || fallbackEmail || '').split('@')[0] || 'Realtor';
  return {
    name,
    email: profile.email || fallbackEmail || '',
    phone: profile.phone || '',
    bio: profile.bio || 'Realtor on PropConnect',
    company: profile.company || '',
    license: profile.license || '',
    rating: 5,
    reviews_count: 0,
  };
};

const isGenericBuyerLabel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || ['buyer', 'realtor', 'agent', 'someone', 'unknown', 'unknown buyer'].includes(normalized);
};

const resolveLeadName = (message, profileById) => {
  const profile = profileById.get(String(message.sender_id));
  const profileName = profile?.first_name || profile?.full_name || '';
  if (profileName) return profileName;

  const messageName = String(message.sender_name || '').trim();
  if (!isGenericBuyerLabel(messageName)) return messageName;

  if (profile?.email) return profile.email.split('@')[0];
  return 'Buyer';
};

const resolveAgentForRealtor = async ({ agentId, email }) => {
  // Try to find realtor profile by UUID first
  if (agentId && typeof agentId === 'string') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', agentId)
      .maybeSingle();
    if (profile) return { id: profile.id, ...buildAgentFromProfile(profile) };
  }

  // Try to find realtor profile by email
  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('role', 'realtor')
      .maybeSingle();
    if (profile) return { id: profile.id, ...buildAgentFromProfile(profile) };
  }

  // Realtor not found - that's okay, return null and caller will handle
  return null;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const requestedAgentId = typeof req.query.agent_id === 'string' && req.query.agent_id ? req.query.agent_id : null;
    const requestedEmail = typeof req.query.email === 'string' ? req.query.email : '';

    if (req.method === 'GET') {
      try {
        const agent = await resolveAgentForRealtor({ agentId: requestedAgentId, email: requestedEmail });
        const AGENT_ID = agent?.id || requestedAgentId || null;
        if (!AGENT_ID) return res.status(400).json({ error: 'Unable to resolve agent' });

        // Return complete realtor dashboard data in one call
        const [propsRes, txnsRes, msgsRes] = await Promise.all([
          supabase.from('properties').select('*').eq('agent_id', AGENT_ID).order('created_at', { ascending: false }),
          supabase.from('transactions').select('*, properties(*)').eq('agent_id', AGENT_ID).order('created_at', { ascending: false }),
          supabase.from('messages').select('*').or(`receiver_id.eq.${AGENT_ID},sender_id.eq.agent-${AGENT_ID}`).order('created_at', { ascending: false }).limit(50),
        ]);

        const properties = propsRes.data || [];
        const transactions = txnsRes.data || [];
        const messages = msgsRes.data || [];

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

      const buyerSenderIds = [...new Set(messages
        .map(m => String(m.sender_id || '').trim())
        .filter(senderId => senderId && senderId !== `agent-${AGENT_ID}` && senderId !== String(AGENT_ID)))];

      let profileById = new Map();
      if (buyerSenderIds.length > 0) {
        const { data: buyerProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', buyerSenderIds);
        profileById = new Map((buyerProfiles || []).map(profile => [String(profile.id), profile]));
      }

      // Recent leads (unique buyers who messaged)
      const leadMap = new Map();
      messages.forEach(m => {
        const senderId = m.sender_id !== `agent-${AGENT_ID}` ? m.sender_id : m.receiver_id;
        if (!leadMap.has(senderId)) {
          leadMap.set(senderId, {
            id: senderId,
            name: resolveLeadName(m, profileById),
            property: m.property_title,
            lastMessage: m.content,
            lastDate: m.created_at,
            messageCount: 1,
          });
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
        agent: agent || { id: AGENT_ID, name: 'Realtor', email: '', phone: '', bio: '', company: '', license: '', rating: 5, reviews_count: 0 },
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
      } catch (getErr) {
        console.error('[realtor.js GET] Error:', getErr);
        return res.status(500).json({ error: getErr.message || String(getErr) });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Realtor API error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
