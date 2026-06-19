import { useState, useEffect } from 'react';
import {
  Home, TrendingUp, DollarSign, MessageSquare, Users, Eye, Plus, Edit3, Trash2,
  ArrowUpRight, Clock, CheckCircle, AlertCircle, Send, BarChart3,
  Calendar, Star, Package, Target, ArrowRight, ChevronDown, ChevronUp,
  Briefcase, Heart, Filter, LogOut, Settings, Bell, Zap, User,
  Shield as ShieldIcon, FileCheck as FileCheckIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Property as PropertyType } from '../types';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { buildConversationRouteState } from '../lib/messageFlow';
import { safeNum } from '../lib/utils';
import Messages from './Messages';
import PropertyCard from './PropertyCard';
import SearchFilters, { FilterState } from './SearchFilters';
import ProfilePage from './ProfilePage';

interface RealtorPortalProps {}

interface DashboardData {
  agent: any;
  stats: any;
  properties: any[];
  transactions: any[];
  messages: any[];
  leads: any[];
  monthlyPerformance: any[];
}

const formatCurrency = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });

type SubPage = 'overview' | 'marketplace' | 'listings' | 'leads' | 'transactions' | 'earnings' | 'profile';

type ListingFormState = {
  title: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: string;
  description: string;
  images: string[];
};

const emptyListing: ListingFormState = {
  title: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  sqft: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  type: 'house',
  description: '',
  images: [],
};

