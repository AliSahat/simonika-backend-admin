"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import Loading from "@/components/Loading";
import Empty from "@/components/Empty";

const ReadPoolPage = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPools = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/pool", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPools(res.data.data);
    } catch (error) {
      console.error("Error fetching pools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm("Yakin ingin menghapus kolam ini?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`/api/pool/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Kolam berhasil dihapus!");
      fetchPools(); // refresh data setelah delete
    } catch (error) {
      console.error("Error deleting pool:", error);
      alert("Gagal menghapus kolam!");
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="pl-[150px] pt-5">
        <div className="flex justify-between items-center px-5 pb-5">
          <h1 className="text-3xl">Manajemen Wadah</h1>
          <div>
            <Link
              href={`/pool/create`}
              className="inline-flex items-center justify-center bg-blue-500 text-white p-5 text-center rounded-full w-full"
            >
              Tambah Kolam Baru
            </Link>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : pools.length === 0 ? (
          <Empty messages="Tidak ada data" />
        ) : (
          <div className="flex gap-5 flex-wrap">
            {pools.map((pool: any) => (
              <div
                key={pool._id}
                className="w-[400px] flex flex-col gap-3 border border-black/15 p-5 rounded-3xl transition"
              >
                <div>
                  <h2 className="text-2xl font-normal">{pool.namaWadah}</h2>
                  <p>Serial: {pool.serial}</p>
                  <p>Kedalaman: {pool.kedalaman} cm</p>
                  <p>Status: {pool.isActive ? "Aktif" : "Tidak Aktif"}</p>
                </div>

                <div>
                  <Link
                    href={`/pool/${pool._id}/detail`}
                    className="inline-flex items-center justify-center bg-blue-500 text-white p-5 text-center rounded-full w-full"
                  >
                    Monitoring Wadah
                  </Link>
                </div>

                <div>
                  <Link
                    href={`/pool/${pool._id}/update`}
                    className="inline-flex items-center justify-center border border-blue-500 text-blue-500 p-5 text-center rounded-full w-full"
                  >
                    Ubah Wadah
                  </Link>
                </div>

                <div>
                  <button
                    onClick={() => handleDelete(pool._id)}
                    className="inline-flex items-center justify-center border border-red-500/25 text-red-500/75 p-5 text-center rounded-full w-full"
                  >
                    Hapus Wadah
                  </button>
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
