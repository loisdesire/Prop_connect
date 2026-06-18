import { useState } from 'react';
import { MapPin, BedDouble, Bath, Maximize, Heart, Share2, Phone, Mail, Calendar, CheckCircle, ArrowLeft, MessageSquare, Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Property as PropertyType } from '../types';

function safeNum(val: any, fallback: number): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') { const n = parseFloat(val); return isNaN(n) ? fallback : n; }
  return fallback;
}

function safeJsonParse(val: any, fallback: any): any {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); }
    catch { return fallback; }
  }
  return fallback;
}

interface PropertyDetailProps {
  property: PropertyType;
  onBack: () => void;
  onMessageAgent: (agentId: number, propertyName: string, agent?: { name?: string; avatar_url?: string | null; company?: string; email?: string }) => void;
  onStartEscrow: (property: PropertyType) => void;
  onViewAgent?: (agentId: number) => void;
}

export default function PropertyDetail({ property, onBack, onMessageAgent, onStartEscrow, onViewAgent }: PropertyDetailProps) {
  const [activeImage, setActiveImage] = useState(0);
  
  const price = safeNum(property.price, 0);
  const bedrooms = safeNum(property.bedrooms, 0);
  const bathrooms = safeNum(property.bathrooms, 0);
  const sqft = safeNum(property.sqft, 0);
  
  const formatPrice = (p: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(p);

  const imageUrls: Record<string, string> = {
    house: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    apartment: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
    condo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    townhouse: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
  };

  const allImages: string[] = safeJsonParse(property.images, [imageUrls[property.type] || imageUrls.house]);
  const features: string[] = safeJsonParse(property.features, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to listings</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="relative aspect-[16/10] bg-gray-100">
                <img
                  src={allImages[activeImage] || imageUrls.house}
                  alt={property.title || 'Property'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {property.status !== 'available' && (
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${property.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-white'}`}>
                      {property.status === 'pending' ? 'Under Contract' : 'Sold'}
                    </span>
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {allImages.map((img: string, i: number) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${activeImage === i ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-gray-500 mb-6">
                <MapPin className="w-4 h-4" />
                <span>{property.address}, {property.city}, {property.state} {property.zip}</span>
              </div>

              <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-100">
                {[
                  { icon: BedDouble, label: 'Bedrooms', value: bedrooms },
                  { icon: Bath, label: 'Bathrooms', value: bathrooms },
                  { icon: Maximize, label: 'Sq Ft', value: sqft.toLocaleString() },
                  { icon: Calendar, label: 'Type', value: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'N/A' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-blue-50 rounded-xl"><Icon className="w-5 h-5 text-blue-600" /></div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description || 'No description available.'}</div>
              </div>

              {features.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature: string) => (
                      <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-gray-900 mb-1">{formatPrice(price)}</div>
              <p className="text-sm text-gray-500 mb-6">Est. monthly: {formatPrice(Math.round(price / 360))}/mo</p>

              <div className="space-y-3">
                {property.status === 'available' && (
                  <button
                    onClick={() => onStartEscrow(property)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
                  >
                    <Shield className="w-5 h-5" />
                    Make Offer via Escrow
                  </button>
                )}
                <button
                  onClick={() => property.agents && onMessageAgent(property.agents.id, property.title, property.agents)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-200 hover:bg-blue-50 transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Agent
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Your payment is protected by PropTrust Escrow.</span>
                </div>
              </div>
            </div>

            {property.agents && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Listed by</h3>
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => property.agents && onViewAgent && onViewAgent(property.agents.id)}
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden"
                  >
                    {property.agents.avatar_url ? (
                      <img src={property.agents.avatar_url} alt={property.agents.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(property.agents.name || '?').split(' ').map((n: string) => n[0]).join('')}</span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => property.agents && onViewAgent && onViewAgent(property.agents.id)}
                      className="text-left hover:text-blue-600 transition"
                    >
                      <h4 className="font-semibold text-gray-900">{property.agents.name}</h4>
                    </button>
                    <p className="text-sm text-gray-500">{property.agents.company}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-400">★</span>
                      <span className="text-sm font-medium text-gray-900">{property.agents.rating}</span>
                      <span className="text-xs text-gray-400">({property.agents.reviews_count} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {property.agents.email && (
                    <a href={`mailto:${property.agents.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition">
                      <Mail className="w-4 h-4" /> {property.agents.email}
                    </a>
                  )}
                  {property.agents.phone && (
                    <a href={`tel:${property.agents.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition">
                      <Phone className="w-4 h-4" /> {property.agents.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
