import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterState {
  search?: string;
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  resultCount?: number;
}

export default function SearchFilters({ filters, onFilterChange, resultCount }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };
  
  const clearFilters = () => {
    onFilterChange({});
  };
  
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');
  
  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                placeholder="Search listings..."
                value={filters.search || ''}
                onChange={e => updateFilter('search', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filters.type || ''}
              onChange={e => updateFilter('type', e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
            </select>
            
            <select
              value={filters.city || ''}
              onChange={e => updateFilter('city', e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Cities</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja</option>
              <option value="Lekki">Lekki</option>
              <option value="Port Harcourt">Port Harcourt</option>
              <option value="Kano">Kano</option>
              <option value="Enugu">Enugu</option>
            </select>
            
            <select
              value={filters.bedrooms || ''}
              onChange={e => updateFilter('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Beds</option>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
            
            <select
              value={filters.bathrooms || ''}
              onChange={e => updateFilter('bathrooms', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Baths</option>
              {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                showAdvanced ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              More Filters
            </button>
            
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition">
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
          
          {resultCount !== undefined && (
            <span className="text-sm text-gray-500 whitespace-nowrap">
              <span className="font-semibold text-gray-900">{resultCount}</span> properties found
            </span>
          )}
        </div>
        
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Min Price (₦)</label>
              <select
                value={filters.minPrice || ''}
                onChange={e => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Min</option>
                <option value="25000000">₦25M</option>
                <option value="50000000">₦50M</option>
                <option value="100000000">₦100M</option>
                <option value="150000000">₦150M</option>
                <option value="250000000">₦250M</option>
                <option value="500000000">₦500M</option>
                <option value="1000000000">₦1B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Price (₦)</label>
              <select
                value={filters.maxPrice || ''}
                onChange={e => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Max</option>
                <option value="75000000">₦75M</option>
                <option value="150000000">₦150M</option>
                <option value="250000000">₦250M</option>
                <option value="500000000">₦500M</option>
                <option value="750000000">₦750M</option>
                <option value="1000000000">₦1B</option>
                <option value="2000000000">₦2B+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select
                value={filters.status || ''}
                onChange={e => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="pending">Under Contract</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}