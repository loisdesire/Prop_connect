import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import BuyerApp from './BuyerApp';
import RealtorPortal from './components/RealtorPortal';
import RealtorLanding from './RealtorLanding';
import supabase from './lib/supabase';

function RealtorShell() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error || !data.session) {
        navigate('/signin', { replace: true });
        return;
      }
      const role = data.session.user?.user_metadata?.role;
      if (role && role !== 'realtor') {
        navigate('/signin', { replace: true });
        return;
      }
      setChecking(false);
    };
    checkSession();
    return () => { cancelled = true; };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-100/80">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <RealtorPortal onBack={() => navigate('/')} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/realtor" element={<RealtorLanding />} />
      <Route path="/realtor/portal" element={<RealtorShell />} />
      <Route path="/*" element={<BuyerApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
