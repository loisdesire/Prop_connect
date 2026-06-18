import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Camera, Save, UserRound, Upload, Trash2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

interface ProfilePageProps {
  onBack?: () => void;
  onSaveSuccess?: () => void;
}

type ProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string;
  company: string;
  license: string;
  avatar_url: string;
  role: 'buyer' | 'realtor';
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.readAsDataURL(file);
  });

export default function ProfilePage({ onBack, onSaveSuccess }: ProfilePageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    company: '',
    license: '',
    avatar_url: '',
    role: 'buyer',
  });

  const displayName = useMemo(() => {
    const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ');
    if (fullName) return fullName;
    const emailLocal = form.email ? form.email.split('@')[0] : null;
    return emailLocal || 'Profile';
  }, [form.first_name, form.last_name, form.email]);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/signin');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (cancelled) return;

      setForm({
        first_name: data?.first_name || session.user.user_metadata?.first_name || '',
        last_name: data?.last_name || session.user.user_metadata?.last_name || '',
        email: data?.email || session.user.email || '',
        phone: data?.phone || '',
        bio: data?.bio || '',
        company: data?.company || '',
        license: data?.license || '',
        avatar_url: data?.avatar_url || session.user.user_metadata?.avatar_url || '',
        role: (data?.role as 'buyer' | 'realtor') || (session.user.user_metadata?.role as 'buyer' | 'realtor') || 'buyer',
      });
      setLoading(false);
    };

    void loadProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || `anon-${Date.now()}`;
      const ext = (file.name.split('.').pop() || 'jpg').split('?')[0];
      const path = `avatars/${userId}_${Date.now()}.${ext}`;

      // Try upload to Supabase Storage first
      try {
        const upload = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
        if (upload.error) {
          console.warn('[ProfilePage] storage upload error:', upload.error.message);
          // fallback to data URL
          const dataUrl = await fileToDataUrl(file);
          setForm((prev) => ({ ...prev, avatar_url: dataUrl }));
          return;
        }

        const { data: pub } = await supabase.storage.from('avatars').getPublicUrl(path);
        const publicUrl = (pub && pub.publicUrl) || '';
        if (publicUrl) {
          setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
        } else {
          const dataUrl = await fileToDataUrl(file);
          setForm((prev) => ({ ...prev, avatar_url: dataUrl }));
        }
        return;
      } catch (uploadErr) {
        console.warn('[ProfilePage] storage upload exception:', uploadErr);
        const dataUrl = await fileToDataUrl(file);
        setForm((prev) => ({ ...prev, avatar_url: dataUrl }));
        return;
      }
    } catch (err) {
      // Fallback: use data URL
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, avatar_url: dataUrl }));
    }
  };

  const clearAvatar = () => {
    setForm((prev) => ({ ...prev, avatar_url: '' }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('You need to sign in first');

      const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ').trim();

      const fullPayload = {
        id: session.user.id,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        full_name: fullName || null,
        phone: form.phone || null,
        bio: form.bio || null,
        company: form.role === 'realtor' ? form.company || null : null,
        license: form.role === 'realtor' ? form.license || null : null,
        avatar_url: form.avatar_url || null,
        role: form.role,
        updated_at: new Date().toISOString(),
      };

      const minimalPayload = {
        id: session.user.id,
        email: form.email,
        role: form.role,
        updated_at: new Date().toISOString(),
      };

      // Upsert with select to get detailed error if any
      let result = await supabase.from('profiles').upsert(fullPayload).select().single();

      if (result.error && /column|schema cache/i.test(result.error.message || '')) {
        // Retry minimal
        result = await supabase.from('profiles').upsert(minimalPayload).select().single();
      }

      if (result.error) {
        throw result.error;
      }

      // Update user metadata; small values only
      try {
        await supabase.auth.updateUser({
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
            name: fullName || displayName,
            role: form.role,
          },
        });
      } catch (metaErr) {
        console.warn('[ProfilePage] auth.updateUser failed:', metaErr);
      }

      // If avatar_url is a URL (from storage), try to update profile avatar separately
      if (form.avatar_url) {
        try {
          const { error: avatarErr } = await supabase.from('profiles').update({ avatar_url: form.avatar_url }).eq('id', session.user.id);
          if (avatarErr) console.warn('[ProfilePage] Avatar update failed:', avatarErr.message || avatarErr);
        } catch (e) {
          console.warn('[ProfilePage] Avatar update exception:', e);
        }
      }

      setMessage({ kind: 'success', text: 'Profile saved successfully.' });
      onSaveSuccess?.();
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message || 'Unable to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_55%)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <button onClick={() => (onBack ? onBack() : navigate(-1))} className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-6 rounded-3xl border border-blue-100 bg-white shadow-sm p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xl font-bold text-blue-700 shrink-0 border border-blue-100">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-blue-700 font-medium">Profile center</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{displayName}</h1>
                <p className="text-sm text-gray-500 capitalize">{form.role} account · name, contact, and photo</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                />
              </label>
              <button
                type="button"
                onClick={clearAvatar}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-red-200 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
                Remove photo
              </button>
            </div>
          </div>

          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              Square photos look best
            </div>
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
              <UserRound className="w-4 h-4 text-blue-600" />
              Header avatar updates automatically
            </div>
            <div className="rounded-2xl bg-gray-50 p-3 border border-gray-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Keep this page minimal and editable
            </div>
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile settings</h2>
                <p className="text-gray-500 mt-1">Update the details that show on your profile and in messages.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <UserRound className="w-4 h-4" />
                Basic info
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Identity</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={form.email} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Contact & Bio</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={5} placeholder="Tell people a bit about yourself" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                  </div>
                </div>
              </div>

              {form.role === 'realtor' && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">Realtor details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License</label>
                      <input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center">
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-70">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              {message && (
                <p className={`text-sm ${message.kind === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>
              )}
            </div>
        </section>
      </div>
    </div>
  );
}
