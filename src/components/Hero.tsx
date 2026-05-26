import { useState } from 'react';
import { Search, MapPin, Home, Building, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  search?: string;
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export default function Hero({ onSearch }: HeroProps) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  
  const handleSearch = () => {
    onSearch({ search, type: type || undefined });
  };
  
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0xNHY2aC0ydi02aDJ6TTYgMzR2NmgtMnYtNmgyem0wLTEwdjJINHYtMmgyeiIvPjwvZz48L2c+PC9zdmc+')]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Secure Escrow Transactions
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
            Find Your Dream Home
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">With Confidence</span>
          </h1>
          <p className="text-lg text-blue-100/80 max-w-2xl mx-auto">
            Browse verified listings from trusted agents. Every transaction protected by our secure escrow system.
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="City, neighborhood, or address..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px]"
                >
                  <option value="">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              
              <button
                onClick={handleSearch}
                className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {['New York', 'Los Angeles', 'Miami', 'Chicago', 'Austin'].map(city => (
                <button
                  key={city}
                  onClick={() => { setSearch(city); onSearch({ search: city }); }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: '2,500+', label: 'Active Listings' },
            { value: '850+', label: 'Verified Agents' },
            { value: '$2.1B', label: 'In Escrow' },
            { value: '99.8%', label: 'Success Rate' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-blue-200/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}