import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Phone, Mail, ArrowRight, Building, Wrench, Sparkles, Cpu, Home } from 'lucide-react';

export type ServiceSlug =
  | 'building-construction'
  | 'property-management'
  | 'cleaning-services'
  | 'interior-decoration'
  | 'smart-home-automation';

interface ServiceDef {
  slug: ServiceSlug;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  gradient: string;
  features: string[];
  process: { step: string; desc: string }[];
  pricing: { label: string; price: string; note: string }[];
}

const SERVICES: ServiceDef[] = [
  {
    slug: 'building-construction',
    title: 'Building Construction',
    tagline: 'Build your vision from the ground up',
    description:
      'From architectural design to the final finishing, our certified construction teams deliver residential and commercial builds to the highest standards across Nigeria.',
    icon: Building,
    color: 'blue',
    gradient: 'from-blue-600 to-blue-800',
    features: [
      'Full architectural & structural design',
      'Residential and commercial projects',
      'Certified engineers and site managers',
      'Transparent milestone billing',
      'Compliant with LASBCA/state regulations',
      'Post-completion warranty (1–5 years)',
    ],
    process: [
      { step: 'Consultation', desc: 'We assess your land, budget, and vision to produce a feasibility report.' },
      { step: 'Design & Approval', desc: 'Architects produce detailed drawings; we handle building permit submissions.' },
      { step: 'Construction', desc: 'Phased construction with weekly progress reports and site visits.' },
      { step: 'Finishing & Handover', desc: 'Interior finishing, punch-list walk-through, and key handover.' },
    ],
    pricing: [
      { label: 'Starter (bungalow)', price: '₦18M', note: 'Per unit, basic finishes' },
      { label: 'Standard (duplex)', price: '₦35M', note: 'Mid-range finishes' },
      { label: 'Premium', price: 'Custom', note: 'Luxury builds & commercial' },
    ],
  },
  {
    slug: 'property-management',
    title: 'Property Management',
    tagline: 'Let your property work for you',
    description:
      'We handle every aspect of owning a rental property — tenant sourcing, rent collection, maintenance, and financial reporting — so you can earn without the stress.',
    icon: Home,
    color: 'emerald',
    gradient: 'from-emerald-600 to-teal-700',
    features: [
      'Tenant vetting & placement',
      'Rent collection & remittance',
      'Scheduled maintenance & repairs',
      'Monthly financial statements',
      'Lease drafting & renewals',
      'Vacancy marketing on PropConnect',
    ],
    process: [
      { step: 'Property Onboarding', desc: 'We inspect, photograph, and list your property across our platforms.' },
      { step: 'Tenant Placement', desc: 'Background-checked tenants selected within 30 days or we waive our fee.' },
      { step: 'Ongoing Management', desc: 'Rent remittance, maintenance requests, and quarterly inspections.' },
      { step: 'Reporting', desc: 'Monthly statements with income, expenses, and occupancy metrics.' },
    ],
    pricing: [
      { label: 'Single unit', price: '8%', note: 'Of monthly rent collected' },
      { label: 'Portfolio (2–5 units)', price: '6%', note: 'Of monthly rent collected' },
      { label: 'Portfolio (6+ units)', price: 'Custom', note: 'Volume discount applies' },
    ],
  },
  {
    slug: 'cleaning-services',
    title: 'Cleaning Services',
    tagline: 'Spotless spaces, on schedule',
    description:
      'Professional cleaning for homes, offices, and post-construction sites. Our trained teams use eco-friendly products and work around your schedule.',
    icon: Sparkles,
    color: 'violet',
    gradient: 'from-violet-600 to-purple-700',
    features: [
      'Residential deep cleaning',
      'Post-construction clean-up',
      'Office & commercial cleaning',
      'Move-in / move-out cleaning',
      'Eco-friendly, non-toxic products',
      'Insured and uniformed staff',
    ],
    process: [
      { step: 'Booking', desc: 'Choose your service type, date, and property size online or by phone.' },
      { step: 'Assessment', desc: 'For large spaces, we do a free walk-through and provide a fixed quote.' },
      { step: 'Cleaning', desc: 'Teams arrive on time with all equipment and supplies included.' },
      { step: 'Quality Check', desc: 'A supervisor inspects before sign-off — or we come back, free of charge.' },
    ],
    pricing: [
      { label: 'Studio / 1-bed', price: '₦15,000', note: 'Per session' },
      { label: '2–3 bed apartment', price: '₦25,000', note: 'Per session' },
      { label: 'Post-construction', price: 'From ₦50,000', note: 'Based on size' },
    ],
  },
  {
    slug: 'interior-decoration',
    title: 'Interior Decoration',
    tagline: 'Spaces that tell your story',
    description:
      'Our interior designers transform empty shells into elegant, functional spaces. From concept mood boards to final styling, every detail is intentional.',
    icon: Sparkles,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    features: [
      'Full-room concept & mood boards',
      'Furniture sourcing & procurement',
      'Custom carpentry & built-ins',
      'Lighting design & installation',
      '3D visualisation before execution',
      'Style consultations (virtual or in-person)',
    ],
    process: [
      { step: 'Discovery', desc: 'We learn your taste, lifestyle, and budget through a detailed brief.' },
      { step: 'Concept Design', desc: '3D renders and mood boards for your approval before any purchase.' },
      { step: 'Procurement', desc: 'We source furniture, fixtures, and décor — leveraging trade discounts.' },
      { step: 'Installation', desc: 'Full installation, styling, and a final reveal with photography.' },
    ],
    pricing: [
      { label: 'Consultation only', price: '₦30,000', note: 'One room, 2-hour session' },
      { label: 'Single room', price: 'From ₦250,000', note: 'Full decoration service' },
      { label: 'Full apartment / home', price: 'Custom', note: 'Detailed quote after brief' },
    ],
  },
  {
    slug: 'smart-home-automation',
    title: 'Smart Home Automation',
    tagline: 'Control everything from your phone',
    description:
      'We design and install integrated smart home systems — lighting, security, climate, and entertainment — that work seamlessly with your lifestyle.',
    icon: Cpu,
    color: 'indigo',
    gradient: 'from-indigo-600 to-blue-700',
    features: [
      'Smart lighting & scene control',
      'CCTV & remote access security',
      'Smart locks & video doorbells',
      'Climate & AC automation',
      'Voice control (Alexa / Google Home)',
      'Single app control for all devices',
    ],
    process: [
      { step: 'Site Survey', desc: 'We assess your property layout and existing electrical infrastructure.' },
      { step: 'System Design', desc: 'A tailored plan showing every device, zone, and control interface.' },
      { step: 'Installation', desc: 'Clean, concealed wiring by certified smart-home technicians.' },
      { step: 'Training & Support', desc: 'We train you on the app and provide 12-month support coverage.' },
    ],
    pricing: [
      { label: 'Starter kit', price: 'From ₦180,000', note: 'Lighting + 2 smart locks' },
      { label: 'Full apartment', price: 'From ₦450,000', note: 'All zones, security included' },
      { label: 'Smart villa / office', price: 'Custom', note: 'Enterprise-grade system' },
    ],
  },
];

