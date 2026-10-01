'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Sidebar from '@/components/Sidebar';
import WaterWaves from '@/components/WaterWaves';
import { ArrowLeft, ArrowRight, House, Waves, Droplet, Ruler, Clock, Pencil, RefreshCw, Pause, Play, Radio, SlidersHorizontal, Info, CircleCheck, CirclePause, Table2 } from 'lucide-react';

interface PoolData { _id: string; namaWadah: string; serial: string; kedalaman: number; keranTutup: number; keranNormal: number; keranBuka: number; isActive: boolean; createdAt?: string; updatedAt?: string; }
interface Reading { _id: string; serial: string; waterLevel: number; distance: number; createdAt: string; }
const formatDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
const formatTime = (value: number) => new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatValue = (value?: number) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '—';

export default function DetailPoolPage() {
  const router = useRouter();
  const { id } = router.query;
  const gradientId = useId().replace(/:/g, '');
  const [data, setData] = useState<PoolData | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [waterError, setWaterError] = useState('');
  const [waterLoading, setWaterLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [retry, setRetry] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (!router.isReady || typeof id !== 'string') return;
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    setData(null);
    setReadings([]);
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/pool/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        setData(response.data.data);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(axios.isAxiosError(error) && typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Detail wadah belum berhasil dimuat. Silakan coba lagi.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [router.isReady, id, retry]);

  useEffect(() => {
    if (!data?.serial) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loadWater = async () => {
      setWaterLoading(true);
      try {
        const response = await axios.get('/api/water/level', { params: { serial: data.serial, limit: 50 }, signal: controller.signal });
        const items = (response.data.data as Reading[]).filter(item => item.serial === data.serial && Number.isFinite(Date.parse(item.createdAt))).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        setReadings(items);
        setWaterError('');
      } catch {
        if (!controller.signal.aborted) setWaterError('Pembaruan sensor gagal. Data terakhir tetap ditampilkan; coba perbarui lagi.');
      } finally {
        if (!controller.signal.aborted) {
          setWaterLoading(false);
          if (autoRefresh) timer = setTimeout(loadWater, 1000);
        }
      }
    };
    void loadWater();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [data?.serial, autoRefresh, refresh]);

  const latest = readings[0];
  const hasLevel = !!latest && Number.isFinite(latest.waterLevel);
  const percent = hasLevel ? Math.min(100, Math.max(0, latest.waterLevel)) : 0;
  const valve = !latest || !data || !Number.isFinite(latest.distance) ? { label: 'Menunggu data', tone: 'slate' } : latest.distance === data.keranTutup ? { label: 'Keran tertutup', tone: 'slate' } : latest.distance === data.keranNormal ? { label: 'Keran normal', tone: 'blue' } : latest.distance === data.keranBuka ? { label: 'Keran terbuka', tone: 'green' } : { label: 'Belum cocok dengan konfigurasi', tone: 'slate' };
  const chartData = [...readings].reverse().filter(item => Number.isFinite(item.waterLevel)).map(item => ({ timestamp: Date.parse(item.createdAt), level: item.waterLevel }));

  return <div className="dashboard-page detail-page"><Sidebar expanded /><main className="dashboard-main"><WaterWaves className="dashboard-header-waves" />
    <div className="dashboard-topline"><span className="dashboard-breadcrumb"><House size={15} aria-hidden="true" /><Link href="/pool/read">Workspace</Link><span>/</span><strong>Monitoring wadah</strong></span><span className="dashboard-context"><Radio size={14} aria-hidden="true" />Data sensor</span></div>
    <Link href="/pool/read" className="create-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke daftar wadah</Link>
    <header className="dashboard-header create-header"><div><p className="dashboard-eyebrow">KENALI AIR ANDA LEBIH DEKAT</p><h1>{data?.namaWadah || 'Monitoring wadah'}</h1><p>Pantau ketinggian air dan lihat riwayat pembacaan sensor.</p></div>{data && <Link href={`/pool/${data._id}/update`} className="dash-button dash-button-secondary"><Pencil size={16} aria-hidden="true" />Edit wadah</Link>}</header>
    {loading ? <div className="update-load-state" role="status"><span className="login-spinner" aria-hidden="true" /><h2>Memuat monitoring wadah</h2><p>Menyiapkan informasi dan konfigurasi perangkat...</p></div> : loadError || !data ? <div className="update-load-state" role="alert"><Info size={30} aria-hidden="true" /><h2>Belum dapat membuka wadah</h2><p>{loadError || 'Data wadah tidak tersedia.'}</p><button className="dash-button dash-button-primary" onClick={() => setRetry(value => value + 1)}><RefreshCw size={16} aria-hidden="true" />Coba lagi</button></div> : <>
      <div className="detail-device-bar"><div><span className={`dashboard-badge ${data.isActive ? 'active' : ''}`}><span />{data.isActive ? 'Wadah aktif' : 'Wadah nonaktif'}</span><span className="detail-device-serial"><Radio size={15} aria-hidden="true" />{data.serial || 'Serial belum diatur'}</span></div><div><button className="dash-button dash-button-secondary" aria-pressed={autoRefresh} onClick={() => setAutoRefresh(value => !value)}>{autoRefresh ? <Pause size={15} /> : <Play size={15} />}{autoRefresh ? 'Jeda pembaruan' : 'Lanjutkan otomatis'}</button><button className="dash-button dash-button-secondary" disabled={waterLoading || !data.serial} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={15} aria-hidden="true" />Perbarui</button></div></div>
      {waterError && <div className="detail-alert" role="alert"><Info size={18} aria-hidden="true" /><p>{waterError}</p></div>}
      {!data.serial && <div className="detail-alert" role="status"><Info size={18} aria-hidden="true" /><p>Serial perangkat belum diatur. Edit wadah untuk menghubungkan data sensor.</p></div>}
      <div className="detail-overview"><section className="detail-water-card" aria-labelledby="water-heading"><div className="detail-card-heading"><h2 id="water-heading"><Droplet size={19} aria-hidden="true" />Level air</h2><span className="detail-auto-label"><span className={autoRefresh && !waterError ? 'enabled' : ''} />{waterError ? 'Pembaruan gagal' : autoRefresh ? 'Pembaruan otomatis' : 'Pembaruan dijeda'}</span></div><div className="detail-water-body"><div><span className="detail-water-value">{hasLevel ? formatValue(latest.waterLevel) : '—'}<small>%</small></span><p>{hasLevel ? 'Persentase dari sensor perangkat' : waterLoading ? 'Memuat pembacaan sensor...' : 'Belum ada pembacaan sensor'}</p><div className="detail-water-track" role="progressbar" aria-label="Persentase air pada visual wadah" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hasLevel ? percent : undefined} aria-valuetext={hasLevel ? `${formatValue(latest.waterLevel)} persen` : 'Belum ada data'}><span style={{ width: `${percent}%` }} /></div><div className="detail-water-scale"><span>0%</span><span>100%</span></div></div><div className="detail-tank" aria-hidden="true"><div className="detail-tank-fill" style={{ height: `${percent}%` }}><WaterWaves className="detail-tank-waves" /></div><Waves size={34} /></div></div><div className="detail-water-timestamp"><Clock size={14} aria-hidden="true" /><span>Pembacaan terakhir: {formatDate(latest?.createdAt)}</span></div></section>
      <div className="detail-metric-stack"><section className="detail-metric"><span className="dashboard-stat-icon blue"><Ruler size={23} aria-hidden="true" /></span><div><p>Jarak sensor ke air</p><strong>{formatValue(latest?.distance)} <small>cm</small></strong><span>Pembacaan sensor ultrasonik</span></div></section><section className="detail-metric"><span className={`dashboard-stat-icon ${valve.tone}`}><SlidersHorizontal size={23} aria-hidden="true" /></span><div><p>Indikasi posisi keran</p><h3>{valve.label}</h3><span>Berdasarkan kecocokan jarak konfigurasi</span></div></section></div></div>
      <div className="detail-lower-grid"><section className="detail-chart-card" aria-labelledby="chart-heading"><div className="detail-card-heading"><div><h2 id="chart-heading">Riwayat level air</h2><p>Maksimal 50 pembacaan terakhir dari perangkat ini.</p></div><button className="dash-button dash-button-secondary" onClick={() => setShowTable(value => !value)} aria-pressed={showTable}><Table2 size={15} aria-hidden="true" />{showTable ? 'Lihat grafik' : 'Lihat data'}</button></div>
      {showTable ? <div className="detail-table-wrap"><table><caption className="login-sr-only">Riwayat pembacaan sensor perangkat {data.serial}</caption><thead><tr><th scope="col">Waktu</th><th scope="col">Level air</th><th scope="col">Jarak</th></tr></thead><tbody>{readings.map(item => <tr key={item._id}><td>{formatDate(item.createdAt)}</td><td>{formatValue(item.waterLevel)}%</td><td>{formatValue(item.distance)} cm</td></tr>)}{!readings.length && <tr><td colSpan={3}>Belum ada data sensor.</td></tr>}</tbody></table></div> : chartData.length < 2 ? <div className="detail-chart-empty"><span className="dashboard-empty-icon"><Waves size={32} aria-hidden="true" /></span><h3>{chartData.length ? 'Menunggu pembacaan berikutnya' : 'Riwayat air akan tampil di sini'}</h3><p>{chartData.length ? 'Grafik ditampilkan setelah tersedia minimal dua pembacaan.' : 'Pastikan perangkat menggunakan serial yang sesuai dan mengirimkan data sensor.'}</p></div> : <><div className="detail-chart" role="img" aria-label={`Grafik ${chartData.length} pembacaan level air. Pembacaan terbaru ${formatValue(latest?.waterLevel)} persen. Gunakan tombol Lihat data untuk tabel lengkap.`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 16, right: 12, left: -14, bottom: 8 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4199f6" stopOpacity={0.25} /><stop offset="100%" stopColor="#4199f6" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf2f9" strokeDasharray="4 4" /><XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={formatTime} tick={{ fontSize: 10, fill: '#647189' }} minTickGap={35} axisLine={false} tickLine={false} /><YAxis domain={[0, 'auto']} tickFormatter={value => `${value}%`} tick={{ fontSize: 10, fill: '#647189' }} axisLine={false} tickLine={false} /><Tooltip labelFormatter={value => formatTime(Number(value))} formatter={value => [`${formatValue(Number(value))}%`, 'Level air']} contentStyle={{ borderRadius: 12, borderColor: '#e3eaf5', fontSize: 12 }} /><Area type="linear" dataKey="level" stroke="#3184ee" strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={false} dot={false} /></AreaChart></ResponsiveContainer></div><div className="detail-chart-legend"><span />Level air (%)<span className="detail-chart-count">{chartData.length} pembacaan</span></div></>}
      </section><aside className="detail-config"><div className="detail-card-heading"><h2>Informasi wadah</h2><span className="create-section-icon blue"><Info size={18} aria-hidden="true" /></span></div><dl><div><dt>Kedalaman wadah</dt><dd>{formatValue(data.kedalaman)} cm</dd></div><div><dt>Keran tertutup</dt><dd>{formatValue(data.keranTutup)} cm</dd></div><div><dt>Keran normal</dt><dd>{formatValue(data.keranNormal)} cm</dd></div><div><dt>Keran terbuka</dt><dd>{formatValue(data.keranBuka)} cm</dd></div></dl><div className="detail-config-note"><Info size={15} aria-hidden="true" /><p>Jarak keran diukur dari sensor ke permukaan air. Indikasi posisi keran mengikuti nilai konfigurasi, bukan konfirmasi gerakan perangkat.</p></div><p className="detail-config-date">Dibuat: {formatDate(data.createdAt)}<br />Diperbarui: {formatDate(data.updatedAt)}</p><Link href={`/pool/${data._id}/update`} className="dash-button dash-button-monitor">Ubah konfigurasi<ArrowRight size={16} aria-hidden="true" /></Link></aside></div>
    </>}
    <footer className="dashboard-footer"><Waves size={15} aria-hidden="true" />SIMONIKA<span>Monitoring air yang lebih sederhana.</span></footer>
  </main></div>;
}
