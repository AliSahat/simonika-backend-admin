'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import WaterWaves from '@/components/WaterWaves';
import Link from 'next/link';
import { Waves, Plus, Search, ArrowRight, Droplet, CircleCheck, CirclePause, RefreshCw, AlertCircle, Pencil, Trash2, Ruler, Clock, X, House, ChevronDown, User, Bell } from 'lucide-react';

interface PoolData {
  _id: string;
  namaWadah: string;
  serial: string;
  kedalaman: number;
  jarakSensorDasar?: number;
  batasIsiMulai?: number;
  batasIsiBerhenti?: number;
  batasBuangMulai?: number;
  batasBuangBerhenti?: number;
  modeAuto?: boolean;
  keranTutup?: number;
  keranNormal?: number;
  keranBuka?: number;
  isActive?: boolean;
  updatedAt?: string;
}

export default function ReadPoolPage() {
  const router = useRouter();
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
      if (!token) {
        await router.replace('/');
        return;
      }
      const res = await axios.get('/api/pool', { headers: { Authorization: `Bearer ${token}` } });
      setPools(res.data.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        await router.replace('/');
        return;
      }
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
      if (!token) {
        await router.replace('/');
        return;
      }
      await axios.delete(`/api/pool/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setPools(previous => previous.filter(pool => pool._id !== id));
      setNotice('Wadah berhasil dihapus.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        await router.replace('/');
        return;
      }
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
        <div className="dashboard-topline">
          <span className="dashboard-breadcrumb">
            <House size={15} aria-hidden="true" />
            Workspace / <strong>Manajemen wadah</strong>
          </span>
          <div className="dashboard-top-actions">
            <span className="dashboard-context">
              <span className="dashboard-context-dot" /> Monitoring air
            </span>
            <span className="bento-icon-btn" aria-hidden="true">
              <Bell size={16} />
              <em className="bento-icon-badge">{loading || error ? 0 : activeCount}</em>
            </span>
            <Link href="/profile" className="dashboard-account" aria-label="Buka profil">
              <User size={18} aria-hidden="true" />
              <ChevronDown size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">KELOLA DENGAN MUDAH</p>
            <h1>Manajemen wadah</h1>
            <p className="dashboard-subtitle-row">
              <span className="dashboard-live-dot" aria-hidden="true" />
              Semua wadah air Anda, terpantau dalam satu tempat.
            </p>
          </div>
          <div className="dashboard-header-cta">
            {addButton}
          </div>
        </header>

        <div className="bento-dashboard-grid">
          <div className="bento-hero-card">
            <section className="dashboard-stats" aria-label="Ringkasan wadah">
              {[
                { label: 'Total wadah', value: pools.length, icon: Waves, tone: 'blue', hint: 'Wadah terdaftar' },
                { label: 'Wadah aktif', value: activeCount, icon: CircleCheck, tone: 'green', hint: 'Status aktif' },
                { label: 'Wadah nonaktif', value: pools.length - activeCount, icon: CirclePause, tone: 'slate', hint: 'Status nonaktif' },
              ].map((stat, idx) => (
                <div className={`dashboard-stat dashboard-stat-${stat.tone}`} key={stat.label}>
                  <span className={`dashboard-stat-icon ${stat.tone}`}>
                    <stat.icon size={22} aria-hidden="true" />
                  </span>
                  <div className="dashboard-stat-body">
                    <p>{stat.label}</p>
                    <div className="dashboard-stat-value-row">
                      <strong>{loading || error ? '—' : stat.value}</strong>
                      <em className={`bento-trend-pill ${stat.tone === 'green' ? 'positive' : stat.tone === 'blue' ? 'primary' : 'muted'}`}>
                        {stat.tone === 'green' ? '+Live' : stat.tone === 'blue' ? '100%' : 'Idle'}
                      </em>
                    </div>
                    <span>{stat.hint}</span>
                  </div>
                  {idx === 2 ? (
                    <svg className="bento-mini-sparkline" viewBox="0 0 84 32" fill="none" aria-hidden="true">
                      <path d="M2 24C14 22 18 12 30 15C42 18 48 6 60 9C70 11 76 4 82 5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <span className="dashboard-stat-chevron" aria-hidden="true"><ArrowRight size={14} /></span>
                  )}
                </div>
              ))}
            </section>

            <div className="bento-pulse-panel" aria-hidden="true">
              <div className="bento-pulse-header">
                <div>
                  <div className="bento-pulse-title-row">
                    <h3>Water telemetry pulse</h3>
                    <span className="bento-pill-compare">Realtime</span>
                  </div>
                  <p>Sinkronisasi sensor & aktuator <strong className="text-emerald">+Live MQTT</strong> di seluruh wadah</p>
                </div>
                <div className="bento-segmented-track">
                  <span className="active">7d</span>
                  <span>14d</span>
                  <span>30d</span>
                  <span>1y</span>
                </div>
              </div>
              <div className="bento-spline-wrap">
                <svg className="bento-spline-svg" viewBox="0 0 640 170" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="bentoPulseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="35" x2="640" y2="35" stroke="rgba(255,255,255,0.05)" />
                  <line x1="0" y1="85" x2="640" y2="85" stroke="rgba(255,255,255,0.05)" />
                  <line x1="0" y1="135" x2="640" y2="135" stroke="rgba(255,255,255,0.05)" />
                  <path d="M0 130 C90 120, 150 95, 230 104 C310 112, 380 72, 470 82 C540 90, 590 60, 640 68" stroke="rgba(148,163,184,0.35)" strokeWidth="1.75" strokeDasharray="5 5" fill="none" />
                  <path d="M0 118 C85 96, 145 50, 235 66 C325 82, 385 28, 475 44 C545 56, 590 22, 640 28 L640 170 L0 170 Z" fill="url(#bentoPulseFill)" />
                  <path d="M0 118 C85 96, 145 50, 235 66 C325 82, 385 28, 475 44 C545 56, 590 22, 640 28" stroke="#3B82F6" strokeWidth="2.75" strokeLinecap="round" fill="none" />
                  <circle cx="475" cy="44" r="4.5" fill="#3B82F6" stroke="#F8FAFC" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          <aside className="bento-side-stack" aria-label="Ringkasan status realtime">
            <div className="bento-side-card">
              <div className="bento-side-card-head">
                <div>
                  <h3>Rasio Wadah Aktif</h3>
                  <p>Target kesiapan perangkat</p>
                </div>
                <span className="bento-mini-icon"><Waves size={15} aria-hidden="true" /></span>
              </div>
              <div className="bento-goal-body">
                <div className="bento-ring-wrap" aria-hidden="true">
                  <svg viewBox="0 0 88 88" className="bento-ring-svg">
                    <circle cx="44" cy="44" r="35" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                    <circle
                      cx="44"
                      cy="44"
                      r="35"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray="220"
                      strokeDashoffset={pools.length > 0 ? Math.round(220 * (1 - activeCount / pools.length)) : 165}
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <strong className="bento-ring-label">
                    {loading || error ? '—' : pools.length > 0 ? `${Math.round((activeCount / pools.length) * 100)}%` : '0%'}
                  </strong>
                </div>
                <dl className="bento-goal-metrics">
                  <div><dt>Terdaftar</dt><dd>{loading || error ? '—' : pools.length}</dd></div>
                  <div><dt>Aktif</dt><dd>{loading || error ? '—' : activeCount}</dd></div>
                  <div><dt>Nonaktif</dt><dd>{loading || error ? '—' : pools.length - activeCount}</dd></div>
                </dl>
              </div>
            </div>

            <div className="bento-side-card">
              <div className="bento-side-card-head">
                <span className="bento-live-title">
                  <span className="dashboard-live-dot" aria-hidden="true" />
                  <strong>Live Telemetry</strong>
                </span>
                <span className="bento-side-link">MQTT Broker</span>
              </div>
              <div className="bento-live-body">
                <div>
                  <strong className="bento-live-number">{loading || error ? '—' : activeCount}</strong>
                  <span>Perangkat online</span>
                </div>
                <div className="bento-equalizer" aria-hidden="true">
                  <span style={{ height: '42%' }} />
                  <span style={{ height: '75%' }} />
                  <span style={{ height: '58%' }} />
                  <span style={{ height: '92%' }} />
                  <span style={{ height: '66%' }} />
                  <span style={{ height: '84%' }} />
                  <span style={{ height: '50%' }} />
                </div>
              </div>
              <div className="bento-health-pill">• Telemetry healthy</div>
            </div>

            <div className="bento-side-card">
              <div className="bento-side-card-head">
                <div>
                  <h3>Distribusi Kanal</h3>
                  <p>Alokasi status perangkat</p>
                </div>
                <strong className="bento-channel-total">{loading || error ? '—' : pools.length} unit</strong>
              </div>
              <div className="bento-stacked-bar" aria-hidden="true">
                <span className="bar-blue" style={{ width: '48%' }} />
                <span className="bar-amber" style={{ width: '20%' }} />
                <span className="bar-emerald" style={{ width: '22%' }} />
                <span className="bar-slate" style={{ width: '10%' }} />
              </div>
              <ul className="bento-channel-list">
                <li><span className="dot blue" /><span>Wadah Aktif</span><em>{pools.length > 0 ? `${Math.round((activeCount / pools.length) * 100)}%` : '0%'}</em><strong>{loading || error ? '—' : activeCount}</strong></li>
                <li><span className="dot amber" /><span>Mode Otomatis</span><em>Auto</em><strong>{loading || error ? '—' : pools.filter(p => p.modeAuto !== false).length}</strong></li>
                <li><span className="dot emerald" /><span>Telemetry Ready</span><em>MQTT</em><strong>{loading || error ? '—' : pools.filter(p => Boolean(p.serial)).length}</strong></li>
                <li><span className="dot slate" /><span>Standby / Nonaktif</span><em>Idle</em><strong>{loading || error ? '—' : pools.length - activeCount}</strong></li>
              </ul>
            </div>
          </aside>
        </div>

        <section className="dashboard-collection" aria-labelledby="collection-title" aria-busy={loading}>
          <div className="dashboard-collection-header"><div><h2 id="collection-title">Daftar wadah <span>{loading || error ? '—' : pools.length}</span></h2><p>Kelola konfigurasi dan buka monitoring wadah Anda.</p></div><button className="dash-button dash-button-secondary" onClick={fetchPools} disabled={loading}><RefreshCw size={16} aria-hidden="true" />{loading ? 'Memuat...' : 'Perbarui'}</button></div>
          <div className="dashboard-tools"><div className="dashboard-search"><Search size={18} aria-hidden="true" /><input aria-label="Cari wadah berdasarkan nama atau serial" placeholder="Cari nama atau serial wadah..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={16} /></button>}</div><div className="dashboard-filters" role="group" aria-label="Filter status wadah">{[['all', 'Semua'], ['active', 'Aktif'], ['inactive', 'Nonaktif']].map(([value, label]) => <button key={value} aria-pressed={status === value} className={status === value ? 'selected' : ''} onClick={() => setStatus(value)}>{label}</button>)}</div></div>
          {notice && <p className="dashboard-notice" role="status">{notice}</p>}
          {loading ? <div className="dashboard-skeletons" role="status" aria-label="Memuat daftar wadah">{[1, 2, 3].map(i => <div className="dashboard-skeleton" key={i}><span /><span /><span /></div>)}</div> : error ? <div className="dashboard-empty" role="alert"><span className="dashboard-empty-icon"><AlertCircle size={34} /></span><h3>Belum dapat memuat wadah</h3><p>{error}</p><button className="dash-button dash-button-primary" onClick={fetchPools}><RefreshCw size={17} />Coba lagi</button></div> : pools.length === 0 ? <div className="dashboard-empty"><div className="dashboard-empty-art" aria-hidden="true"><span className="dashboard-empty-pool" /><span className="dashboard-empty-bubble bubble-one" /><span className="dashboard-empty-bubble bubble-two" /><span className="dashboard-empty-bubble bubble-three" /><span className="dashboard-empty-ring" /><span className="dashboard-empty-icon"><Waves size={40} /></span><span className="dashboard-empty-drop"><Droplet size={20} /></span></div><h3>Siap memantau air Anda?</h3><p>Belum ada wadah yang terdaftar. Tambahkan wadah pertama<br className="dashboard-desktop-break" /> untuk mulai mengelola dan memantau ketinggian air.</p>{addButton}<span className="dashboard-empty-caption">Atur nama, serial perangkat, dan kedalaman wadah.</span></div> : visiblePools.length === 0 ? <div className="dashboard-empty"><span className="dashboard-empty-icon"><Search size={32} /></span><h3>Wadah tidak ditemukan</h3><p>Coba kata kunci lain atau ubah filter status.</p><button className="dash-button dash-button-secondary" onClick={() => { setQuery(''); setStatus('all'); }}>Reset pencarian</button></div> : <div className="dashboard-pool-grid">{visiblePools.map(pool => <article className="dashboard-pool-card" key={pool._id}><div className="dashboard-pool-heading"><span className="dashboard-stat-icon blue"><Waves size={23} aria-hidden="true" /></span><span className={`dashboard-badge ${pool.isActive ? 'active' : ''}`}><span />{pool.isActive ? 'Aktif' : 'Nonaktif'}</span></div><h3>{pool.namaWadah}</h3><p className="dashboard-serial">Serial: {pool.serial || 'Belum diatur'}</p><div className="dashboard-depth"><Ruler size={18} aria-hidden="true" /><span>Kedalaman wadah</span><strong>{pool.kedalaman} <small>cm</small></strong></div><div className="dashboard-valves">{[['Mulai isi', pool.batasIsiMulai ?? pool.keranBuka ?? '—'], ['Stop isi', pool.batasIsiBerhenti ?? pool.keranNormal ?? '—'], ['Mulai buang', pool.batasBuangMulai ?? pool.keranTutup ?? '—']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><Link className="dash-button dash-button-monitor" href={`/pool/${pool._id}/detail`}>Buka monitoring<ArrowRight size={17} aria-hidden="true" /></Link><div className="dashboard-card-footer"><span><Clock size={13} aria-hidden="true" />{pool.updatedAt ? new Date(pool.updatedAt).toLocaleDateString('id-ID') : 'Belum diperbarui'}</span><div><Link href={`/pool/${pool._id}/update`} aria-label={`Ubah ${pool.namaWadah}`}><Pencil size={17} /></Link><button onClick={() => handleDelete(pool._id)} disabled={deletingId !== null} aria-label={`Hapus ${pool.namaWadah}`}><Trash2 size={17} /></button></div></div></article>)}</div>}
        </section>
        <footer className="dashboard-footer"><Waves size={15} aria-hidden="true" /> SIMONIKA <span>Monitoring air yang lebih sederhana.</span></footer>
      </main>
    </div>
  );
}
