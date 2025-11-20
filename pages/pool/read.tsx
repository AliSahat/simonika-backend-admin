'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import Loading from '@/components/Loading';
import Empty from '@/components/Empty';
import { Icon } from '@iconify/react';

const ReadPoolPage = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPools = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/pool', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPools(res.data.data);
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Yakin ingin menghapus kolam ini?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`/api/pool/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Kolam berhasil dihapus!');
      fetchPools();
    } catch (error) {
      console.error('Error deleting pool:', error);
      alert('Gagal menghapus kolam!');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
      <Sidebar />
      <div className="pl-[150px] pt-8 px-8 pb-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Icon icon="mdi:water-outline" className="text-blue-600" width="36" />
                <h1 className="text-4xl font-bold text-gray-800">Manajemen Wadah</h1>
              </div>
              <p className="text-gray-600 ml-12">Kelola dan monitor semua wadah air Anda</p>
            </div>

            <Link
              href="/pool/create"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              <Icon icon="mdi:plus-circle" width="24" />
              <span>Tambah Wadah Baru</span>
            </Link>
          </div>

          {/* Stats Bar */}
          {!loading && pools.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Icon icon="mdi:water" className="text-blue-600" width="28" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Wadah</p>
                    <p className="text-2xl font-bold text-gray-800">{pools.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Icon icon="mdi:check-circle" className="text-green-600" width="28" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Wadah Aktif</p>
                    <p className="text-2xl font-bold text-gray-800">{pools.filter((p: any) => p.isActive).length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Icon icon="mdi:close-circle" className="text-red-600" width="28" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Wadah Tidak Aktif</p>
                    <p className="text-2xl font-bold text-gray-800">{pools.filter((p: any) => !p.isActive).length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <Loading />
        ) : pools.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <Empty messages="Tidak ada data wadah" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pools.map((pool: any) => (
              <div key={pool._id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10">
                    <Icon icon="mdi:water-outline" width="120" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-2xl font-bold">{pool.namaWadah}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pool.isActive ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>{pool.isActive ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Icon icon="mdi:barcode-scan" width="16" />
                      <span>Serial: {pool.serial}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Icon icon="mdi:arrow-expand-vertical" className="text-blue-600" width="24" />
                      <div>
                        <p className="text-xs text-gray-600">Kedalaman Wadah</p>
                        <p className="font-bold text-gray-800">{pool.kedalaman} cm</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Tutup</p>
                        <p className="font-semibold text-gray-700 text-sm">{pool.keranTutup}</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Normal</p>
                        <p className="font-semibold text-yellow-700 text-sm">{pool.keranNormal}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Buka</p>
                        <p className="font-semibold text-green-700 text-sm">{pool.keranBuka}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link
                      href={`/pool/${pool._id}/detail`}
                      className="group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Icon icon="mdi:monitor-dashboard" width="20" />
                      <span>Monitoring Wadah</span>
                      <Icon icon="mdi:arrow-right" width="20" className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/pool/${pool._id}/update`} className="flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl font-semibold transition-all duration-300">
                        <Icon icon="mdi:pencil" width="18" />
                        <span>Ubah</span>
                      </Link>

                      <button onClick={() => handleDelete(pool._id)} className="flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-semibold transition-all duration-300">
                        <Icon icon="mdi:delete" width="18" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Icon icon="mdi:clock-outline" width="14" />
                    <span>Update: {new Date(pool.updatedAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadPoolPage;
