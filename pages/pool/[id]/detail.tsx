'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { Icon } from '@iconify/react';

const DetailPoolPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState<any>(null);
  const [latestWater, setLatestWater] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch Detail Kolam (sekali saja)
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');

        const resPool = await axios.get(`/api/pool/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setData(resPool.data.data);
      } catch (error) {
        console.error('Error fetching detail:', error);
        alert('Gagal mengambil data detail!');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // 🔁 Auto Refresh Water Level setiap 1 detik
  useEffect(() => {
    if (!data) return;

    const fetchLatestWater = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get(`/api/water/level`);

        const allLevels = res.data.data;

        const filtered = allLevels.filter((item: any) => item.serial === data.serial).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (filtered.length > 0) {
          setLatestWater(filtered[0]);
        }
      } catch (error) {
        console.error('Error fetching latest water:', error);
      }
    };

    fetchLatestWater();
    const interval = setInterval(fetchLatestWater, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const getStatusColor = () => {
    if (!latestWater || !data) return 'bg-gray-400';

    if (latestWater.distance == data.keranTutup) return 'bg-gray-400';
    if (latestWater.distance == data.keranNormal) return 'bg-yellow-500';
    if (latestWater.distance == data.keranBuka) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!latestWater || !data) return 'Unknown';

    if (latestWater.distance == data.keranTutup) return 'Keran Tutup';
    if (latestWater.distance == data.keranNormal) return 'Keran Normal';
    if (latestWater.distance == data.keranBuka) return 'Keran Buka';
    return 'Status Tidak Diketahui';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 min-h-screen">
      <Sidebar />
      <div className="pl-[150px] pt-8 px-8 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Icon icon="mdi:water-outline" className="text-blue-600" width="32" />
            <h1 className="text-3xl font-bold text-gray-800">Monitoring Wadah</h1>
          </div>
          <p className="text-gray-600">Real-time monitoring sistem ketinggian air</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Icon icon="mdi:loading" className="animate-spin text-blue-600 mx-auto mb-3" width="48" />
              <p className="text-gray-600">Memuat data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Detail Kolam Card */}
            {data && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Icon icon="mdi:information-outline" className="text-blue-600" width="24" />
                    Informasi Wadah
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${data.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{data.isActive ? 'Aktif' : 'Tidak Aktif'}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Icon icon="mdi:barcode" className="text-blue-600" width="24" />
                    <div>
                      <p className="text-xs text-gray-600">Serial Number</p>
                      <p className="font-semibold text-gray-800">{data.serial}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                    <Icon icon="mdi:water" className="text-cyan-600" width="24" />
                    <div>
                      <p className="text-xs text-gray-600">Nama Wadah</p>
                      <p className="font-semibold text-gray-800">{data.namaWadah}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Kedalaman</p>
                      <p className="font-bold text-purple-700">{data.kedalaman} cm</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Keran Tutup</p>
                      <p className="font-bold text-indigo-700">{data.keranTutup} cm</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Keran Normal</p>
                      <p className="font-bold text-yellow-700">{data.keranNormal} cm</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Keran Buka</p>
                      <p className="font-bold text-green-700">{data.keranBuka} cm</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Icon icon="mdi:calendar-plus" width="16" />
                      <span>Dibuat: {new Date(data.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Icon icon="mdi:calendar-edit" width="16" />
                      <span>Diupdate: {new Date(data.updatedAt).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Water Level Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Icon icon="mdi:waves" className="text-cyan-600" width="24" />
                  Water Level Realtime
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto Refresh
                </div>
              </div>

              {!latestWater ? (
                <div className="text-center py-12">
                  <Icon icon="mdi:water-off-outline" className="text-gray-300 mx-auto mb-3" width="64" />
                  <p className="text-gray-500">Belum ada data water level</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Water Level Percentage */}
                  <div className="relative">
                    <div className="flex items-end justify-center mb-3">
                      <span className="text-6xl font-bold text-blue-600">{latestWater.waterLevel}</span>
                      <span className="text-3xl font-semibold text-blue-400 mb-2">%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div className={`h-full ${getStatusColor()} transition-all duration-500 rounded-full`} style={{ width: `${latestWater.waterLevel}%` }}></div>
                    </div>
                  </div>

                  {/* Distance */}
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90 mb-1">Jarak Sensor</p>
                        <p className="text-3xl font-bold">{latestWater.distance}</p>
                        <p className="text-sm opacity-90 mt-1">centimeter</p>
                      </div>
                      <Icon icon="mdi:ruler" width="48" className="opacity-50" />
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status Keran</p>
                        <p className="text-lg font-bold text-gray-800">{getStatusText()}</p>
                      </div>
                      <div>
                        {latestWater.distance == data.keranTutup ? (
                          <Icon icon="mdi:toggle-switch-off" width="64" className="text-gray-400" />
                        ) : latestWater.distance == data.keranNormal ? (
                          <Icon icon="mdi:toggle-switch-off-outline" width="64" className="text-yellow-500" />
                        ) : latestWater.distance == data.keranBuka ? (
                          <Icon icon="mdi:toggle-switch" width="64" className="text-green-500" />
                        ) : (
                          <Icon icon="mdi:help-circle" width="52" className="text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
                    <Icon icon="mdi:clock-outline" width="16" />
                    <span>Terakhir update: {new Date(latestWater.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPoolPage;
