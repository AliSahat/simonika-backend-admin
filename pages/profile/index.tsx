import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import WaterWaves from '@/components/WaterWaves';
import { House, User, Waves, CalendarDays, Clock, Fingerprint, Copy, Check, ArrowRight, LogOut, ShieldCheck, Info, RefreshCw, AtSign, KeyRound } from 'lucide-react';

interface Profile { id: string; name: string; username: string; createdAt: string; updatedAt: string; }
const formatDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const formatTime = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [copyMessage, setCopyMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan masuk kembali untuk melihat informasi akun Anda.');
        const response = await axios.get('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const user = response.data.data?.user || response.data.user;
        if (!user) throw new Error('Informasi profil belum tersedia. Silakan coba lagi.');
        setProfile(user);
      } catch (err) {
        if (!controller.signal.aborted) setError(axios.isAxiosError(err) && typeof err.response?.data?.message === 'string' ? err.response.data.message : err instanceof Error ? err.message : 'Profil belum berhasil dimuat. Silakan coba lagi.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [retry]);

  const copyId = async () => {
    if (!profile) return;
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setCopyMessage('ID akun berhasil disalin.');
    } catch { setCopied(false); setCopyMessage('ID belum dapat disalin. Anda dapat memilih dan menyalin teks ID secara langsung.'); }
  };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    await router.push('/');
  };
  const initials = profile?.name.trim().split(/\s+/).map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase() || 'U';

  return <div className="dashboard-page profile-page"><Sidebar expanded /><main className="dashboard-main"><WaterWaves className="dashboard-header-waves" />
    <div className="dashboard-topline"><span className="dashboard-breadcrumb"><House size={15} aria-hidden="true" /><Link href="/pool/read">Workspace</Link><span>/</span><strong>Profil akun</strong></span><span className="dashboard-context"><User size={14} aria-hidden="true" />Akun saya</span></div>
    <header className="dashboard-header"><div><p className="dashboard-eyebrow">RUANG PERSONAL ANDA</p><h1>Profil akun</h1><p>Kenali informasi akun dan kelola sesi SIMONIKA Anda.</p></div><button className="dash-button dash-button-secondary" onClick={() => setRetry(value => value + 1)} disabled={loading}><RefreshCw size={16} aria-hidden="true" />{loading ? 'Memuat...' : 'Perbarui profil'}</button></header>
    {loading ? <div className="update-load-state" role="status"><span className="login-spinner" aria-hidden="true" /><h2>Menyiapkan profil Anda</h2><p>Memuat informasi akun SIMONIKA...</p></div> : error || !profile ? <div className="update-load-state" role="alert"><Info size={30} aria-hidden="true" /><h2>Belum dapat membuka profil</h2><p>{error || 'Informasi akun tidak tersedia.'}</p><button className="dash-button dash-button-primary" onClick={() => setRetry(value => value + 1)}><RefreshCw size={16} aria-hidden="true" />Coba lagi</button><Link href="/" className="create-back">Ke halaman masuk<ArrowRight size={15} aria-hidden="true" /></Link></div> : <div className="profile-layout">
      <aside className="profile-identity"><div className="profile-identity-card"><div className="profile-cover"><WaterWaves className="profile-cover-waves" /><DropletDecoration /></div><div className="profile-identity-body"><div className="profile-avatar" aria-hidden="true">{initials}</div><span className="profile-identity-eyebrow">AKUN SIMONIKA</span><h2>{profile.name}</h2><p className="profile-handle">@{profile.username}</p><div className="profile-member"><CalendarDays size={16} aria-hidden="true" /><span>Bergabung sejak<strong>{formatDate(profile.createdAt)}</strong></span></div><Link href="/pool/read" className="dash-button dash-button-primary"><Waves size={17} aria-hidden="true" />Kelola wadah<ArrowRight size={16} aria-hidden="true" /></Link></div></div><div className="profile-help"><span className="create-section-icon blue"><Info size={20} aria-hidden="true" /></span><h3>Perlu memperbarui akun?</h3><p>Hubungi administrator untuk bantuan perubahan informasi profil, username, atau password.</p></div></aside>
      <div className="profile-content"><section className="profile-details" aria-labelledby="profile-details-title"><div className="profile-section-heading"><span className="create-section-icon blue"><User size={20} aria-hidden="true" /></span><div><h2 id="profile-details-title">Informasi pribadi</h2><p>Detail identitas yang terdaftar pada akun Anda.</p></div><span className="profile-readonly">Informasi akun</span></div><dl className="profile-detail-grid"><div><dt><User size={15} aria-hidden="true" />Nama lengkap</dt><dd>{profile.name}</dd></div><div><dt><AtSign size={15} aria-hidden="true" />Username</dt><dd>{profile.username}</dd></div><div className="profile-id-field"><dt><Fingerprint size={15} aria-hidden="true" />ID akun</dt><dd><span>{profile.id}</span><button onClick={copyId} aria-label="Salin ID akun" title="Salin ID akun">{copied ? <Check size={17} /> : <Copy size={17} />}</button></dd></div></dl><p className="profile-copy-message" role="status">{copyMessage}</p><div className="profile-account-dates"><div><span className="create-section-icon green"><CalendarDays size={19} aria-hidden="true" /></span><div><p>Akun dibuat</p><strong>{formatDate(profile.createdAt)}</strong><span>{formatTime(profile.createdAt)}</span></div></div><div><span className="create-section-icon violet"><Clock size={19} aria-hidden="true" /></span><div><p>Terakhir diperbarui</p><strong>{formatDate(profile.updatedAt)}</strong><span>{formatTime(profile.updatedAt)}</span></div></div></div></section>
      <section className="profile-session" aria-labelledby="session-heading"><div className="profile-section-heading"><span className="create-section-icon green"><ShieldCheck size={20} aria-hidden="true" /></span><div><h2 id="session-heading">Sesi & akses akun</h2><p>Kelola akses SIMONIKA pada browser ini.</p></div></div><div className="profile-session-info"><KeyRound size={20} aria-hidden="true" /><div><h3>Anda sedang masuk sebagai @{profile.username}</h3><p>Keluar dari akun setelah selesai menggunakan perangkat bersama.</p></div></div><div className="profile-logout-row"><div><h3>Keluar dari akun</h3><p>Anda akan kembali ke halaman masuk.</p></div><button className="dash-button profile-logout" onClick={handleLogout} disabled={loggingOut}><LogOut size={17} aria-hidden="true" />{loggingOut ? 'Keluar...' : 'Keluar akun'}</button></div><span className="login-sr-only" role="status">{loggingOut ? 'Sedang keluar dari akun' : ''}</span></section>
      <Link href="/pool/read" className="profile-workspace-link"><span className="create-section-icon blue"><Waves size={22} aria-hidden="true" /></span><div><h3>Kembali ke workspace</h3><p>Lihat wadah dan lanjutkan monitoring air Anda.</p></div><ArrowRight size={20} aria-hidden="true" /></Link></div>
    </div>}
    <footer className="dashboard-footer"><Waves size={15} aria-hidden="true" />SIMONIKA<span>Monitoring air yang lebih sederhana.</span></footer>
  </main></div>;
}

function DropletDecoration() {
  return <span className="profile-cover-mark" aria-hidden="true"><Waves size={40} /></span>;
}