export default function RealtorPortal() {
  const navigate = useNavigate();
  const [subPage, setSubPage] = useState<SubPage>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewListing, setShowNewListing] = useState(false);
  const [leadsExpanded, setLeadsExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [marketplaceProperties, setMarketplaceProperties] = useState<PropertyType[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const [marketplaceFilters, setMarketplaceFilters] = useState<FilterState>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [listingMode, setListingMode] = useState<'create' | 'edit'>('create');
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [newListing, setNewListing] = useState<ListingFormState>(emptyListing);
  const [listingError, setListingError] = useState<string | null>(null);
  const [activeLeadThread, setActiveLeadThread] = useState<any | null>(null);
  const [listingsStatusFilter, setListingsStatusFilter] = useState<string | null>(null);
  const [listingValidated, setListingValidated] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; title: string; message: string; kind: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    kind: 'success',
  });

  const getInitials = (value: string | null | undefined) => {
    if (!value) return '?';
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userId = session.user.id;
          const email = session.user.email || '';

          // Step 1: Fetch or create user profile (with retry logic for missing columns)
          let profileData = null;
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (!existingProfile) {
            // Profile doesn't exist; create it with full → minimal retry pattern
            const fullProfilePayload = {
              id: userId,
              email,
              first_name: session.user.user_metadata?.first_name || (email ? email.split('@')[0] : 'Realtor') || 'Realtor',
              last_name: session.user.user_metadata?.last_name || '',
              full_name: session.user.user_metadata?.full_name || (email ? email.split('@')[0] : 'Realtor') || 'Realtor',
              role: 'realtor',
            };

            let profileResult = await supabase.from('profiles').insert(fullProfilePayload).select().single();

            if (profileResult.error && /column|schema cache/i.test(profileResult.error.message || '')) {
              profileResult = await supabase
                .from('profiles')
                .insert({ id: userId, email, role: 'realtor' })
                .select()
                .single();
            }

            if (profileResult.error) {
              console.error('Profile creation failed:', profileResult.error.message);
              throw new Error(`Profile creation failed: ${profileResult.error.message}`);
            }
            profileData = profileResult.data;
          } else {
            profileData = existingProfile;
          }

          const profile = profileData || {};
          const displayName = profile.full_name || session.user.user_metadata?.full_name || profile.first_name || (email ? email.split('@')[0] : 'Realtor') || 'Realtor';

          setCurrentUser({ ...profile, email, first_name: profile.first_name || null, last_name: profile.last_name || null, full_name: displayName, avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || null });

          try {
            const res = await fetch(`/api/realtor?email=${encodeURIComponent(email)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            setData(d);
            if (d?.agent?.id) setAgentId(String(d.agent.id));
          } catch (err) {
            console.error('Failed to load realtor data:', err);
          }
          return;
        }

        const res = await fetch('/api/realtor');
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error('RealtorPortal initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (refreshTrigger === 0) return;
    const reloadUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileData) {
        const profile = profileData;
        const email = session.user.email || profile.email || '';
        const displayName = profile.full_name || session.user.user_metadata?.full_name || (email ? email.split('@')[0] : 'Realtor') || 'Realtor';
        setCurrentUser({ ...profile, email, first_name: profile.first_name || null, last_name: profile.last_name || null, full_name: displayName, avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || null });
      }
    };
    void reloadUserProfile();
  }, [refreshTrigger]);

  const s = data?.stats || {};
  const agent = currentUser && Object.keys(currentUser).length > 0 ? currentUser : (data?.agent || {});

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.assign('/');
  };

  const fetchMarketplace = async (filters: FilterState = {}) => {
    try {
      setMarketplaceLoading(true);
      setMarketplaceError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, String(value));
        }
      });

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const dataArray = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      setMarketplaceProperties(dataArray);
    } catch (error: any) {
      setMarketplaceError(error.message || 'Unable to load marketplace listings');
      setMarketplaceProperties([]);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  useEffect(() => {
    if (subPage === 'marketplace' && marketplaceProperties.length === 0 && !marketplaceLoading) {
      void fetchMarketplace(marketplaceFilters);
    }
  }, [subPage, marketplaceFilters, marketplaceLoading, marketplaceProperties.length]);

  const handleMarketplaceFilterChange = (filters: FilterState) => {
    setMarketplaceFilters(filters);
    void fetchMarketplace(filters);
  };

  const handleViewProperty = (property: PropertyType) => {
    navigate(`/properties/${property.id}`, { state: { property } });
  };

  const refreshRealtorData = async () => {
    const email = currentUser?.email;
    if (!email) return;
    const d = await fetch(`/api/realtor?email=${encodeURIComponent(email)}`).then(r => r.json());
    setData(d);
  };

  const openCreateListing = () => {
    setListingMode('create');
    setEditingPropertyId(null);
    setNewListing(emptyListing);
    setListingError(null);
    setShowNewListing(true);
  };

  const openEditListing = (property: PropertyType) => {
    setListingMode('edit');
    setEditingPropertyId(property.id);
    setNewListing({
      title: String(property.title || ''),
      price: String(property.price ?? ''),
      bedrooms: String(property.bedrooms ?? ''),
      bathrooms: String(property.bathrooms ?? ''),
      sqft: String(property.sqft ?? ''),
      address: String(property.address || ''),
      city: String(property.city || ''),
      state: String(property.state || ''),
      zip: String(property.zip || ''),
      type: String(property.type || 'house'),
      description: String(property.description || ''),
      images: Array.isArray(property.images) ? property.images : [],
    });
    setListingError(null);
    setShowNewListing(true);
  };

  const handleDeleteListing = async (propertyId: number) => {
    const ok = window.confirm('Delete this listing? This cannot be undone.');
    if (!ok) return;

    try {
      const res = await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: propertyId }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || 'Failed to delete listing');
      await refreshRealtorData();
      setMarketplaceProperties([]);
      setFeedbackModal({
        open: true,
        kind: 'success',
        title: 'Listing deleted',
        message: 'The property was removed from your dashboard.',
      });
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        kind: 'error',
        title: 'Delete failed',
        message: e.message || 'Unable to delete the listing.',
      });
    }
  };

  const handlePromoteListing = async (property: PropertyType) => {
    try {
      const res = await fetch('/api/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: property.id, status: property.status === 'available' ? 'pending' : 'available' }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || 'Failed to update listing');
      await refreshRealtorData();
      setMarketplaceProperties([]);
      setFeedbackModal({
        open: true,
        kind: 'success',
        title: 'Listing updated',
        message: `The listing is now marked as ${property.status === 'available' ? 'pending' : 'available'}.`,
      });
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        kind: 'error',
        title: 'Update failed',
        message: e.message || 'Unable to update the listing.',
      });
    }
  };

  const openLeadConversation = (lead: any, withDraft: boolean) => {
    const replyDraft = withDraft
      ? `Hi ${lead.name || 'there'}, thanks for reaching out. I’d be happy to help with ${lead.property || 'your inquiry'}. What would you like to know?`
      : undefined;
    setActiveLeadThread(buildConversationRouteState(lead.id, lead.name, lead.property, replyDraft));
    setSubPage('leads');
  };

  // ─── SUB-PAGE RENDERERS ──────────────────────────────

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm overflow-hidden flex items-center justify-center text-3xl font-bold border border-white/20">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.first_name || agent.name || agent.full_name || 'Agent'} className="w-full h-full object-cover" />
                ) : (
                  <span>{getInitials(agent.first_name || agent.name || agent.full_name)}</span>
                )}
              </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {currentUser?.first_name || agent?.first_name || agent?.name || agent?.full_name || 'Agent'}!</h1>
              <p className="text-blue-100 mt-1">{currentUser?.company || agent?.company || ''} · Here's your business overview</p>
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
              <button key={idx} type="button" className="w-full p-4 text-left hover:bg-gray-50 transition" onClick={() => openLeadConversation(lead, false)}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {(lead.name || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(lead.lastDate)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{lead.property || 'Property interest not specified'}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{lead.lastMessage}</p>
                  </div>
                </div>
              </button>
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

  const renderListings = () => {
    const allProps: any[] = data?.properties || [];
    const filteredProps = listingsStatusFilter ? allProps.filter((p: any) => p.status === listingsStatusFilter) : allProps;
    const statusTabs = [
      { label: 'All', filter: null, count: allProps.length },
      { label: 'Active', filter: 'available', count: allProps.filter((p: any) => p.status === 'available').length },
      { label: 'Pending', filter: 'pending', count: allProps.filter((p: any) => p.status === 'pending').length },
      { label: 'Sold', filter: 'sold', count: allProps.filter((p: any) => p.status === 'sold').length },
    ];
    const fallbackImages: Record<string, string> = {
      house: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&h=60&fit=crop',
      apartment: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=80&h=60&fit=crop',
      condo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=60&fit=crop',
      townhouse: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=80&h=60&fit=crop',
    };
    const getPropImage = (prop: any) => {
      let imgs: string[] = [];
      if (prop.images) {
        if (Array.isArray(prop.images)) imgs = prop.images;
        else if (typeof prop.images === 'string') { try { imgs = JSON.parse(prop.images); } catch { /* */ } }
      }
      return imgs[0] || fallbackImages[prop.type] || fallbackImages.house;
    };

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-900">My Listings</h2><p className="text-sm text-gray-500 mt-1">Manage all your property listings</p></div>
        <button onClick={openCreateListing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"><Plus className="w-5 h-5" /> Add New Listing</button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(tab => (
          <button
            key={String(tab.filter)}
            onClick={() => setListingsStatusFilter(tab.filter)}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition ${listingsStatusFilter === tab.filter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}
          >
            {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Property', 'Location', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProps.map((prop: any) => (
                <tr key={prop.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={getPropImage(prop)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="max-w-[220px]">
                        <p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p>
                        <p className="text-xs text-gray-400 capitalize">{prop.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{prop.city}, {prop.state}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatCurrency(safeNum(prop.price, 0))}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${prop.status === 'available' ? 'bg-green-50 text-green-600' : prop.status === 'pending' ? 'bg-amber-50 text-amber-600' : prop.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>
                      {prop.status === 'available' ? '● Active' : prop.status === 'pending' ? '● Pending' : prop.status === 'sold' ? '✓ Sold' : '○ Off Market'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditListing(prop)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteListing(prop.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => handlePromoteListing(prop)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title={prop.status === 'available' ? 'Mark as Pending' : 'Mark as Available'}><Zap className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProps.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{allProps.length === 0 ? 'No listings yet. Create your first one!' : 'No listings match this filter.'}</p>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderLeads = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Buyer Leads</h2>
          <p className="text-sm text-gray-500 mt-1">People interested in your properties</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search leads..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
          </div>
          <button
            type="button"
            onClick={() => setLeadsExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {leadsExpanded ? 'Hide leads' : 'Show leads'}
            {leadsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {leadsExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {(data?.leads || []).map((lead: any, idx: number) => (
                <motion.button
                  key={lead.id || idx}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => openLeadConversation(lead, false)}
                  className={`w-full rounded-2xl border bg-white px-4 py-4 text-left shadow-sm transition hover:shadow-md ${activeLeadThread?.openConversationWith === String(lead.id) ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">{(lead.name || '?')[0]}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
                          <p className="text-sm text-gray-500 truncate">{lead.property || 'Property interest not specified'}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 truncate">{lead.lastMessage}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(lead.lastDate)}</span>
                      <span>{lead.messageCount || 1} msg{(lead.messageCount || 1) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </motion.button>
              ))}

              {(data?.leads || []).length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No leads yet. They'll appear when buyers contact you.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeLeadThread && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Messages
            initialState={activeLeadThread}
            threadUserId={String(agentId || data?.agent?.id || '')}
            onBack={() => setActiveLeadThread(null)}
          />
        </div>
      )}
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

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  useEffect(() => {
    if (!showNewListing) {
      setNewListing(emptyListing);
      setListingMode('create');
      setEditingPropertyId(null);
      setListingError(null);
      setListingValidated(false);
    }
  }, [showNewListing]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      setNewListing(prev => ({ ...prev, images: [] }));
      return;
    }

    try {
      const images = await Promise.all(files.map(fileToDataUrl));
      setNewListing(prev => ({ ...prev, images }));
      setListingError(null);
    } catch (error) {
      console.error(error);
      setListingError('Unable to read one or more images. Please try again.');
    }
  };

  const handleImageDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []).filter(file => file.type.startsWith('image/'));

    if (files.length === 0) {
      setListingError('Please drop image files only.');
      return;
    }

    try {
      const images = await Promise.all(files.map(fileToDataUrl));
      setNewListing(prev => ({ ...prev, images }));
      setListingError(null);
    } catch (error) {
      console.error(error);
      setListingError('Unable to read one or more images. Please try again.');
    }
  };

  const handleCreateListing = async () => {
    setListingValidated(true);

    if (!newListing.title || !newListing.price || !newListing.images.length) {
      return;
    }

    if (!agentId) {
      setFeedbackModal({
        open: true,
        kind: 'error',
        title: 'Realtor account not ready',
        message: 'We could not determine your realtor account. Refresh the page and try again.',
      });
      return;
    }

    try {
      const res = await fetch('/api/properties', {
        method: listingMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingMode === 'edit'
          ? (() => { const amenities = (() => { try { return JSON.parse(newListing.description.match(/\[AMENITIES:(.*?)\]/)?.[1] || '[]'); } catch { return []; } })(); const desc = newListing.description.replace(/\[AMENITIES:.*?\]/g, '').trim(); return { ...newListing, description: desc, id: editingPropertyId, agent_id: agentId, images: newListing.images, features: [], amenities }; })()
          : (() => { const amenities = (() => { try { return JSON.parse(newListing.description.match(/\[AMENITIES:(.*?)\]/)?.[1] || '[]'); } catch { return []; } })(); const desc = newListing.description.replace(/\[AMENITIES:.*?\]/g, '').trim(); return { ...newListing, description: desc, agent_id: agentId, images: newListing.images, features: [], amenities }; })()),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || `Failed to ${listingMode === 'edit' ? 'update' : 'create'} listing`);
      setShowNewListing(false);
      setListingError(null);
      setNewListing(emptyListing);
      setListingMode('create');
      setEditingPropertyId(null);
      setFeedbackModal({
        open: true,
        kind: 'success',
        title: listingMode === 'edit' ? 'Listing updated' : 'Listing created',
        message: listingMode === 'edit'
          ? 'Your property changes have been saved successfully.'
          : 'Your property has been published successfully and is now visible in your dashboard.',
      });
      // Refresh data
      await refreshRealtorData();
      setMarketplaceProperties([]);
    } catch (e: any) {
      setFeedbackModal({
        open: true,
        kind: 'error',
        title: listingMode === 'edit' ? 'Update failed' : 'Listing failed',
        message: e.message || 'Something went wrong while saving the listing.',
      });
    }
  };

  // ─── MAIN RENDER ───────────────────────────────────────

  const navItems: { id: SubPage; label: string; icon: any }[] = [
    { id: 'overview', label: 'Home', icon: TrendingUp },
    { id: 'marketplace', label: 'Marketplace', icon: Home },
    { id: 'listings', label: 'My Listings', icon: Package },
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 hidden sm:block">Realtor Workspace</span>
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
              <button onClick={() => setSubPage('profile')} className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:ring-2 hover:ring-blue-300 transition overflow-hidden">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{(currentUser?.first_name || agent.name || '?')[0].toUpperCase()}</span>
                )}
              </button>
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
      {subPage === 'profile' ? (
        <ProfilePage onBack={() => setSubPage('overview')} onSaveSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {subPage === 'overview' && renderOverview()}
        {subPage === 'marketplace' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Marketplace</h2>
              <p className="text-sm text-gray-500 mt-1">Browse public listings like a buyer would, without leaving the realtor workspace.</p>
            </div>

            <SearchFilters
              filters={marketplaceFilters}
              onFilterChange={handleMarketplaceFilterChange}
              resultCount={marketplaceProperties.length}
            />

            {marketplaceLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                    <div className="h-52 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : marketplaceError ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-red-600 font-medium">{marketplaceError}</p>
                <button onClick={() => void fetchMarketplace(marketplaceFilters)} className="mt-4 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
                  Try Again
                </button>
              </div>
            ) : marketplaceProperties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
                No marketplace listings found.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {marketplaceProperties.map((property, index) => (
                  <PropertyCard key={property.id} property={property} onView={handleViewProperty} index={index} />
                ))}
              </div>
            )}
          </div>
        )}
        {subPage === 'listings' && renderListings()}
        {subPage === 'leads' && renderLeads()}
        {subPage === 'transactions' && renderTransactions()}
        {subPage === 'earnings' && renderEarnings()}
      </div>
      )}

      {/* New Listing Modal */}
      <AnimatePresence>
        {showNewListing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewListing(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{listingMode === 'edit' ? 'Edit Listing' : 'Create New Listing'}</h2>
                <button onClick={() => setShowNewListing(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                {(() => {
                  const req = (val: string) => listingValidated && !val ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-blue-500';
                  const AMENITIES = ['Swimming Pool', 'Gym', 'Generator', 'Security / Guard', 'BQ / Boys Quarters', 'Parking Garage', 'Air Conditioning', 'Water Treatment', 'CCTV', 'Elevator', 'Balcony', 'Garden', 'Fence / Gate'];
                  const currentAmenities: string[] = (() => { try { return JSON.parse(newListing.description.match(/\[AMENITIES:(.*?)\]/)?.[1] || '[]'); } catch { return []; } })();
                  const descBody = newListing.description.replace(/\[AMENITIES:.*?\]/g, '').trim();
                  const toggleAmenity = (a: string) => {
                    const updated = currentAmenities.includes(a) ? currentAmenities.filter(x => x !== a) : [...currentAmenities, a];
                    const tag = updated.length ? `[AMENITIES:${JSON.stringify(updated)}]` : '';
                    setNewListing(prev => ({ ...prev, description: descBody + (tag ? '\n' + tag : '') }));
                  };
                  return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Title <span className="text-red-500">*</span></label>
                      <input value={newListing.title} onChange={e => setNewListing({...newListing, title: e.target.value})} className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:border-transparent outline-none ${req(newListing.title)}`} placeholder="e.g. Modern 4-Bedroom Detached House in Lekki" />
                      {listingValidated && !newListing.title && <p className="text-xs text-red-500 mt-1">Title is required</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) <span className="text-red-500">*</span></label>
                      <input type="number" min="0" value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:border-transparent outline-none ${req(newListing.price)}`} placeholder="150000000" />
                      {listingValidated && !newListing.price && <p className="text-xs text-red-500 mt-1">Price is required</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                      <select value={newListing.type} onChange={e => setNewListing({...newListing, type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <input type="number" min="0" value={newListing.bedrooms} onChange={e => setNewListing({...newListing, bedrooms: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="3" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                      <input type="number" min="0" step="0.5" value={newListing.bathrooms} onChange={e => setNewListing({...newListing, bathrooms: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size (sq ft)</label>
                      <input type="number" min="0" value={newListing.sqft} onChange={e => setNewListing({...newListing, sqft: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2000" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                      <input value={newListing.address} onChange={e => setNewListing({...newListing, address: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 15 Admiralty Way" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <select value={newListing.city} onChange={e => setNewListing({...newListing, city: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Select city</option>
                        {['Lagos','Abuja','Lekki','Port Harcourt','Kano','Enugu','Ibadan','Benin City','Calabar','Kaduna','Owerri','Asaba'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input value={newListing.state} onChange={e => setNewListing({...newListing, state: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Lagos" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal</label>
                      <input value={newListing.zip} onChange={e => setNewListing({...newListing, zip: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="100001" />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <span className="text-xs text-gray-400">{descBody.length}/1000</span>
                      </div>
                      <textarea
                        value={descBody}
                        onChange={e => {
                          const tag = currentAmenities.length ? `\n[AMENITIES:${JSON.stringify(currentAmenities)}]` : '';
                          setNewListing(prev => ({ ...prev, description: e.target.value + tag }));
                        }}
                        rows={3}
                        maxLength={1000}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Describe this property — highlights, condition, neighbourhood..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amenities & Features</label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITIES.map(a => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAmenity(a)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${currentAmenities.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Images <span className="text-red-500">*</span>
                        {newListing.images.length > 0 && <span className="ml-2 text-xs text-gray-400 font-normal">{newListing.images.length} photo{newListing.images.length !== 1 ? 's' : ''} selected</span>}
                      </label>
                      <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleImageDrop}
                        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${listingValidated && !newListing.images.length ? 'border-red-300 bg-red-50/50' : 'border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50'}`}
                      >
                        <input id="listing-images" type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" />
                        <label htmlFor="listing-images" className="cursor-pointer block">
                          <p className="text-sm font-semibold text-blue-700">Drag and drop images here</p>
                          <p className="text-xs text-gray-500 mt-1">or click to browse · select multiple photos</p>
                        </label>
                      </div>
                      {listingValidated && !newListing.images.length && <p className="text-xs text-red-500 mt-1">At least one image is required</p>}
                      {listingError && <p className="text-sm text-red-600 mt-2">{listingError}</p>}
                      {newListing.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-3">
                          {newListing.images.map((src, idx) => (
                            <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                              <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setNewListing(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                                title="Remove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              {idx === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">Cover</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowNewListing(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button onClick={handleCreateListing} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25">{listingMode === 'edit' ? 'Save Changes' : 'Create Listing'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setFeedbackModal(prev => ({ ...prev, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className={`px-6 py-5 ${feedbackModal.kind === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${feedbackModal.kind === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>{feedbackModal.title}</h3>
                    <p className={`mt-1 text-sm ${feedbackModal.kind === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{feedbackModal.message}</p>
                  </div>
                  <button
                    onClick={() => setFeedbackModal(prev => ({ ...prev, open: false }))}
                    className={`p-2 rounded-full transition ${feedbackModal.kind === 'success' ? 'hover:bg-emerald-100' : 'hover:bg-red-100'}`}
                    aria-label="Close message"
                  >
                    <X className={`w-5 h-5 ${feedbackModal.kind === 'success' ? 'text-emerald-700' : 'text-red-700'}`} />
                  </button>
                </div>
              </div>
              <div className="p-6 flex justify-end">
                <button
                  onClick={() => setFeedbackModal(prev => ({ ...prev, open: false }))}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${feedbackModal.kind === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

