'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import WaterWaves from '@/components/WaterWaves';
import { ArrowLeft, ArrowRight, Waves, House, Info, Ruler, SlidersHorizontal, Check, Save, Droplet, Radio, ShieldCheck, CircleCheck, CirclePause } from 'lucide-react';

const initialForm = {
  serial: '',
  namaWadah: '',
  kedalaman: '',
  jarakSensorDasar: '',
  batasIsiMulai: '',
  batasBuangBerhenti: '',
  batasIsiBerhenti: '',
  batasBuangMulai: '',
};
type FieldName = keyof typeof initialForm;

const thresholdFields = [
  { name: 'batasIsiMulai' as const, label: 'Mulai isi', hint: 'Batas bawah mulai mengisi (> 0)', tone: 'blue' },
  { name: 'batasBuangBerhenti' as const, label: 'Berhenti buang', hint: 'Harus > mulai isi', tone: 'slate' },
  { name: 'batasIsiBerhenti' as const, label: 'Berhenti isi', hint: 'Harus > berhenti buang', tone: 'green' },
  { name: 'batasBuangMulai' as const, label: 'Mulai buang', hint: 'Harus > berhenti isi & < kedalaman', tone: 'slate' },
];

export default function CreatePoolPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [modeAuto, setModeAuto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      void router.replace('/');
    }
  }, [router]);

  const fieldError = (name: FieldName) => {
    if (!form[name].trim()) return 'Bagian ini wajib diisi.';
    if (name !== 'serial' && name !== 'namaWadah') {
      const num = Number(form[name]);
      if (!Number.isFinite(num)) return 'Masukkan angka yang valid.';
      if (num <= 0) return 'Masukkan angka lebih dari 0.';
    }
    return '';
  };

  const totalFields = Object.keys(form).length;
  const completed = (Object.keys(form) as FieldName[]).filter(name => !fieldError(name)).length;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(previous => ({ ...previous, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setTouched(Object.fromEntries(Object.keys(form).map(name => [name, true])));
    if ((Object.keys(form) as FieldName[]).some(name => fieldError(name))) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        await router.replace('/');
        return;
      }
      const res = await axios.post('/api/pool', {
        serial: form.serial.trim(),
        namaWadah: form.namaWadah.trim(),
        kedalaman: Number(form.kedalaman),
        jarakSensorDasar: Number(form.jarakSensorDasar),
        batasIsiMulai: Number(form.batasIsiMulai),
        batasBuangBerhenti: Number(form.batasBuangBerhenti),
        batasIsiBerhenti: Number(form.batasIsiBerhenti),
        batasBuangMulai: Number(form.batasBuangMulai),
        modeAuto,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const createdId = res.data?.data?._id;
      if (createdId) {
        await axios.post('/api/mqtt/publish', { poolId: createdId }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
      }
      await router.push('/pool/read');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        await router.replace('/');
        return;
      }
      setError(axios.isAxiosError(err) && typeof err.response?.data?.message === 'string' ? err.response.data.message : 'Wadah belum berhasil disimpan. Periksa koneksi Anda dan coba lagi.');
    } finally { setLoading(false); }
  };

  const inputProps = (name: FieldName) => ({ id: name, name, value: form[name], onChange: handleChange, onBlur: () => setTouched(previous => ({ ...previous, [name]: true })), required: true, 'aria-invalid': !!(touched[name] && fieldError(name)), 'aria-describedby': `${name}-hint${touched[name] && fieldError(name) ? ` ${name}-error` : ''}` });
  const renderError = (name: FieldName) => touched[name] && fieldError(name) ? <p className="create-field-error" id={`${name}-error`}>{fieldError(name)}</p> : null;

  return <div className="dashboard-page create-page">
    <Sidebar expanded />
    <main className="dashboard-main">
      <WaterWaves className="dashboard-header-waves" />
      <div className="dashboard-topline"><span className="dashboard-breadcrumb"><House size={15} aria-hidden="true" /><Link href="/pool/read">Workspace</Link><span>/</span><strong>Tambah wadah</strong></span><span className="dashboard-context"><span className="dashboard-context-dot" />Monitoring air</span></div>
      <Link href="/pool/read" className="create-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke daftar wadah</Link>
      <header className="dashboard-header create-header"><div><p className="dashboard-eyebrow">RUANG BARU UNTUK AIR ANDA</p><h1>Tambah wadah baru</h1><p>Hubungkan perangkat dan siapkan wadah untuk mulai dipantau.</p></div><span className="create-header-tag"><Waves size={18} aria-hidden="true" />Konfigurasi wadah</span></header>
      <div className="create-layout">
        <form className="create-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <div className="create-form-intro"><div><h2>Detail wadah</h2><p>Lengkapi informasi berikut. Semua kolom wajib diisi.</p></div><span><span className="create-required-dot" />Wajib diisi</span></div>
          <fieldset disabled={loading} className="create-fields">
            <section className="create-section" aria-labelledby="identity-heading"><div className="create-section-heading"><span className="create-section-icon blue"><Info size={20} aria-hidden="true" /></span><div><h3 id="identity-heading">Informasi dasar</h3><p>Beri identitas wadah dan perangkat Anda.</p></div><span className="create-section-number">01</span></div>
              <div className="create-input-grid"><div className="create-field"><label htmlFor="namaWadah">Nama wadah <span>*</span></label><input {...inputProps('namaWadah')} placeholder="Contoh: Kolam utama" autoComplete="off" /><p id="namaWadah-hint">Gunakan nama yang mudah Anda kenali.</p>{renderError('namaWadah')}</div><div className="create-field"><label htmlFor="serial">Serial perangkat <span>*</span></label><input {...inputProps('serial')} placeholder="Contoh: 00e5b570" autoComplete="off" spellCheck={false} /><p id="serial-hint">Sesuaikan dengan serial pada perangkat Anda.</p>{renderError('serial')}</div></div>
            </section>
            <section className="create-section" aria-labelledby="depth-heading"><div className="create-section-heading"><span className="create-section-icon violet"><Ruler size={20} aria-hidden="true" /></span><div><h3 id="depth-heading">Dimensi wadah & sensor</h3><p>Tentukan kedalaman wadah dan posisi sensor dalam sentimeter.</p></div><span className="create-section-number">02</span></div>
              <div className="create-input-grid">
                <div className="create-field"><label htmlFor="kedalaman">Kedalaman wadah <span>*</span></label><div className="create-unit-input"><input {...inputProps('kedalaman')} type="number" min="0.01" step="any" placeholder="Contoh: 100" /><span>cm</span></div><p id="kedalaman-hint">Tinggi wadah dari dasar hingga bibir atas.</p>{renderError('kedalaman')}</div>
                <div className="create-field"><label htmlFor="jarakSensorDasar">Jarak sensor ke dasar <span>*</span></label><div className="create-unit-input"><input {...inputProps('jarakSensorDasar')} type="number" min="0.01" step="any" placeholder="Contoh: 105" /><span>cm</span></div><p id="jarakSensorDasar-hint">Minimal kedalaman + 2 cm agar berada di atas permukaan air penuh.</p>{renderError('jarakSensorDasar')}</div>
              </div>
            </section>
            <section className="create-section" aria-labelledby="valves-heading"><div className="create-section-heading"><span className="create-section-icon green"><SlidersHorizontal size={20} aria-hidden="true" /></span><div><h3 id="valves-heading">Ambang level air (cm)</h3><p>Urutan wajib: Mulai isi &lt; Berhenti buang &lt; Berhenti isi &lt; Mulai buang ≤ Kedalaman.</p></div><span className="create-section-number">03</span></div><div className="create-input-grid">{thresholdFields.map(field => <div className={`create-valve create-valve-${field.tone}`} key={field.name}><label htmlFor={field.name}><span />{field.label}</label><div className="create-unit-input"><input {...inputProps(field.name)} type="number" min="0" step="any" placeholder="0" /><span>cm</span></div><p id={`${field.name}-hint`}>{field.hint}</p>{renderError(field.name)}</div>)}</div><div className="create-info"><Info size={18} aria-hidden="true" /><p><strong>Tinggi air dari dasar wadah.</strong> Nilai ambang diukur dalam sentimeter ketinggian air dari dasar wadah.</p></div></section>
            <section className="create-section" aria-labelledby="mode-heading"><div className="create-section-heading"><span className="create-section-icon green"><CircleCheck size={20} aria-hidden="true" /></span><div><h3 id="mode-heading">Mode kendali otomatis</h3><p>Aktifkan agar perangkat membuka/menutup keran sesuai ambang level air.</p></div><span className="create-section-number">04</span></div><div className={`update-status-card ${modeAuto ? 'active' : ''}`}><span className="create-section-icon green">{modeAuto ? <CircleCheck size={22} /> : <CirclePause size={22} />}</span><div><label htmlFor="modeAuto">{modeAuto ? 'Mode otomatis aktif' : 'Mode manual'}</label><p id="modeAuto-hint">{modeAuto ? 'Keran dikendalikan otomatis oleh perangkat berdasarkan ambang.' : 'Otomatisasi keran dinonaktifkan.'}</p></div><label className="update-switch"><input id="modeAuto" type="checkbox" checked={modeAuto} onChange={e => setModeAuto(e.target.checked)} aria-describedby="modeAuto-hint" /><span aria-hidden="true" /></label></div></section>
          </fieldset>
          {error && <div className="create-submit-error" role="alert"><Info size={20} aria-hidden="true" /><p>{error}</p></div>}
          <div className="create-actions"><span><ShieldCheck size={16} aria-hidden="true" />Periksa detail sebelum menyimpan.</span><div><button type="button" className="dash-button dash-button-secondary" disabled={loading} onClick={() => router.push('/pool/read')}>Batal</button><button type="submit" className="dash-button dash-button-primary" disabled={loading}>{loading ? <><span className="login-spinner" aria-hidden="true" />Menyimpan...</> : <><Save size={17} aria-hidden="true" />Simpan wadah</>}</button></div></div>
          <span className="login-sr-only" role="status">{loading ? 'Sedang menyimpan wadah' : ''}</span>
        </form>
        <aside className="create-preview" aria-label="Pratinjau konfigurasi"><div className="create-preview-card"><span className="dashboard-eyebrow">PRATINJAU WADAH</span><div className="create-tank-art" aria-hidden="true"><span className="create-sensor"><Radio size={20} /></span><span className="create-sensor-line" /><div className="create-tank"><WaterWaves className="create-tank-water" /><Waves size={32} /></div><span className="create-tank-drop"><Droplet size={21} /></span></div><h2>{form.namaWadah.trim() || 'Wadah baru Anda'}</h2><p className="create-preview-serial">{form.serial.trim() || 'Serial perangkat belum diisi'}</p><dl className="create-preview-values"><div><dt>Kedalaman</dt><dd>{form.kedalaman ? `${form.kedalaman} cm` : '—'}</dd></div><div><dt>Sensor ke dasar</dt><dd>{form.jarakSensorDasar ? `${form.jarakSensorDasar} cm` : '—'}</dd></div>{thresholdFields.map(field => <div key={field.name}><dt>{field.label}</dt><dd>{form[field.name] ? `${form[field.name]} cm` : '—'}</dd></div>)}</dl><div className="create-completion"><div><span>Informasi terisi</span><strong>{completed}/{totalFields}</strong></div><progress value={completed} max={totalFields} aria-label="Kelengkapan informasi wadah" /><p>{completed === totalFields ? <><Check size={14} />Semua informasi siap diperiksa.</> : 'Pratinjau diperbarui saat Anda mengisi form.'}</p></div></div><div className="create-guide"><span className="create-section-icon blue"><Droplet size={20} aria-hidden="true" /></span><h3>Satu langkah menuju monitoring</h3><p>Setelah disimpan, wadah akan muncul di daftar dan konfigurasi dikirim ke broker MQTT.</p><Link href="/pool/read">Lihat daftar wadah<ArrowRight size={15} aria-hidden="true" /></Link></div></aside>
      </div>
      <footer className="dashboard-footer"><Waves size={15} aria-hidden="true" />SIMONIKA<span>Monitoring air yang lebih sederhana.</span></footer>
    </main>
  </div>;
}
