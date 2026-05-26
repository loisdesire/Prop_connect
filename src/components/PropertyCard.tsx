import { MapPin, BedDouble, Bath, Maximize, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Property as PropertyType } from '../types';

function safeNum(val: any, fallback: number): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') { const n = parseFloat(val); return isNaN(n) ? fallback : n; }
  return fallback;
}

interface PropertyCardProps {
  property: PropertyType;
  onView: (property: PropertyType) => void;
  index?: number;
}

export default function PropertyCard({ property, onView, index = 0 }: PropertyCardProps) {
  const price = safeNum(property.price, 0);
  const bedrooms = safeNum(property.bedrooms, 0);
  const bathrooms = safeNum(property.bathrooms, 0);
  const sqft = safeNum(property.sqft, 0);

  const formatPrice = (p: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(p);

  const imageUrls: Record<string, string> = {
    house: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
    apartment: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
    condo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    townhouse: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  };

  let images: string[] = [];
  if (property.images) {
    if (Array.isArray(property.images)) images = property.images;
    else if (typeof property.images === 'string') {
      try { images = JSON.parse(property.images); } catch { /* ignore */ }
    }
  }
  if (!images.length) images = [imageUrls[property.type] || imageUrls.house];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer"
      onClick={() => onView(property)}
    >
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img
          src={images[0]}
          alt={property.title || 'Property'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            property.status === 'available' ? 'bg-green-500 text-white' :
            property.status === 'pending' ? 'bg-amber-500 text-white' :
            'bg-gray-700 text-white'
          }`}>
            {property.status === 'available' ? 'Available' : property.status === 'pending' ? 'Under Contract' : 'Sold'}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg capitalize">
            {property.type || 'Property'}
          </span>
        </div>
        <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition shadow-sm" onClick={e => e.stopPropagation()}>
          <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="text-xl font-bold text-white drop-shadow-lg">{formatPrice(price)}</span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-lg leading-snug mb-2 line-clamp-1 group-hover:text-blue-600 transition">
          {property.title}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{property.address}, {property.city}, {property.state}</span>
        </div>

        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-600">
            <BedDouble className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{bedrooms}</span>
            <span className="text-xs text-gray-400">beds</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Bath className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{bathrooms}</span>
            <span className="text-xs text-gray-400">baths</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Maximize className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{sqft.toLocaleString()}</span>
            <span className="text-xs text-gray-400">sqft</span>
          </div>
        </div>

        {property.agents && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {(property.agents.name || '?').charAt(0)}
              </div>
              <span className="text-sm text-gray-600 font-medium">{property.agents.name}</span>
            </div>
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" onClick={e => e.stopPropagation()}>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
