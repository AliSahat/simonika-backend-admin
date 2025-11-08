import { useEffect, useState } from 'react';
import axios from 'axios';

interface Pool {
  _id: string;
  userId: string;
  namaWadah: string;
  kedalaman: number;
  keranTutup: number;
  keranNormal: number;
  keranBuka: number;
  createdAt: string;
  updatedAt: string;
}

const PoolPage = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const token = localStorage.getItem('token'); // ambil token dari localStorage
        const response = await axios.get('/api/pool', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setPools(response.data.data);
        } else {
          setError('Gagal mengambil data kolam');
        }
      } catch (err: any) {
        console.error(err);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  if (loading) return <p>Loading data kolam...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Daftar Kolam</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <div key={pool._id} className="p-4 border rounded-lg shadow">
            <h2 className="text-lg font-semibold">{pool.namaWadah}</h2>
            <p>Kedalaman: {pool.kedalaman} cm</p>
            <p>Keran Tutup: {pool.keranTutup}%</p>
            <p>Keran Normal: {pool.keranNormal}%</p>
            <p>Keran Buka: {pool.keranBuka}%</p>
            <small className="text-gray-500">Dibuat: {new Date(pool.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoolPage;
