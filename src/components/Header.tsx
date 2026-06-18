import { useEffect, useState } from 'react';
import { Home, Search, MessageSquare, Shield, User, Menu, X, Building2, ChevronDown } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import { serviceTitleToSlug } from './Services';

interface HeaderProps {
  currentPath: string;
  onNavigate: (page: string) => void;
}

const isActivePath = (currentPath: string, target: string): boolean => {
  if (target === '/') return currentPath === '/';
  return currentPath === target || currentPath.startsWith(`${target}/`);
};

export default function Header({ currentPath, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [sessionRole, setSessionRole] = useState<'buyer' | 'realtor' | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const services = [
    'Building Construction',
    'Property Management',
    'Cleaning Services',
    'Interior Decoration',
    'Smart Home Automation',
  ];

  const initials = (value: string | null) => {
    if (!value) return 'U';
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      // Prefer role from profiles table as source of truth; fall back to user_metadata only if no profile exists
      const roleMeta = (data.session?.user?.user_metadata?.role as 'buyer' | 'realtor' | undefined) || null;

      // Fetch user's full name and role from profiles table
      if (data.session?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (!cancelled) {
          setUserName(profileData?.first_name || profileData?.full_name || (profileData?.email ? profileData.email.split('@')[0] : null) || null);
          setUserAvatar(profileData?.avatar_url || data.session.user.user_metadata?.avatar_url || null);
          // Use profile role when a profile exists; otherwise use metadata role
          setSessionRole(profileData ? (profileData.role as 'buyer' | 'realtor' | null) : roleMeta);
        }
      } else {
        setSessionRole(roleMeta);
      }
    };

      const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void event;
      const roleFromMeta = (session?.user?.user_metadata?.role as 'buyer' | 'realtor' | undefined) || null;
      // Fetch user's full name and prefer profile role when available
      if (session?.user?.id) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            if (profileData) {
              setUserName(profileData.first_name || profileData.full_name || profileData.email?.split('@')[0] || null);
              setUserAvatar(profileData.avatar_url || session.user.user_metadata?.avatar_url || null);
              setSessionRole((profileData.role as 'buyer' | 'realtor' | undefined) || roleFromMeta);
            } else {
              setSessionRole(roleFromMeta);
            }
          });
      } else {
        setSessionRole(roleFromMeta);
      }
    });

    loadSession();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.assign('/');
  };

  const handleLogoClick = () => {
    onNavigate('/');
  };
  
  const navItems = [
    { id: '/', label: 'Home', icon: Home },
    { id: '/listings', label: 'Listings', icon: Search },
    { id: '/agents', label: 'Agents', icon: User },
    { id: '/escrow', label: 'How It Works', icon: Shield },
    ...(sessionRole ? [{ id: '/messages', label: 'Messages', icon: MessageSquare }] : []),
  ];
  
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={handleLogoClick} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PropTrust</span>
          </button>
          
          {sessionRole !== 'realtor' && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActivePath(currentPath, item.id)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <div className="relative group">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    servicesOpen
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Our Services</span>
                  <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {servicesOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-2 w-56 z-10">
                    <button
                      onClick={() => { setServicesOpen(false); onNavigate('/services'); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-50 transition"
                    >
                      All Services →
                    </button>
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      {services.map((service) => (
                        <button
                          key={service}
                          onClick={() => {
                            setServicesOpen(false);
                            const slug = serviceTitleToSlug(service);
                            onNavigate(slug ? `/services/${slug}` : '/services');
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}
          
          <div className="hidden md:flex items-center gap-3">
            {sessionRole ? (
              <>
                {sessionRole === 'realtor' && (
                  <button onClick={() => onNavigate('/realtor/portal')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                    Portal
                  </button>
                )}
                <button
                  onClick={() => onNavigate('/profile')}
                  className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:ring-2 hover:ring-blue-300 transition"
                >
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    initials(userName)
                  )}
                </button>
                <button onClick={handleSignOut} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('/signin')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                  Sign In
                </button>
                <button onClick={() => onNavigate('/signup')} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
                  Sign Up
                </button>
              </>
            )}
          </div>
          
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
            {sessionRole !== 'realtor' && navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActivePath(currentPath, item.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <span>Our Services</span>
              <ChevronDown className="w-5 h-5" style={{ transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {servicesOpen && (
              <div className="pl-6 space-y-1">
                <button
                  onClick={() => { setServicesOpen(false); setMobileOpen(false); onNavigate('/services'); }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  All Services →
                </button>
                {services.map((service) => (
                  <button
                    key={service}
                    onClick={() => {
                      setServicesOpen(false);
                      setMobileOpen(false);
                      const slug = serviceTitleToSlug(service);
                      onNavigate(slug ? `/services/${slug}` : '/services');
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  >
                    {service}
                  </button>
                ))}
              </div>
            )}
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              {sessionRole ? (
                <>
                  {sessionRole === 'realtor' && (
                    <button onClick={() => { onNavigate('/realtor/portal'); setMobileOpen(false); }} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg">Portal</button>
                  )}
                  <button onClick={() => { onNavigate('/profile'); setMobileOpen(false); }} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg">Profile</button>
                  <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { onNavigate('/signin'); setMobileOpen(false); }} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg">Sign In</button>
                  <button onClick={() => { onNavigate('/signup'); setMobileOpen(false); }} className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg">Sign Up</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}