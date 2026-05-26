import { Shield, Lock, CheckCircle, Clock, ArrowRight, AlertCircle, Banknote, FileCheck, Key, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EscrowFlow() {
  const steps = [
    {
      icon: FileCheck,
      title: '1. Acceptance & Agreement',
      description: 'Buyer submits an offer through our secure platform. Once both parties agree on terms, the purchase agreement is digitally signed and the escrow process begins.',
      color: 'blue',
    },
    {
      icon: Banknote,
      title: '2. Earnest Money Deposit',
      description: 'Buyer deposits 3% of the purchase price into PropTrust escrow. Funds are held securely and cannot be released without mutual authorization or meeting predefined conditions.',
      color: 'indigo',
    },
    {
      icon: AlertCircle,
      title: '3. Inspection Period',
      description: 'Professional home inspection is conducted. If issues are found, buyer can negotiate repairs, request credit, or withdraw with full earnest money refund (per contract terms).',
      color: 'violet',
    },
    {
      icon: FileCheck,
      title: '4. Appraisal & Title Search',
      description: 'Independent appraisal confirms market value. Title search verifies clean ownership. Any liens or encumbrances are resolved before proceeding to closing.',
      color: 'purple',
    },
    {
      icon: Banknote,
      title: '5. Final Fund Release',
      description: 'Upon successful completion of all contingencies, remaining funds are transferred to escrow. All documents are verified before release.',
      color: 'cyan',
    },
    {
      icon: Key,
      title: '6. Closing & Keys',
      description: 'Deed is recorded, funds are disbursed to seller/agent, and buyer receives keys. The transaction is complete and both parties receive confirmation.',
      color: 'emerald',
    },
  ];
  
  const milestones = [
    { name: 'Earnest Money (3%)', amount: '$15,000', status: 'completed', date: 'Jan 15, 2025' },
    { name: 'Inspection Contingency', amount: '-', status: 'completed', date: 'Jan 22, 2025' },
    { name: 'Appraisal & Title (2%)', amount: '$10,000', status: 'active', date: 'In Progress' },
    { name: 'Closing Payment (95%)', amount: '$475,000', status: 'pending', date: 'Pending Approval' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Secure Transaction Protection
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            How PropTrust Escrow
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">Protects You</span>
          </h1>
          <p className="text-lg text-blue-100/70 max-w-2xl mx-auto">
            Every transaction is secured through our multi-step escrow process. Your funds are protected until all conditions are met.
          </p>
        </div>
      </section>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Security Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-16 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Lock className="w-10 h-10" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">Bank-Level Security for Every Transaction</h2>
              <p className="text-blue-100">All funds are held in regulated escrow accounts. Multi-signature approval required for every disbursement. Full audit trail available 24/7.</p>
            </div>
          </div>
        </motion.div>
        
        {/* Steps */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">The Escrow Process</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A transparent, step-by-step journey from offer to closing</p>
          </div>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-emerald-500 -translate-x-1/2" />
            
            <div className="space-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-${step.color}-50 text-${step.color}-700 font-semibold text-sm mb-3`}>
                      <step.icon className="w-5 h-5" />
                      Step {i + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title.split('. ')[1]}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                  
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                    {i + 1}
                  </div>
                  
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Milestone Demo */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Milestones</h2>
            <p className="text-gray-500">Track every payment stage in real-time</p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Transaction #TXN-2025-0042</h3>
                  <p className="text-sm text-slate-400">Luxury Apartment in Ikoyi · Lagos, Nigeria</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$500,000</div>
                  <div className="text-sm text-emerald-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> In Progress
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {milestones.map((ms, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      ms.status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                      ms.status === 'active' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      ms.status === 'completed' ? 'bg-emerald-500 text-white' :
                      ms.status === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {ms.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                       ms.status === 'active' ? <Clock className="w-5 h-5" /> :
                       i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{ms.name}</div>
                      <div className="text-sm text-gray-500">{ms.date}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${ms.status === 'completed' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {ms.amount}
                      </div>
                      <div className={`text-xs capitalize font-medium ${
                        ms.status === 'completed' ? 'text-emerald-600' :
                        ms.status === 'active' ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {ms.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Protected by PropTrust Escrow
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust Badges */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'FDIC Insured', desc: 'All escrow accounts insured up to $250,000 per account' },
            { icon: Lock, title: '256-bit Encryption', desc: 'Bank-grade security for all data and transactions' },
            { icon: CheckCircle, title: '24/7 Monitoring', desc: 'Dedicated fraud prevention team monitoring all activity' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}