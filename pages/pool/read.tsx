'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import WaterWaves from '@/components/WaterWaves';
import Link from 'next/link';
import { Waves, Plus, Search, ArrowRight, Droplet, CircleCheck, CirclePause, RefreshCw, AlertCircle, Pencil, Trash2, Ruler, Clock, X, House, ChevronDown, User } from 'lucide-react';

interface PoolData {
  _id: string;
  namaWadah: string;
  serial: string;
  kedalaman: number;
  keranTutup: number;
  keranNormal: number;
  keranBuka: number;
  isActive?: boolean;
  updatedAt?: string;
}

export default function ReadPoolPage() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const fetchPools = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/pool', { headers: { Authorization: `Bearer ${token}` } });
      setPools(res.data.data);
    } catch {
      setError('Data wadah belum berhasil dimuat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void fetchPools(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus wadah ini?')) return;
    setDeletingId(id);
    setNotice('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/pool/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setPools(previous => previous.filter(pool => pool._id !== id));
      setNotice('Wadah berhasil dihapus.');
    } catch {
      setNotice('Gagal menghapus wadah. Silakan coba lagi.');
    } finally { setDeletingId(null); }
  };
  const activeCount = pools.filter(pool => pool.isActive).length;
  const visiblePools = pools.filter(pool =>
    `${pool.namaWadah} ${pool.serial || ''}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (status === 'all' || (status === 'active' ? pool.isActive : !pool.isActive))
  );
  const addButton = <Link href="/pool/create" className="dash-button dash-button-primary"><Plus size={18} aria-hidden="true" />Tambah wadah</Link>;

  return (
    <div className="dashboard-page">
      <Sidebar expanded />
      <main className="dashboard-main">
        <WaterWaves className="dashboard-header-waves" />
        <div className="dashboard-topline"><span className="dashboard-breadcrumb"><House size={15} aria-hidden="true" />Workspace / <strong>Manajemen wadah</strong></span><div className="dashboard-top-actions"><span className="dashboard-context"><span className="dashboard-context-dot" /> Monitoring air</span><Link href="/profile" className="dashboard-account" aria-label="Buka profil"><User size={18} aria-hidden="true" /><ChevronDown size={14} aria-hidden="true" /></Link></div></div>
        <header className="dashboard-header">
          <div><p className="dashboard-eyebrow">KELOLA DENGAN MUDAH</p><h1>Manajemen wadah</h1><p>Semua wadah air Anda, terpantau dalam satu tempat.</p></div>
          {addButton}
        </header>
        <section className="dashboard-stats" aria-label="Ringkasan wadah">
          {[{ label: 'Total wadah', value: pools.length, icon: Waves, tone: 'blue', hint: 'Wadah terdaftar' }, { label: 'Wadah aktif', value: activeCount, icon: CircleCheck, tone: 'green', hint: 'Status aktif' }, { label: 'Wadah nonaktif', value: pools.length - activeCount, icon: CirclePause, tone: 'slate', hint: 'Status nonaktif' }].map(stat => <div className={`dashboard-stat dashboard-stat-${stat.tone}`} key={stat.label}><span className={`dashboard-stat-icon ${stat.tone}`}><stat.icon size={25} aria-hidden="true" /></span><div><p>{stat.label}</p><strong>{loading || error ? '—' : stat.value}</strong><span>{stat.hint}</span></div><span className="dashboard-stat-chevron" aria-hidden="true"><ArrowRight size={14} /></span></div>)}
        </section>
        <section className="dashboard-collection" aria-labelledby="collection-title" aria-busy={loading}>
          <div className="dashboard-collection-header"><div><h2 id="collection-title">Daftar wadah <span>{loading || error ? '—' : pools.length}</span></h2><p>Kelola konfigurasi dan buka monitoring wadah Anda.</p></div><button className="dash-button dash-button-secondary" onClick={fetchPools} disabled={loading}><RefreshCw size={16} aria-hidden="true" />{loading ? 'Memuat...' : 'Perbarui'}</button></div>
          <div className="dashboard-tools"><div className="dashboard-search"><Search size={18} aria-hidden="true" /><input aria-label="Cari wadah berdasarkan nama atau serial" placeholder="Cari nama atau serial wadah..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={16} /></button>}</div><div className="dashboard-filters" role="group" aria-label="Filter status wadah">{[['all', 'Semua'], ['active', 'Aktif'], ['inactive', 'Nonaktif']].map(([value, label]) => <button key={value} aria-pressed={status === value} className={status === value ? 'selected' : ''} onClick={() => setStatus(value)}>{label}</button>)}</div></div>
          {notice && <p className="dashboard-notice" role="status">{notice}</p>}
          {loading ? <div className="dashboard-skeletons" role="status" aria-label="Memuat daftar wadah">{[1, 2, 3].map(i => <div className="dashboard-skeleton" key={i}><span /><span /><span /></div>)}</div> : error ? <div className="dashboard-empty" role="alert"><span className="dashboard-empty-icon"><AlertCircle size={34} /></span><h3>Belum dapat memuat wadah</h3><p>{error}</p><button className="dash-button dash-button-primary" onClick={fetchPools}><RefreshCw size={17} />Coba lagi</button></div> : pools.length === 0 ? <div className="dashboard-empty"><div className="dashboard-empty-art" aria-hidden="true"><span className="dashboard-empty-pool" /><span className="dashboard-empty-bubble bubble-one" /><span className="dashboard-empty-bubble bubble-two" /><span className="dashboard-empty-bubble bubble-three" /><span className="dashboard-empty-ring" /><span className="dashboard-empty-icon"><Waves size={40} /></span><span className="dashboard-empty-drop"><Droplet size={20} /></span></div><h3>Siap memantau air Anda?</h3><p>Belum ada wadah yang terdaftar. Tambahkan wadah pertama<br className="dashboard-desktop-break" /> untuk mulai mengelola dan memantau ketinggian air.</p>{addButton}<span className="dashboard-empty-caption">Atur nama, serial perangkat, dan kedalaman wadah.</span></div> : visiblePools.length === 0 ? <div className="dashboard-empty"><span className="dashboard-empty-icon"><Search size={32} /></span><h3>Wadah tidak ditemukan</h3><p>Coba kata kunci lain atau ubah filter status.</p><button className="dash-button dash-button-secondary" onClick={() => { setQuery(''); setStatus('all'); }}>Reset pencarian</button></div> : <div className="dashboard-pool-grid">{visiblePools.map(pool => <article className="dashboard-pool-card" key={pool._id}><div className="dashboard-pool-heading"><span className="dashboard-stat-icon blue"><Waves size={23} aria-hidden="true" /></span><span className={`dashboard-badge ${pool.isActive ? 'active' : ''}`}><span />{pool.isActive ? 'Aktif' : 'Nonaktif'}</span></div><h3>{pool.namaWadah}</h3><p className="dashboard-serial">Serial: {pool.serial || 'Belum diatur'}</p><div className="dashboard-depth"><Ruler size={18} aria-hidden="true" /><span>Kedalaman wadah</span><strong>{pool.kedalaman} <small>cm</small></strong></div><div className="dashboard-valves">{[['Tutup', pool.keranTutup], ['Normal', pool.keranNormal], ['Buka', pool.keranBuka]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><Link className="dash-button dash-button-monitor" href={`/pool/${pool._id}/detail`}>Buka monitoring<ArrowRight size={17} aria-hidden="true" /></Link><div className="dashboard-card-footer"><span><Clock size={13} aria-hidden="true" />{pool.updatedAt ? new Date(pool.updatedAt).toLocaleDateString('id-ID') : 'Belum diperbarui'}</span><div><Link href={`/pool/${pool._id}/update`} aria-label={`Ubah ${pool.namaWadah}`}><Pencil size={17} /></Link><button onClick={() => handleDelete(pool._id)} disabled={deletingId !== null} aria-label={`Hapus ${pool.namaWadah}`}><Trash2 size={17} /></button></div></div></article>)}</div>}
        </section>
        <footer className="dashboard-footer"><Waves size={15} aria-hidden="true" /> SIMONIKA <span>Monitoring air yang lebih sederhana.</span></footer>
      </main>
    </div>
  );
}
