import { useEffect, useState } from 'react';
import { Home, Search, MessageSquare, Shield, User, Menu, X, Building2 } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

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
  const [sessionRole, setSessionRole] = useState<'buyer' | 'realtor' | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const role = (data.session?.user?.user_metadata?.role as 'buyer' | 'realtor' | undefined) || null;
      setSessionRole(role);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void event;
      const role = (session?.user?.user_metadata?.role as 'buyer' | 'realtor' | undefined) || null;
      setSessionRole(role);
    });

    loadSession();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
          <button onClick={() => onNavigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PropTrust</span>
          </button>
          
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
          </nav>
          
          <div className="hidden md:flex items-center gap-3">
            {sessionRole ? (
              <>
                {sessionRole === 'realtor' && (
                  <button onClick={() => onNavigate('/realtor/portal')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">
                    Portal
                  </button>
                )}
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
            {navItems.map(item => (
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
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              {sessionRole ? (
                <>
                  {sessionRole === 'realtor' && (
                    <button onClick={() => { onNavigate('/realtor/portal'); setMobileOpen(false); }} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg">Portal</button>
                  )}
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