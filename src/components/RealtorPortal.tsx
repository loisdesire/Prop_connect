import { useState, useEffect } from 'react';
import { 
  Home, TrendingUp, DollarSign, MessageSquare, Users, Eye, Plus, Edit3, Trash2, 
  ArrowUpRight, Clock, CheckCircle, AlertCircle, Send, BarChart3, 
  Calendar, Star, Package, Target, ArrowRight, ChevronDown, ChevronUp,
  Briefcase, Heart, Filter, LogOut, Settings, Bell, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Property as PropertyType } from '../types';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

interface RealtorPortalProps {
  onBack: () => void;
}

interface DashboardData {
  agent: any;
  stats: any;
  properties: any[];
  transactions: any[];
  messages: any[];
  leads: any[];
  monthlyPerformance: any[];
}

const safeNum = (v: any, fallback: number): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? fallback : n; }
  return fallback;
};

const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type SubPage = 'overview' | 'listings' | 'leads' | 'transactions' | 'earnings';

export default function RealtorPortal({ onBack }: RealtorPortalProps) {
  const navigate = useNavigate();
  const [subPage, setSubPage] = useState<SubPage>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewListing, setShowNewListing] = useState(false);
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  
  useEffect(() => {
    fetch('/api/realtor')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const s = data?.stats || {};
  const agent = data?.agent || {};

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  // ─── SUB-PAGE RENDERERS ──────────────────────────────

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
              {(agent.name || '?').split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {agent.name || 'Agent'}!</h1>
              <p className="text-blue-100 mt-1">{agent.company || ''} · Here's your business overview</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-lg text-sm">
                  <Star className="w-4 h-4 text-amber-300" /> {agent.rating || '5.0'} rating
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-lg text-sm">
                  <Briefcase className="w-4 h-4" /> {s.totalProperties || 0} listings
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowNewListing(true)} className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition shadow-lg">
            <Plus className="w-5 h-5" /> New Listing
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Listings', value: String(s.activeListings || 0), icon: Home, color: 'blue', change: `${s.pendingListings || 0} pending`, subLabel: 'on market' },
          { label: 'Total Leads', value: String(s.totalLeads || 0), icon: Users, color: 'emerald', change: `${s.unreadMessages || 0} new messages`, subLabel: 'buyer inquiries' },
          { label: 'In Escrow', value: String(s.pendingTransactions || 0), icon: Clock, color: 'amber', change: `$${formatCurrency(s.pendingEarnings || 0)} pending`, subLabel: 'awaiting close' },
          { label: 'Total Earned', value: formatCurrency(s.totalEarnings || 0), icon: DollarSign, color: 'purple', change: `${s.completedTransactions || 0} closed deals`, subText: true },
        ].map(({ label, value, icon: Icon, color, change, subLabel, subText }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${subText ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {change}
              </span>
            </div>
            <div className={`text-2xl font-bold text-gray-900 ${subText ? 'text-xl text-purple-700' : ''}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}{subLabel ? ` · ${subLabel}` : ''}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Listings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-blue-500" /> My Listings</h2>
            <button onClick={() => setSubPage('listings')} className="text-sm text-blue-600 font-medium hover:text-blue-700">View All →</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
            {(data?.properties || []).slice(0, 5).map((prop: any) => (
              <div key={prop.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition">
                <div className="w-14 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  <img src={"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&amp;h=60&amp;fit=crop"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p>
                  <p className="text-xs text-gray-500">{prop.city}, {prop.state}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-900">${safeNum(prop.price, 0).toLocaleString()}</div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${prop.status === 'available' ? 'bg-green-50 text-green-600' : prop.status === 'pending' ? 'bg-amber-50 text-amber-600' : prop.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-500'}`}>
                    {prop.status}
                  </span>
                </div>
              </div>
            ))}
            {(data?.properties || []).length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" /> No listings yet</div>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> Recent Leads</h2>
            <button onClick={() => setSubPage('leads')} className="text-sm text-blue-600 font-medium hover:text-blue-700">View All →</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
            {(data?.leads || []).slice(0, 5).map((lead: any, idx: number) => (
              <div key={idx} className="p-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => setExpandedLead(expandedLead === idx ? null : idx)}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {(lead.name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                      <span className="text-xs text-gray-400">{formatDate(lead.lastDate)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{lead.property ? `Interested in: ${lead.property}` : 'General inquiry'}</p>
                    <AnimatePresence>{expandedLead === idx && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">\u201C{lead.lastMessage}\u201D</p>
                        <div className="flex gap-2 mt-2">
                          <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send className="w-3 h-3 mr-1" /> Reply</button>
                          <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">View Profile</button>
                        </div>
                      </motion.div>
                    )}</AnimatePresence>
                  </div>
                </div>
              </div>
            ))}
            {(data?.leads || []).length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /> No leads yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      {(() => { const mp = data?.monthlyPerformance || []; return mp.length > 0; })() && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-500" /> Monthly Performance</h2>
          <div className="flex items-end gap-3 h-48">
            {(data!.monthlyPerformance).map((m: any, i: number) => {
              const maxRevenue = Math.max(...(data!.monthlyPerformance).map((x: any) => x.revenue), 1);
              const heightPct = Math.max((m.revenue / maxRevenue) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-purple-600">{m.revenue > 0 ? formatCurrency(m.revenue) : '-'}</span>
                  <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '140px' }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${heightPct}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{m.month}</span>
                  <div className="flex gap-1 text-xs text-gray-400">
                    <span>{m.listings}L</span>·<span>{m.sales}S</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">My Listings</h2><p className="text-sm text-gray-500 mt-1">Manage all your property listings</p></div>
        <button onClick={() => setShowNewListing(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"><Plus className="w-5 h-5" /> Add New Listing</button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {[{ label: 'All', filter: null }, { label: `Active (${s.activeListings || 0})`, filter: 'available' }, { label: `Pending (${s.pendingListings || 0})`, filter: 'pending' }, { label: `Sold (${s.soldListings || 0})`, filter: 'sold' }].map(tab => (
          <button key={tab.label} className="px-4 py-2 text-sm font-medium rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition">{tab.label}</button>
        ))}
      </div>

      {/* Listings Grid/Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Property', 'Location', 'Price', 'Status', 'Views', 'Leads', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.properties || []).map((prop: any) => (
                <tr key={prop.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&amp;h=60&amp;fit=crop"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="max-w-[220px]"><p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p><p className="text-xs text-gray-400 capitalize">{prop.type}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{prop.city}, {prop.state}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">${safeNum(prop.price, 0).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${prop.status === 'available' ? 'bg-green-50 text-green-600' : prop.status === 'pending' ? 'bg-amber-50 text-amber-600' : prop.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>
                      {prop.status === 'available' ? '● Active' : prop.status === 'pending' ? '● Pending' : prop.status === 'sold' ? '✓ Sold' : '○ Off Market'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{Math.floor(Math.random() * 500 + 50)}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{Math.floor(Math.random() * 15)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Promote"><Zap className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.properties || []).length === 0 && (
          <div className="p-12 text-center text-gray-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No listings yet. Create your first one!</p></div>
        )}
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">Buyer Leads</h2><p className="text-sm text-gray-500 mt-1">People interested in your properties</p></div>
        <div className="relative"><Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input placeholder="Search leads..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" /></div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.leads || []).map((lead: any, idx: number) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">{(lead.name || '?')[0]}</div>
                <div>
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-400">{lead.messageCount || 1} message{(lead.messageCount || 1) !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{formatDate(lead.lastDate)}</span>
            </div>
            {lead.property && (
              <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 truncate">
                <Home className="w-3 h-3 inline mr-1" /> {lead.property}
              </div>
            )}
            <p className="text-sm text-gray-500 line-clamp-2 mb-4">\u201C{lead.lastMessage}\u201D</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1.5"><Send className="w-4 h-4" /> Reply</button>
              <button className="py-2 px-3 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"><Eye className="w-4 h-4" /></button>
            </div>
          </motion.div>
        ))}
        {(data?.leads || []).length === 0 && (
          <div className="col-span-3 p-12 text-center text-gray-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No leads yet. They'll appear when buyers contact you.</p></div>
        )}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">Transaction Pipeline</h2><p className="text-sm text-gray-500 mt-1">Track every deal from escrow to closing</p></div>

      {/* Pipeline Visual */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { stage: 'Escrow Initiated', count: data?.transactions?.filter((t: any) => t.status === 'escrow').length || 0, color: 'blue', icon: ShieldIcon },
          { stage: 'Inspection', count: data?.transactions?.filter((t: any) => t.status === 'inspection').length || 0, color: 'amber', icon: AlertCircle },
          { stage: 'Appraisal', count: data?.transactions?.filter((t: any) => t.status === 'appraisal').length || 0, color: 'purple', icon: FileCheckIcon },
          { stage: 'Completed', count: data?.transactions?.filter((t: any) => t.status === 'completed').length || 0, color: 'emerald', icon: CheckCircle },
        ].map(({ stage, count, color, icon: Icon }) => (
          <div key={stage} className={`bg-${color}-50 border border-${color}-200 rounded-2xl p-5 text-center`}>
            <Icon className={`w-8 h-8 text-${color}-500 mx-auto mb-2`} />
            <div className={`text-3xl font-bold text-${color}-700`}>{count}</div>
            <div className={`text-sm text-${color}-600 mt-1`}>{stage}</div>
          </div>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {(data?.transactions || []).map((txn: any) => (
            <div key={txn.id} className="p-5 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : txn.status === 'escrow' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {txn.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{txn.properties?.title || `Transaction #${txn.id}`}</p>
                    <p className="text-sm text-gray-500">{txn.buyer_name || 'Buyer'} · {formatDate(txn.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">${safeNum(txn.amount, 0).toLocaleString()}</div>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded ${txn.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{txn.status}</span>
                    <span className="text-xs text-gray-400">· 3% = ${formatCurrency(safeNum(txn.amount, 0) * 0.03)}</span>
                  </div>
                </div>
              </div>
              {/* Milestone Progress Bar */}
              {txn.milestones && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {(Array.isArray(txn.milestones) ? txn.milestones : JSON.parse(txn.milestones || '[]')).map((ms: any, mi: number) => (
                      <div key={mi} className={`flex-1 h-2 rounded-full ${ms.status === 'completed' ? 'bg-emerald-400' : ms.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {(Array.isArray(txn.milestones) ? txn.milestones : JSON.parse(txn.milestones || '[]')).map((ms: any, mi: number) => (
                      <span key={mi} className={`text-[10px] ${ms.status === 'completed' ? 'text-emerald-500' : 'text-gray-400'}`}>{ms.name?.split(' ')[0]}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {(data?.transactions || []).length === 0 && (
            <div className="p-12 text-center text-gray-400"><Target className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>No transactions yet. Start an escrow from any property.</p></div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">Earnings & Commissions</h2><p className="text-sm text-gray-500 mt-1">Your commission income at a glance</p></div>

      {/* Big Numbers */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Earned', amount: s.totalEarnings || 0, color: 'emerald', desc: 'From closed deals' },
          { label: 'Pending', amount: s.pendingEarnings || 0, color: 'blue', desc: 'In escrow pipeline' },
          { label: 'Projected Annual', amount: ((s.totalEarnings || 0) / 6 * 12), color: 'purple', desc: 'Based on YTD trend' },
        ].map(({ label, amount, color, desc }) => (
          <div key={label} className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-6 border border-${color}-200`}>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-3xl font-bold text-${color}-700 mt-1`}>{formatCurrency(amount)}</p>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Payouts</h3>
        <div className="space-y-3">
          {[
            { date: 'Jan 31, 2025', amount: s.totalEarnings ? s.totalEarnings * 0.7 : 0, status: 'Paid', method: 'Direct Deposit' },
            { date: 'Dec 31, 2024', amount: 12750, status: 'Paid', method: 'Direct Deposit' },
            { date: 'Nov 30, 2024', amount: 9820, status: 'Paid', method: 'Direct Deposit' },
            { date: 'Oct 31, 2024', amount: 11200, status: 'Paid', method: 'Direct Deposit' },
          ].map((payout, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                <div><p className="text-sm font-medium text-gray-900">{payout.date}</p><p className="text-xs text-gray-400">{payout.method}</p></div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</p>
                <span className="text-xs font-medium text-emerald-600">{payout.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Commission Structure</h3>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { tier: 'Standard Sale', rate: '3%', range: '$0 - $2M' },
            { tier: 'Premium', rate: '2.5%', range: '$2M - $5M' },
            { tier: 'Ultra Premium', rate: '2%', range: '$5M+' },
          ].map(t => (
            <div key={t.tier} className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{t.rate}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{t.tier}</p>
              <p className="text-xs text-gray-400">{t.range}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-700/70 mt-4">Commissions are paid within 24 hours of transaction completion via direct deposit to your registered bank account.</p>
      </div>
    </div>
  );

  // ─── NEW LISTING MODAL ────────────────────────────────

  const [newListing, setNewListing] = useState({ title: '', price: '', bedrooms: '', bathrooms: '', sqft: '', address: '', city: '', state: '', zip: '', type: 'house', description: '' });

  const handleCreateListing = async () => {
    if (!newListing.title || !newListing.price) return alert('Title and price are required');
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newListing, agent_id: 1, images: [], features: [] }),
      });
      if (!res.ok) throw new Error('Failed to create');
      setShowNewListing(false);
      setNewListing({ title: '', price: '', bedrooms: '', bathrooms: '', sqft: '', address: '', city: '', state: '', zip: '', type: 'house', description: '' });
      // Refresh data
      const d = await fetch('/api/realtor').then(r => r.json());
      setData(d);
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // ─── MAIN RENDER ───────────────────────────────────────

  const navItems: { id: SubPage; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'listings', label: 'Listings', icon: Package },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'transactions', label: 'Deals', icon: Target },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-500">Loading your portal...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition text-sm font-medium">
                ← Back to Marketplace
              </button>
              <div className="hidden sm:block w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 hidden sm:block">Realtor Portal</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setSubPage(item.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${subPage === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition">
                <Bell className="w-5 h-5" />
                {(s.unreadMessages || 0) > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />}
              </button>
              <button onClick={handleSignOut} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
                {(agent.name || '?').split(' ').map((n: string) => n[0]).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 py-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setSubPage(item.id)} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${subPage === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 bg-gray-50'}`}>
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {subPage === 'overview' && renderOverview()}
        {subPage === 'listings' && renderListings()}
        {subPage === 'leads' && renderLeads()}
        {subPage === 'transactions' && renderTransactions()}
        {subPage === 'earnings' && renderEarnings()}
      </div>

      {/* New Listing Modal */}
      <AnimatePresence>
        {showNewListing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewListing(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Listing</h2>
                <button onClick={() => setShowNewListing(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Trash2 className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Property Title *</label><input value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Modern Downtown Loft" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label><input type="number" value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="500000" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={newListing.type} onChange={e => setNewListing({...newListing, type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"><option value="house">House</option><option value="apartment">Apartment</option><option value="condo">Condo</option><option value="townhouse">Townhouse</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label><input type="number" value={newListing.bedrooms} onChange={e => setNewListing({...newListing, bedrooms: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="3" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label><input type="number" step="0.5" value={newListing.bathrooms} onChange={e => setNewListing({...newListing, bathrooms: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="2.5" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Sq Ft</label><input type="number" value={newListing.sqft} onChange={e => setNewListing({...newListing, sqft: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="2000" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={newListing.address} onChange={e => setNewListing({...newListing, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="123 Main Street" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={newListing.city} onChange={e => setNewListing({...newListing, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Miami" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input value={newListing.state} onChange={e => setNewListing({...newListing, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="FL" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label><input value={newListing.zip} onChange={e => setNewListing({...newListing, zip: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="33101" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={newListing.description} onChange={e => setNewListing({...newListing, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Describe this property..." /></div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowNewListing(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button onClick={handleCreateListing} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25">Create Listing</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
}
function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
}
