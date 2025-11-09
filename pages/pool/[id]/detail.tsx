"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Icon } from "@iconify/react";

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
        const token = localStorage.getItem("token");

        const resPool = await axios.get(`/api/pool/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setData(resPool.data.data);
      } catch (error) {
        console.error("Error fetching detail:", error);
        alert("Gagal mengambil data detail!");
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
        const token = localStorage.getItem("token");

        const res = await axios.get(`/api/water/level`);

        const allLevels = res.data.data;

        const filtered = allLevels
          .filter((item: any) => item.serial === data.serial)
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        if (filtered.length > 0) {
          setLatestWater(filtered[0]);
        }
      } catch (error) {
        console.error("Error fetching latest water:", error);
      }
    };

    // Jalankan langsung sekali
    fetchLatestWater();

    // Repeat tiap 1 detik
    const interval = setInterval(fetchLatestWater, 1000);

    // Bersihkan interval saat unmount
    return () => clearInterval(interval);
  }, [data]);

  return (
    <div>
      <Sidebar />
      <div className="pl-[150px] pt-5 min-h-screen">
        <h1 className="text-2xl font-normal mb-4">Monitoring Wadah</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Detail Kolam */}
            {data && (
              <div className="border p-5 rounded w-[400px] space-y-2 mb-5">
                <p>
                  <span className="font-bold">Serial:</span> {data.serial}
                </p>
                <p>
                  <span className="font-bold">Nama Wadah:</span>{" "}
                  {data.namaWadah}
                </p>
                <p>
                  <span className="font-bold">Kedalaman:</span> {data.kedalaman}{" "}
                  cm
                </p>
                <p>
                  <span className="font-bold">Keran Tutup:</span>{" "}
                  {data.keranTutup}
                </p>
                <p>
                  <span className="font-bold">Keran Normal:</span>{" "}
                  {data.keranNormal}
                </p>
                <p>
                  <span className="font-bold">Keran Buka:</span>{" "}
                  {data.keranBuka}
                </p>
                <p>
                  <span className="font-bold">Status Aktif:</span>{" "}
                  <span
                    className={
                      data.isActive ? "text-green-600" : "text-red-600"
                    }
                  >
                    {data.isActive ? "Aktif" : "Tidak Aktif"}
                  </span>
                </p>
                <p>
                  <span className="font-bold">Dibuat:</span>{" "}
                  {new Date(data.createdAt).toLocaleString()}
                </p>
                <p>
                  <span className="font-bold">Diupdate:</span>{" "}
                  {new Date(data.updatedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Latest Water Level + TOGGLE */}
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Water Level Terbaru (Auto Refresh 1s)
              </h2>

              {!latestWater ? (
                <p className="text-gray-500">Belum ada data water level.</p>
              ) : (
                <div className="border p-3 rounded w-[420px] flex justify-between items-center">
                  <div>
                    <p>
                      <span className="font-bold">Water Level:</span>{" "}
                      {latestWater.waterLevel}%
                    </p>
                    <p>
                      <span className="font-bold">Distance:</span>{" "}
                      {latestWater.distance} cm
                    </p>
                    <p>
                      <span className="font-bold">Waktu:</span>{" "}
                      {new Date(latestWater.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* UI TOGGLE */}
                  <div>
                    {latestWater.distance == data.keranTutup ? (
                      <Icon
                        icon="mdi:toggle-switch-off"
                        width="55"
                        className="text-gray-400"
                      />
                    ) : latestWater.distance == data.keranNormal ? (
                      <Icon
                        icon="mdi:toggle-switch-off-outline"
                        width="55"
                        className="text-yellow-500"
                      />
                    ) : latestWater.distance == data.keranBuka ? (
                      <Icon
                        icon="mdi:toggle-switch"
                        width="55"
                        className="text-green-500"
                      />
                    ) : (
                      <Icon
                        icon="mdi:help"
                        width="45"
                        className="text-red-500"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DetailPoolPage;
