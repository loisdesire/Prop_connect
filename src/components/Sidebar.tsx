import { Home, Search, Users, MessageSquare, Wrench, Shield, LayoutDashboard, ChevronLeft, ChevronRight, LogOut, Settings, X, Building2 } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  userName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
  userRole: 'buyer' | 'realtor' | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/listings', label: 'Browse Listings', icon: Search },
  { path: '/agents', label: 'Agents', icon: Users },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/services', label: 'Services', icon: Wrench },
  { path: '/escrow', label: 'How It Works', icon: Shield },
];

const initials = (name: string | null) => {
  if (!name) return 'U';
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
};

function SidebarContent({ currentPath, onNavigate, onSignOut, userName, userEmail, userAvatar, userRole, collapsed, onToggleCollapse, onMobileClose }: Omit<SidebarProps, 'mobileOpen'>) {
  const nav = [
    ...NAV,
    ...(userRole === 'realtor' ? [{ path: '/realtor/portal', label: 'Realtor Portal', icon: LayoutDashboard }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo + toggle */}
      <div className={`flex items-center h-16 px-3 border-b border-gray-100 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <button onClick={() => onNavigate('/')} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">PropConnect</span>
          </button>
        )}
        <div className="flex items-center gap-1">
          {/* Mobile close */}
          <button onClick={onMobileClose} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <X className="w-5 h-5" />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {nav.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => { onNavigate(path); onMobileClose(); }}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-gray-100 p-2 space-y-0.5">
        <button
          onClick={() => { onNavigate('/profile'); onMobileClose(); }}
          title={collapsed ? 'Edit profile' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userAvatar ? <img src={userAvatar} alt={userName || ''} className="w-full h-full object-cover" /> : initials(userName)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-gray-900 truncate text-sm">{userName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail || ''}</p>
            </div>
          )}
          {!collapsed && <Settings className="w-4 h-4 text-gray-400 shrink-0" />}
        </button>
        <button
          onClick={onSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  const { collapsed, mobileOpen, onMobileClose } = props;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl z-50">
            <SidebarContent {...props} collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-gray-100 transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent {...props} onMobileClose={() => {}} />
      </div>
    </>
  );
}
