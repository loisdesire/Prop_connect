import { useNavigate } from 'react-router-dom';
import { Briefcase, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RealtorLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(99,102,241,0.2),_transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-blue-100 text-sm">
              <Briefcase className="w-4 h-4" /> Realtor Workspace
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold">PropTrust Realtor Portal</h1>
            <p className="mt-4 text-blue-100/80 max-w-2xl">Separate, focused tools for listing management, lead tracking, and escrow visibility. Built for your day-to-day flow.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/realtor/portal')} className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-blue-50 transition">Enter Portal</button>
              <button onClick={() => navigate('/signup')} className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition">Create Account</button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Listings Pipeline', desc: 'Track inventory, status changes, and performance in one view.' },
            { title: 'Lead Management', desc: 'Prioritize inquiries and follow up faster with CRM-style tools.' },
            { title: 'Escrow Transparency', desc: 'See milestones and payouts as deals progress.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-blue-100/70 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-2 text-blue-100/70 text-sm">
          <Shield className="w-4 h-4" /> Powered by PropTrust Escrow Security
        </div>
      </div>
    </div>
  );
}
