'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { Icon } from '@iconify/react';

const CreatePoolPage = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    serial: '',
    namaWadah: '',
    kedalaman: '',
    keranTutup: '',
    keranNormal: '',
    keranBuka: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        '/api/pool',
        {
          serial: form.serial,
          namaWadah: form.namaWadah,
          kedalaman: Number(form.kedalaman),
          keranTutup: Number(form.keranTutup),
          keranNormal: Number(form.keranNormal),
          keranBuka: Number(form.keranBuka),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push('/pool/read');
    } catch (error) {
      console.error('Error creating pool:', error);
      alert('Gagal membuat pool!');
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
      <Sidebar />
      <div className="pl-[150px] pt-8 px-8 pb-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <Icon icon="mdi:arrow-left" width="20" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Icon icon="mdi:plus-circle" className="text-blue-600" width="36" />
            <h1 className="text-4xl font-bold text-gray-800">Tambah Wadah Baru</h1>
          </div>
          <p className="text-gray-600 ml-12">Lengkapi formulir untuk menambahkan wadah baru</p>
        </div>

        {/* Form Container */}
        <div className="max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Informasi Dasar */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Icon icon="mdi:information" className="text-blue-600" width="24" />
                  Informasi Dasar
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Serial Number */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-gray-700">
                      <Icon icon="mdi:barcode-scan" className="text-blue-600" width="20" />
                      Serial Number
                    </label>
                    <div className="relative">
                      <input
                        name="serial"
                        placeholder="Masukkan serial number"
                        value={form.serial}
                        onChange={handleChange}
                        required
                        className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 pl-10 rounded-xl transition-all outline-none"
                      />
                      <Icon icon="mdi:barcode" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" />
                    </div>
                  </div>

                  {/* Nama Wadah */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-gray-700">
                      <Icon icon="mdi:water" className="text-cyan-600" width="20" />
                      Nama Wadah
                    </label>
                    <div className="relative">
                      <input
                        name="namaWadah"
                        placeholder="Masukkan nama wadah"
                        value={form.namaWadah}
                        onChange={handleChange}
                        required
                        className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 pl-10 rounded-xl transition-all outline-none"
                      />
                      <Icon icon="mdi:rename-box" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Dimensi Wadah */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Icon icon="mdi:ruler" className="text-purple-600" width="24" />
                  Dimensi Wadah
                </h2>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-semibold text-gray-700">
                    <Icon icon="mdi:arrow-expand-vertical" className="text-purple-600" width="20" />
                    Kedalaman Wadah
                  </label>
                  <div className="relative">
                    <input
                      name="kedalaman"
                      placeholder="Masukkan kedalaman"
                      type="number"
                      value={form.kedalaman}
                      onChange={handleChange}
                      required
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 p-3 pl-10 pr-12 rounded-xl transition-all outline-none"
                    />
                    <Icon icon="mdi:arrow-down" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">cm</span>
                  </div>
                </div>
              </div>

              {/* Section: Konfigurasi Keran */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Icon icon="mdi:valve" className="text-green-600" width="24" />
                  Konfigurasi Keran
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Keran Tutup */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-gray-700">
                      <Icon icon="mdi:valve-closed" className="text-gray-600" width="20" />
                      Jarak Keran Tertutup
                    </label>
                    <div className="relative bg-gray-50 rounded-xl p-4 border-2 border-gray-200 focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-200 transition-all">
                      <input name="keranTutup" placeholder="0" type="number" value={form.keranTutup} onChange={handleChange} required className="w-full bg-transparent outline-none text-center text-2xl font-bold text-gray-700" />
                      <p className="text-center text-xs text-gray-500 mt-1">centimeter</p>
                    </div>
                  </div>

                  {/* Keran Normal */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-gray-700">
                      <Icon icon="mdi:valve" className="text-yellow-600" width="20" />
                      Jarak Keran Normal
                    </label>
                    <div className="relative bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-200 transition-all">
                      <input name="keranNormal" placeholder="0" type="number" value={form.keranNormal} onChange={handleChange} required className="w-full bg-transparent outline-none text-center text-2xl font-bold text-yellow-700" />
                      <p className="text-center text-xs text-yellow-600 mt-1">centimeter</p>
                    </div>
                  </div>

                  {/* Keran Buka */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-semibold text-gray-700">
                      <Icon icon="mdi:valve-open" className="text-green-600" width="20" />
                      Jarak Keran Terbuka
                    </label>
                    <div className="relative bg-green-50 rounded-xl p-4 border-2 border-green-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all">
                      <input name="keranBuka" placeholder="0" type="number" value={form.keranBuka} onChange={handleChange} required className="w-full bg-transparent outline-none text-center text-2xl font-bold text-green-700" />
                      <p className="text-center text-xs text-green-600 mt-1">centimeter</p>
                    </div>
                  </div>
                </div>

                {/* Info Helper */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Icon icon="mdi:information" className="text-blue-600 flex-shrink-0 mt-0.5" width="20" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Petunjuk Konfigurasi:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Jarak diukur dari sensor ultrasonik ke permukaan air</li>
                        <li>Keran Tertutup: jarak maksimal (wadah kosong)</li>
                        <li>Keran Normal: jarak menengah (wadah setengah penuh)</li>
                        <li>Keran Terbuka: jarak minimal (wadah penuh)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  disabled={loading}
                >
                  <Icon icon="mdi:close" width="20" />
                  <span>Batal</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Icon icon="mdi:loading" className="animate-spin" width="20" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:check-circle" width="20" />
                      <span>Simpan Wadah</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Card */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Icon icon="mdi:eye" className="text-blue-600" width="24" />
              Preview Data
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Serial</p>
                <p className="font-semibold text-gray-800">{form.serial || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Nama Wadah</p>
                <p className="font-semibold text-gray-800">{form.namaWadah || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Kedalaman</p>
                <p className="font-semibold text-gray-800">{form.kedalaman ? `${form.kedalaman} cm` : '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Keran Tutup</p>
                <p className="font-semibold text-gray-700">{form.keranTutup ? `${form.keranTutup} cm` : '-'}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Keran Normal</p>
                <p className="font-semibold text-yellow-700">{form.keranNormal ? `${form.keranNormal} cm` : '-'}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Keran Buka</p>
                <p className="font-semibold text-green-700">{form.keranBuka ? `${form.keranBuka} cm` : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePoolPage;
