'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import WaterWaves from '@/components/WaterWaves';
import { ArrowLeft, ArrowRight, Waves, House, Info, Ruler, SlidersHorizontal, Check, Save, Droplet, Radio, ShieldCheck, CircleCheck, CirclePause, RefreshCw } from 'lucide-react';

const initialForm = { serial: '', namaWadah: '', kedalaman: '', keranTutup: '', keranNormal: '', keranBuka: '' };
type FieldName = keyof typeof initialForm;
const valveFields = [
  { name: 'keranTutup' as const, label: 'Keran tertutup', hint: 'Jarak untuk posisi tertutup', tone: 'slate' },
  { name: 'keranNormal' as const, label: 'Keran normal', hint: 'Jarak untuk posisi normal', tone: 'blue' },
  { name: 'keranBuka' as const, label: 'Keran terbuka', hint: 'Jarak untuk posisi terbuka', tone: 'green' },
];

export default function UpdatePoolPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const { id } = router.query;
  const [isActive, setIsActive] = useState(false);
  const [original, setOriginal] = useState<{ form: typeof initialForm; isActive: boolean } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady || typeof id !== 'string') return;
    const controller = new AbortController();
    setFetching(true);
    setLoadError('');
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/pool/${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const data = response.data.data;
        const loadedForm = { serial: data.serial || '', namaWadah: data.namaWadah || '', kedalaman: String(data.kedalaman ?? ''), keranTutup: String(data.keranTutup ?? ''), keranNormal: String(data.keranNormal ?? ''), keranBuka: String(data.keranBuka ?? '') };
        setForm(loadedForm);
        setIsActive(Boolean(data.isActive));
        setOriginal({ form: loadedForm, isActive: Boolean(data.isActive) });
        setTouched({});
        setError('');
      } catch (err) {
        if (controller.signal.aborted) return;
        setLoadError(axios.isAxiosError(err) && typeof err.response?.data?.message === 'string' ? err.response.data.message : 'Data wadah belum berhasil dimuat. Periksa koneksi Anda dan coba lagi.');
      } finally { if (!controller.signal.aborted) setFetching(false); }
    };
    void load();
    return () => controller.abort();
  }, [router.isReady, id, retry]);
  const hasChanges = !!original && (isActive !== original.isActive || (Object.keys(form) as FieldName[]).some(name => form[name] !== original.form[name]));
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const fieldError = (name: FieldName) => {
    if (!form[name].trim()) return 'Bagian ini wajib diisi.';
    if (name !== 'serial' && name !== 'namaWadah' && (!Number.isFinite(Number(form[name])) || (name === 'kedalaman' ? Number(form[name]) <= 0 : Number(form[name]) < 0))) return name === 'kedalaman' ? 'Masukkan angka lebih dari 0.' : 'Masukkan angka 0 atau lebih.';
    return '';
  };
  const completed = (Object.keys(form) as FieldName[]).filter(name => !fieldError(name)).length;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(previous => ({ ...previous, [e.target.name]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || fetching || loadError || typeof id !== 'string' || !hasChanges) return;
    setTouched(Object.fromEntries(Object.keys(form).map(name => [name, true])));
    if ((Object.keys(form) as FieldName[]).some(name => fieldError(name))) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/pool/${id}`, { serial: form.serial.trim(), namaWadah: form.namaWadah.trim(), kedalaman: Number(form.kedalaman), keranTutup: Number(form.keranTutup), keranNormal: Number(form.keranNormal), keranBuka: Number(form.keranBuka), isActive }, { headers: { Authorization: `Bearer ${token}` } });
      await router.push('/pool/read');
    } catch (err) {
      setError(axios.isAxiosError(err) && typeof err.response?.data?.message === 'string' ? err.response.data.message : 'Perubahan belum berhasil disimpan. Periksa koneksi Anda dan coba lagi.');
    } finally { setLoading(false); }
  };
  const inputProps = (name: FieldName) => ({ id: name, name, value: form[name], onChange: handleChange, onBlur: () => setTouched(previous => ({ ...previous, [name]: true })), required: true, 'aria-invalid': !!(touched[name] && fieldError(name)), 'aria-describedby': `${name}-hint${touched[name] && fieldError(name) ? ` ${name}-error` : ''}` });
  const renderError = (name: FieldName) => touched[name] && fieldError(name) ? <p className="create-field-error" id={`${name}-error`}>{fieldError(name)}</p> : null;

  return <div className="dashboard-page create-page">
    <Sidebar expanded />
    <main className="dashboard-main">
      <WaterWaves className="dashboard-header-waves" />
      <div className="dashboard-topline"><span className="dashboard-breadcrumb"><House size={15} aria-hidden="true" /><Link href="/pool/read">Workspace</Link><span>/</span><strong>Edit wadah</strong></span><span className="dashboard-context"><span className="dashboard-context-dot" />Monitoring air</span></div>
      <Link href="/pool/read" className="create-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke daftar wadah</Link>
      <header className="dashboard-header create-header"><div><p className="dashboard-eyebrow">SESUAIKAN DENGAN KEBUTUHAN ANDA</p><h1>Edit wadah</h1><p>Perbarui informasi, pengaturan sensor, dan status wadah Anda.</p></div><span className="create-header-tag"><span className={`update-change-dot ${hasChanges ? "changed" : ""}`} />{fetching ? "Memuat konfigurasi" : loadError ? "Konfigurasi belum dimuat" : hasChanges ? "Perubahan belum disimpan" : "Konfigurasi tersimpan"}</span></header>
      {fetching ? <div className="update-load-state" role="status"><span className="login-spinner" aria-hidden="true" /><h2>Memuat konfigurasi wadah</h2><p>Menyiapkan informasi dan pengaturan Anda...</p></div> : loadError ? <div className="update-load-state" role="alert"><Info size={30} aria-hidden="true" /><h2>Belum dapat membuka wadah</h2><p>{loadError}</p><button className="dash-button dash-button-primary" onClick={() => setRetry(previous => previous + 1)}><RefreshCw size={17} aria-hidden="true" />Coba lagi</button><Link className="create-back" href="/pool/read">Kembali ke daftar wadah</Link></div> : <div className="create-layout">
        <form className="create-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <div className="create-form-intro"><div><h2>Detail wadah</h2><p>Sesuaikan detail wadah. Semua kolom wajib diisi.</p></div><span><span className="create-required-dot" />Wajib diisi</span></div>
          <fieldset disabled={loading} className="create-fields">
            <section className="create-section" aria-labelledby="identity-heading"><div className="create-section-heading"><span className="create-section-icon blue"><Info size={20} aria-hidden="true" /></span><div><h3 id="identity-heading">Informasi dasar</h3><p>Beri identitas wadah dan perangkat Anda.</p></div><span className="create-section-number">01</span></div>
              <div className="create-input-grid"><div className="create-field"><label htmlFor="namaWadah">Nama wadah <span>*</span></label><input {...inputProps('namaWadah')} placeholder="Contoh: Kolam utama" autoComplete="off" /><p id="namaWadah-hint">Gunakan nama yang mudah Anda kenali.</p>{renderError('namaWadah')}</div><div className="create-field"><label htmlFor="serial">Serial perangkat <span>*</span></label><input {...inputProps('serial')} placeholder="Masukkan serial perangkat" autoComplete="off" spellCheck={false} /><p id="serial-hint">Sesuaikan dengan serial pada perangkat Anda.</p>{renderError('serial')}</div></div>
            </section>
            <section className="create-section" aria-labelledby="depth-heading"><div className="create-section-heading"><span className="create-section-icon violet"><Ruler size={20} aria-hidden="true" /></span><div><h3 id="depth-heading">Dimensi wadah</h3><p>Tentukan kedalaman wadah dalam sentimeter.</p></div><span className="create-section-number">02</span></div><div className="create-depth-layout"><div className="create-field"><label htmlFor="kedalaman">Kedalaman wadah <span>*</span></label><div className="create-unit-input"><input {...inputProps('kedalaman')} type="number" min="0.01" step="any" placeholder="Contoh: 150" /><span>cm</span></div><p id="kedalaman-hint">Ukur dari dasar hingga bagian atas wadah.</p>{renderError('kedalaman')}</div><div className="create-measure-note"><Ruler size={20} aria-hidden="true" /><p>Gunakan ukuran wadah sebenarnya agar konfigurasi sesuai dengan instalasi Anda.</p></div></div></section>
            <section className="create-section" aria-labelledby="valves-heading"><div className="create-section-heading"><span className="create-section-icon green"><SlidersHorizontal size={20} aria-hidden="true" /></span><div><h3 id="valves-heading">Konfigurasi keran</h3><p>Atur jarak sensor untuk setiap posisi keran.</p></div><span className="create-section-number">03</span></div><div className="create-valve-grid">{valveFields.map(field => <div className={`create-valve create-valve-${field.tone}`} key={field.name}><label htmlFor={field.name}><span />{field.label}</label><div className="create-unit-input"><input {...inputProps(field.name)} type="number" min="0" step="any" placeholder="0" /><span>cm</span></div><p id={`${field.name}-hint`}>{field.hint}</p>{renderError(field.name)}</div>)}</div><div className="create-info"><Info size={18} aria-hidden="true" /><p><strong>Jarak sensor, bukan tinggi air.</strong> Nilai diukur dari sensor ultrasonik ke permukaan air. Sesuaikan setiap posisi dengan konfigurasi perangkat Anda.</p></div></section>
            <section className="create-section" aria-labelledby="status-heading"><div className="create-section-heading"><span className="create-section-icon green"><CircleCheck size={20} aria-hidden="true" /></span><div><h3 id="status-heading">Status wadah</h3><p>Sesuaikan status aktif wadah Anda.</p></div><span className="create-section-number">04</span></div><div className={`update-status-card ${isActive ? 'active' : ''}`}><span className="create-section-icon green">{isActive ? <CircleCheck size={22} /> : <CirclePause size={22} />}</span><div><label htmlFor="isActive">{isActive ? 'Wadah aktif' : 'Wadah nonaktif'}</label><p id="isActive-hint">{isActive ? 'Wadah ditandai aktif dalam daftar Anda.' : 'Wadah ditandai nonaktif dalam daftar Anda.'}</p></div><label className="update-switch"><input id="isActive" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} aria-describedby="isActive-hint" /><span aria-hidden="true" /></label></div></section>
          </fieldset>
          {error && <div className="create-submit-error" role="alert"><Info size={20} aria-hidden="true" /><p>{error}</p></div>}
          <div className="create-actions"><span><ShieldCheck size={16} aria-hidden="true" />{hasChanges ? "Ada perubahan yang belum disimpan." : "Belum ada perubahan."}</span><div><button type="button" className="dash-button dash-button-secondary" disabled={loading} onClick={() => router.push('/pool/read')}>Batal</button><button type="submit" className="dash-button dash-button-primary" disabled={loading || !hasChanges}>{loading ? <><span className="login-spinner" aria-hidden="true" />Menyimpan...</> : <><Save size={17} aria-hidden="true" />Simpan perubahan</>}</button></div></div>
          <span className="login-sr-only" role="status">{loading ? 'Sedang menyimpan wadah' : ''}</span>
        </form>
        <aside className="create-preview" aria-label="Pratinjau konfigurasi"><div className="create-preview-card"><span className="dashboard-eyebrow">PRATINJAU PERUBAHAN</span><div className="create-tank-art" aria-hidden="true"><span className="create-sensor"><Radio size={20} /></span><span className="create-sensor-line" /><div className="create-tank"><WaterWaves className="create-tank-water" /><Waves size={32} /></div><span className="create-tank-drop"><Droplet size={21} /></span></div><h2>{form.namaWadah.trim() || 'Wadah baru Anda'}</h2><p className="create-preview-serial">{form.serial.trim() || 'Serial perangkat belum diisi'}</p><span className={`update-preview-status ${isActive ? "active" : ""}`}>{isActive ? <CircleCheck size={13} /> : <CirclePause size={13} />}{isActive ? "Aktif" : "Nonaktif"}</span><dl className="create-preview-values"><div><dt>Kedalaman</dt><dd>{form.kedalaman ? `${form.kedalaman} cm` : '—'}</dd></div>{valveFields.map(field => <div key={field.name}><dt>{field.label}</dt><dd>{form[field.name] ? `${form[field.name]} cm` : '—'}</dd></div>)}</dl><div className="create-completion"><div><span>Informasi terisi</span><strong>{completed}/6</strong></div><progress value={completed} max={6} aria-label="Kelengkapan informasi wadah" /><p>{completed === 6 ? <><Check size={14} />Semua informasi siap diperiksa.</> : 'Pratinjau diperbarui saat Anda mengisi form.'}</p></div></div><div className="create-guide"><span className="create-section-icon blue"><Droplet size={20} aria-hidden="true" /></span><h3>Periksa sebelum menyimpan</h3><p>Pastikan serial perangkat, kedalaman, dan jarak sensor sesuai dengan instalasi Anda. Perubahan diterapkan setelah Anda menyimpan.</p><Link href="/pool/read">Lihat daftar wadah<ArrowRight size={15} aria-hidden="true" /></Link></div></aside>
      </div>}
      <footer className="dashboard-footer"><Waves size={15} aria-hidden="true" />SIMONIKA<span>Monitoring air yang lebih sederhana.</span></footer>
    </main>
  </div>;
}