export const SERVICE_SLUGS = SERVICES.map((s) => s.slug);

export const serviceFromSlug = (slug: string): ServiceDef | undefined =>
  SERVICES.find((s) => s.slug === slug);

export const serviceTitleToSlug = (title: string): ServiceSlug | undefined =>
  SERVICES.find((s) => s.title === title)?.slug;

interface ServicesPageProps {
  slug?: string;
  onBack?: () => void;
  onNavigate: (path: string) => void;
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const iconBg: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  indigo: 'bg-indigo-100 text-indigo-600',
};

function ServiceCard({ service, onClick }: { service: ServiceDef; onClick: () => void }) {
  const Icon = service.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
    >
      <div className={`h-2 bg-gradient-to-r ${service.gradient}`} />
      <div className="p-6">
        <div className={`w-12 h-12 rounded-xl ${iconBg[service.color]} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{service.title}</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{service.tagline}</p>
        <ul className="space-y-1.5 mb-5">
          {service.features.slice(0, 3).map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${colorMap[service.color]}`}>
            From {service.pricing[0].price}
          </span>
          <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Learn more <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ServiceDetail({ service, onBack }: { service: ServiceDef; onBack: () => void }) {
  const Icon = service.icon;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${service.gradient} text-white`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </button>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{service.title}</h1>
              <p className="text-lg text-white/80 max-w-2xl">{service.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Features */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-5">What's included</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {service.features.map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-5">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {service.process.map((p, i) => (
              <div key={p.step} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${iconBg[service.color]} flex items-center justify-center text-sm font-bold mb-3`}>
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{p.step}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Pricing</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {service.pricing.map((tier, i) => (
              <div key={tier.label} className={`rounded-2xl border p-6 shadow-sm ${i === 1 ? `bg-gradient-to-br ${service.gradient} text-white border-transparent` : 'bg-white border-gray-100'}`}>
                <div className={`text-sm font-semibold mb-1 ${i === 1 ? 'text-white/80' : 'text-gray-500'}`}>{tier.label}</div>
                <div className={`text-2xl font-bold mb-1 ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{tier.price}</div>
                <div className={`text-xs ${i === 1 ? 'text-white/70' : 'text-gray-400'}`}>{tier.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ready to get started?</h3>
            <p className="text-gray-500 text-sm">Speak to one of our specialists — no obligation, free consultation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+2348001234567" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 transition text-sm">
              <Phone className="w-4 h-4" /> Call us
            </a>
            <a href="mailto:services@propconnect.ng" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-600/25">
              <Mail className="w-4 h-4" /> Email us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Services({ slug, onBack, onNavigate }: ServicesPageProps) {
  const service = slug ? serviceFromSlug(slug) : undefined;

  if (service) {
    return <ServiceDetail service={service} onBack={onBack || (() => onNavigate('/services'))} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full text-blue-200 text-sm font-medium mb-4">
              <Wrench className="w-4 h-4" /> PropConnect Services
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Everything your property needs</h1>
            <p className="text-lg text-blue-100/80">
              From construction to management, decoration to smart automation — PropConnect connects you with trusted professionals for every stage of property ownership.
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <ServiceCard key={s.slug} service={s} onClick={() => onNavigate(`/services/${s.slug}`)} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-10 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Not sure which service you need?</h2>
          <p className="text-blue-200 mb-6 max-w-xl mx-auto">Our advisors will assess your property and recommend the right combination of services to maximise your value.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:+2348001234567" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition shadow">
              <Phone className="w-4 h-4" /> Call an advisor
            </a>
            <a href="mailto:services@propconnect.ng" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/30 text-white font-semibold rounded-xl hover:bg-blue-500/50 transition border border-white/20">
              <Mail className="w-4 h-4" /> Send a message
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
