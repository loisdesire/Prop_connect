import { Star, MapPin, Phone, Mail, Building2, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent as AgentType } from '../types';

interface AgentCardProps {
  agent: AgentType;
  onSelect: (agent: AgentType) => void;
  index?: number;
}

export default function AgentCard({ agent, onSelect, index = 0 }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      onClick={() => onSelect(agent)}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {agent.name.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg">{agent.name}</h3>
          <p className="text-sm text-blue-600 font-medium">{agent.company}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-gray-900">{agent.rating}</span>
              <span className="text-xs text-gray-400">({agent.reviews_count} reviews)</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4 line-clamp-2 leading-relaxed">{agent.bio}</p>
      
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{agent.properties?.length || 0} listings</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Award className="w-4 h-4 text-gray-400" />
          <span>Lic: {(agent.license || '').slice(-7)}</span>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <a href={`mailto:${agent.email}`} onClick={e => e.stopPropagation()} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition">
          <Mail className="w-4 h-4" /> Email
        </a>
        <a href={`tel:${agent.phone}`} onClick={e => e.stopPropagation()} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
          <Phone className="w-4 h-4" /> Call
        </a>
      </div>
    </motion.div>
  );
}