import { useState, useEffect } from 'react';
import { Home, TrendingUp, DollarSign, Users, Eye, Plus, ArrowUpRight, Clock, CheckCircle, AlertCircle, Shield as ShieldIcon, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import supabase from '../lib/supabase';
import { safeNum } from '../lib/utils';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [propsRes, txnRes] = await Promise.all([
          fetch('/api/properties?limit=5'),
          fetch('/api/transactions'),
        ]);
        if (cancelled) return;

        const propsData = await propsRes.json();
        const txnData = await txnRes.json();

        setProperties(Array.isArray(propsData.data) ? propsData.data : []);
        setTransactions(Array.isArray(txnData) ? txnData : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Load current user's first name for a personalized welcome
  useEffect(() => {
    let cancelled = false;
    const loadName = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (cancelled) return;
        setFirstName(profileData?.first_name || null);
      } catch (err) {
        // ignore
      }
    };
    void loadName();
    return () => { cancelled = true; };
  }, []);

  const availableCount = properties.filter(p => p.status === 'available').length;
  const totalValue = properties.reduce((sum, p) => sum + safeNum(p.price, 0), 0);
  const inEscrowCount = transactions.filter(t => t.status !== 'completed').length;

  const stats = [
    { label: 'Active Listings', value: String(availableCount), icon: Home, color: 'blue', change: '+2 this week' },
    { label: 'Total Value', value: `₦${(totalValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'emerald', change: '+12%' },
    { label: 'In Escrow', value: String(inEscrowCount), icon: ShieldIcon, color: 'violet', change: `${inEscrowCount} pending` },
    { label: 'Total Views', value: '12.4K', icon: Eye, color: 'amber', change: '+23%' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back{firstName ? `, ${firstName}` : ''}! Here's your real estate overview.</p>
          </div>
          <button onClick={() => onNavigate('listings')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25">
            <Plus className="w-5 h-5" /> New Listing
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, change }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Listings */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Listings</h2>
              <button onClick={() => onNavigate('listings')} className="text-sm text-blue-600 font-medium hover:text-blue-700">View All →</button>
            </div>
            <div className="divide-y divide-gray-50">
              {properties.length > 0 ? properties.slice(0, 5).map((prop) => (
                <div key={prop.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => onNavigate('listings')}>
                  <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    <img src={`https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=80&fit=crop`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{prop.title || 'Untitled Property'}</h3>
                    <p className="text-xs text-gray-500">{prop.city || ''}, {prop.state || ''} · {prop.bedrooms ?? '-'}bd/{prop.bathrooms ?? '-'}ba</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm">₦{safeNum(prop.price, 0).toLocaleString('en-NG')}</div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      prop.status === 'available' ? 'bg-green-50 text-green-600' :
                      prop.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{prop.status || 'unknown'}</span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-400 text-sm">No listings yet</div>
              )}
            </div>
          </div>

          {/* Transaction Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Transaction Activity</h2>
            </div>
            <div className="p-5 space-y-4">
              {transactions.length > 0 ? transactions.slice(0, 4).map((txn: any) => (
                <div key={txn.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    txn.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                    txn.status === 'escrow' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {txn.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                     txn.status === 'escrow' ? <Clock className="w-4 h-4" /> :
                     <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{txn.status}</p>
                    <p className="text-xs text-gray-500">₦{safeNum(txn.amount, 0).toLocaleString('en-NG')}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <ShieldIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No transactions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start an escrow from any property listing</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: 'Browse Properties', icon: Home, page: 'listings' },
            { label: 'View Agents', icon: Users, page: 'agents' },
            { label: 'Messages', icon: MessageSquare, page: 'messages' },
            { label: 'Escrow Info', icon: ShieldIcon, page: 'escrow' },
          ].map(({ label, icon: Icon, page }) => (
            <button key={page} onClick={() => onNavigate(page)} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition group">
              <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition"><Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" /></div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

