import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import PropertyCard from './components/PropertyCard';
import SearchFilters, { FilterState } from './components/SearchFilters';
import PropertyDetail from './components/PropertyDetail';
import AgentCard from './components/AgentCard';
import Messages from './components/Messages';
import EscrowFlow from './components/EscrowFlow';
import Dashboard from './components/Dashboard';
import { Building as BuildingIcon, Search as SearchIcon, TrendingUp, Shield as ShieldIcon, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent, Property } from './types';
import supabase from './lib/supabase';

type RouteState<T> = { state?: T };

const safeNum = (v: any, fallback: number): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? fallback : n; }
  return fallback;
};

const safeStr = (v: any, fallback: string = ''): string => {
  if (typeof v === 'string') return v;
  if (v == null) return fallback;
  return String(v);
};

const safeJsonArr = (v: any): string[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
};

const pageToPath = (page: string): string => {
  if (page.startsWith('/')) return page;
  if (page === 'home') return '/';
  return `/${page}`;
};

export default function BuyerApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async (filterParams?: FilterState) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const f = filterParams || filters;
      if (f) {
        Object.entries(f).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
        });
      }

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const json = await res.json();
      const dataArray = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      const count = json.count || dataArray.length;

      setProperties(dataArray);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Fetch properties error:', err);
      setError(err.message || 'Unable to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?limit=20');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAgents(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error('Fetch agents error:', err);
      setAgents([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await Promise.all([fetchProperties(), fetchAgents()]);
      if (!cancelled) setLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [fetchAgents, fetchProperties]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleSearch = (searchFilters: FilterState) => {
    setFilters(searchFilters);
    navigate('/listings');
    fetchProperties(searchFilters);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    fetchProperties(newFilters);
  };

  const handleViewProperty = (property: Property) => {
    navigate(`/properties/${property.id}`, { state: { property } });
  };

  const handleViewAgent = (agent: Agent) => {
    navigate(`/agents/${agent.id}`, { state: { agent } });
  };

  const handleMessageAgent = (agentId: number, propertyName: string) => {
    const agentName = agents.find(a => a.id === agentId)?.name || 'Agent';
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: String(agentId),
        sender_name: agentName,
        receiver_id: 'user-demo',
        receiver_name: 'Demo Buyer',
        property_title: propertyName,
        content: `Hi! Thanks for your interest in "${propertyName}". I'd love to tell you more about this property and schedule a showing. When works best for you?`,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to send message');
        navigate('/messages');
      })
      .catch(err => console.error('Message error:', err));
  };

  const handleStartEscrow = (property: Property) => {
    const amount = safeNum(property.price, 0);
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: property.id,
        buyer_id: 'user-demo',
        buyer_name: 'Demo Buyer',
        agent_id: property.agent_id,
        amount,
      }),
    })
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Escrow failed');
        alert(`✅ Escrow Initiated!\n\nProperty: ${property.title}\nAmount: $${amount.toLocaleString()}\n\nYour funds are now protected by PropTrust Escrow. Navigate to "How It Works" to see the milestone process.`);
      })
      .catch(err => alert(`Error: ${err.message}`));
  };

  const renderHome = () => (
    <>
      <Hero onSearch={handleSearch} />

      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Realtor? Build your business here.</h3>
              <p className="text-gray-500 mt-1">Create listings, manage leads, and track escrow in one portal.</p>
            </div>
            <button onClick={() => navigate('/signup')} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition">Sign up as Realtor</button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Properties</h2>
              <p className="text-gray-500 mt-2">Hand-picked listings from our top-rated agents</p>
            </div>
            <button onClick={() => navigate('/listings')} className="hidden md:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 transition">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : error ? (
            <div className="text-center py-20">
              <BuildingIcon className="w-16 h-16 text-red-200 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button onClick={() => fetchProperties()} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
                Try Again
              </button>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <BuildingIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-500">Check back soon for new listings.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property, i) => (
                <PropertyCard key={property.id} property={property} onView={handleViewProperty} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How PropTrust Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The simple, secure way to buy or sell real estate</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: SearchIcon, step: '01', title: 'Find Your Property', desc: 'Browse verified listings with advanced search filters.' },
              { icon: ShieldIcon, step: '02', title: 'Secure Escrow', desc: 'Your funds are protected until all conditions are met.' },
              { icon: BuildingIcon, step: '03', title: 'Close with Confidence', desc: 'Complete milestones with full transparency.' },
              { icon: TrendingUp, step: '04', title: 'Move In Happy', desc: 'Receive your keys and enjoy your new property.' },
            ].map(({ icon: Icon, step, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5"><Icon className="w-7 h-7 text-blue-600" /></div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Top Agents</h2>
              <p className="text-gray-500 mt-2">Connect with our most trusted professionals</p>
            </div>
            <button onClick={() => navigate('/agents')} className="hidden md:flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 transition">
              View All Agents <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {agents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.slice(0, 3).map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} onSelect={handleViewAgent} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">Loading agents...</div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <ShieldIcon className="w-14 h-14 text-blue-200 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Buy or Sell with Confidence?</h2>
            <p className="text-lg text-blue-100/80 mb-8 max-w-2xl mx-auto">Join thousands who trust PropTrust for secure, transparent transactions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/listings')} className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition shadow-lg">Browse Listings</button>
              <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition">Sign Up</button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );

  const renderListings = () => (
    <div className="min-h-screen bg-gray-50">
      <SearchFilters filters={filters} onFilterChange={handleFilterChange} resultCount={totalCount} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-52 bg-gray-200" /><div className="p-5 space-y-3"><div className="h-5 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-8 bg-gray-100 rounded" /></div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <BuildingIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters</p>
            <button onClick={() => handleFilterChange({})} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property, i) => (
                <PropertyCard key={property.id} property={property} onView={handleViewProperty} index={i} />
              ))}
            </div>
            {totalCount > properties.length && (
              <div className="text-center mt-10">
                <button className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">Load More Properties</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Our Trusted Agents</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Connect with experienced professionals for your real estate journey</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {agents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} onSelect={handleViewAgent} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading agents...</p>
          </div>
        )}
      </div>
    </div>
  );

  const PropertyDetailRoute = () => {
    const params = useParams();
    const routeState = useLocation() as RouteState<{ property?: Property }>;
    const [property, setProperty] = useState<Property | null>(routeState.state?.property || null);
    const [loadingDetail, setLoadingDetail] = useState(!routeState.state?.property);

    useEffect(() => {
      if (property || !params.id) return;
      const fetchProperty = async () => {
        try {
          const res = await fetch(`/api/properties?id=${params.id}`);
          const json = await res.json();
          const data = Array.isArray(json.data) ? json.data : [];
          setProperty(data[0] || null);
        } catch (err) {
          console.error('Fetch property error:', err);
        } finally {
          setLoadingDetail(false);
        }
      };
      fetchProperty();
    }, [params.id, property]);

    if (loadingDetail) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading property...</p>
          </div>
        </div>
      );
    }

    if (!property) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BuildingIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Property not found.</p>
          </div>
        </div>
      );
    }

    return (
      <PropertyDetail
        property={property}
        onBack={() => navigate('/listings')}
        onMessageAgent={handleMessageAgent}
        onStartEscrow={handleStartEscrow}
      />
    );
  };

  const AgentProfileRoute = () => {
    const params = useParams();
    const routeState = useLocation() as RouteState<{ agent?: Agent }>;
    const [agent, setAgent] = useState<Agent | null>(routeState.state?.agent || null);
    const [loadingDetail, setLoadingDetail] = useState(!routeState.state?.agent);

    useEffect(() => {
      if (agent || !params.id) return;
      const fetchAgent = async () => {
        try {
          const res = await fetch(`/api/agents?id=${params.id}`);
          const json = await res.json();
          setAgent(json || null);
        } catch (err) {
          console.error('Fetch agent error:', err);
        } finally {
          setLoadingDetail(false);
        }
      };
      fetchAgent();
    }, [agent, params.id]);

    if (loadingDetail) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading agent...</p>
          </div>
        </div>
      );
    }

    if (!agent) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BuildingIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Agent not found.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button onClick={() => navigate('/agents')} className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition">← Back to agents</button>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                {safeStr(agent.name).split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{safeStr(agent.name)}</h1>
                <p className="text-blue-200 text-lg">{safeStr(agent.company)}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{safeStr(String(agent.rating), '5.0')}</span>
                  <span className="text-blue-200">({safeNum(agent.reviews_count, 0)} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">{safeStr(agent.bio)}</p>
              <div className="mt-6 space-y-3">
                {[{ label: 'License', val: safeStr(agent.license) }, { label: 'Email', val: safeStr(agent.email) }, { label: 'Phone', val: safeStr(agent.phone) }].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-3 text-sm"><span className="text-gray-400 w-20">{label}</span><span className={`font-medium ${label === 'Email' ? 'text-blue-600' : 'text-gray-900'}`}>{val}</span></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Active Listings ({(agent.properties || []).length})</h2>
                <div className="space-y-3">
                  {(agent.properties || []).slice(0, 5).map((prop: Property) => (
                    <div key={prop.id} onClick={() => handleViewProperty(prop)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                      <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={(safeJsonArr(prop.images)[0]) || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=80&fit=crop'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{safeStr(prop.title)}</p><p className="text-xs text-gray-500">{safeStr(prop.city)}, {safeStr(prop.state)}</p></div>
                      <span className="text-sm font-semibold text-gray-900">${safeNum(prop.price, 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => handleMessageAgent(agent.id, 'General Inquiry')} className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25">Contact Agent</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentPath={location.pathname} onNavigate={(page) => navigate(pageToPath(page))} />
      <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
        <Routes>
          <Route index element={renderHome()} />
          <Route path="listings" element={renderListings()} />
          <Route path="agents" element={renderAgents()} />
          <Route path="messages" element={<RequireAuth><Messages onBack={() => navigate('/')} /></RequireAuth>} />
          <Route path="escrow" element={<EscrowFlow />} />
          <Route path="dashboard" element={<Dashboard onNavigate={(page) => navigate(pageToPath(page))} />} />
          <Route path="signin" element={<SignupChoice mode="signin" onRealtor={() => navigate('/realtor/portal')} onBuyer={() => navigate('/')} />} />
          <Route path="signup" element={<SignupChoice mode="signup" onRealtor={() => navigate('/realtor/portal')} onBuyer={() => navigate('/')} />} />
          <Route path="signup-success" element={<SignupSuccess />} />
          <Route path="properties/:id" element={<PropertyDetailRoute />} />
          <Route path="agents/:id" element={<AgentProfileRoute />} />
        </Routes>
      </motion.div>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"><BuildingIcon className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-bold">PropTrust</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Secure real estate transactions you can trust.</p>
            </div>
            {[
              { title: 'Platform', links: ['Browse Listings', 'Find Agents', 'Sell Property'] },
              { title: 'Resources', links: ['How Escrow Works', 'Buying Guide', 'FAQ'] },
              { title: 'Company', links: ['About Us', 'Contact'] },
            ].map(section => (
              <div key={section.title}>
                <h3 className="font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">{section.links.map(link => (<li key={link}><a href="#" className="text-sm text-slate-400 hover:text-white transition">{link}</a></li>))}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2025 PropTrust. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-slate-400"><ShieldIcon className="w-4 h-4" /> Secured by PropTrust Escrow</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface SignupChoiceProps {
  mode: 'signup' | 'signin';
  onBuyer: () => void;
  onRealtor: () => void;
}

function SignupChoice({ mode, onBuyer, onRealtor }: SignupChoiceProps) {
  const navigate = useNavigate();
  const title = mode === 'signup' ? 'Create your account' : 'Welcome back';
  const subtitle = mode === 'signup'
    ? 'Choose how you want to use PropTrust.'
    : 'Sign in to the experience that fits you.';
  const [role, setRole] = useState<'buyer' | 'realtor'>('buyer');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', license: '' });
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const upsertProfile = async (userId: string, email: string | null, roleValue: 'buyer' | 'realtor') => {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: form.name || null,
      role: roleValue,
      company: roleValue === 'realtor' ? form.company : null,
      license: roleValue === 'realtor' ? form.license : null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/signin`,
            data: {
              role,
              name: form.name,
              company: role === 'realtor' ? form.company : null,
              license: role === 'realtor' ? form.license : null,
            },
          },
        });

        if (error) throw error;
        if (!data.session) {
          setAuthNotice('Check your email to confirm your account before signing in.');
          navigate('/signup-success', { replace: true });
          return;
        }

        await upsertProfile(data.session.user.id, data.session.user.email || null, role);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;

        const userRole = (data.user?.user_metadata?.role as 'buyer' | 'realtor' | undefined) || 'buyer';
        if (data.user?.id) {
          await upsertProfile(data.user.id, data.user.email || null, userRole);
        }
        if (userRole === 'realtor') {
          onRealtor();
        } else {
          onBuyer();
        }
        return;
      }

      if (role === 'realtor') {
        onRealtor();
      } else {
        onBuyer();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose your role</h3>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`text-left p-4 rounded-xl border transition ${role === 'buyer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
              >
                <div className="font-semibold text-gray-900">Buyer</div>
                <div className="text-sm text-gray-500">Browse listings, message agents, and use escrow tools.</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('realtor')}
                className={`text-left p-4 rounded-xl border transition ${role === 'realtor' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}
              >
                <div className="font-semibold text-gray-900">Realtor</div>
                <div className="text-sm text-gray-500">Create listings, manage leads, and track deals.</div>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">You can switch roles later in settings.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {role === 'realtor' && mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Agency name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License #</label>
                  <input
                    value={form.license}
                    onChange={(e) => setForm({ ...form, license: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full px-5 py-2.5 font-semibold rounded-xl transition ${role === 'realtor' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            {authNotice && <p className="text-sm text-emerald-600">{authNotice}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function SignupSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">Confirm your email</h1>
        <p className="text-gray-500 mt-3">We just sent you a confirmation link. Open it to activate your account, then come back and sign in.</p>
        <div className="mt-6">
          <a href="/signin" className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">Go to Sign In</a>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        navigate('/signin', { replace: true });
        return;
      }
      setChecking(false);
    };
    checkSession();
    return () => { cancelled = true; };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
