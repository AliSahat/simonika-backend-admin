"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const UpdatePoolPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    serial: "",
    namaWadah: "",
    kedalaman: "",
    keranTutup: "",
    keranNormal: "",
    keranBuka: "",
    isActive: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`/api/pool/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data.data;

        setForm({
          serial: data.serial,
          namaWadah: data.namaWadah,
          kedalaman: String(data.kedalaman),
          keranTutup: String(data.keranTutup),
          keranNormal: String(data.keranNormal),
          keranBuka: String(data.keranBuka),
          isActive: Boolean(data.isActive),
        });
      } catch (error) {
        console.error("Error fetching pool:", error);
        alert("Gagal mengambil data pool!");
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `/api/pool/${id}`,
        {
          serial: form.serial,
          namaWadah: form.namaWadah,
          kedalaman: Number(form.kedalaman),
          keranTutup: Number(form.keranTutup),
          keranNormal: Number(form.keranNormal),
          keranBuka: Number(form.keranBuka),
          isActive: form.isActive,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Berhasil update pool!");
      router.push("/pool/read");
    } catch (error) {
      console.error("Error updating pool:", error);
      alert("Gagal update pool!");
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="pl-[150px] pt-5 min-h-screen">
        <h1 className="text-2xl font-normal mb-5">Edit Kolam</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[350px]">
          <div className="flex flex-col gap-1">
            <label className="font-medium">Serial</label>
            <input
              name="serial"
              value={form.serial}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Nama Wadah</label>
            <input
              name="namaWadah"
              value={form.namaWadah}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Kedalaman (cm)</label>
            <input
              name="kedalaman"
              type="number"
              value={form.kedalaman}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Jarak Keran Tertutup (cm)</label>
            <input
              name="keranTutup"
              type="number"
              value={form.keranTutup}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Jarak Keran Normal (cm)</label>
            <input
              name="keranNormal"
              type="number"
              value={form.keranNormal}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Jarak Keran Terbuka (cm)</label>
            <input
              name="keranBuka"
              type="number"
              value={form.keranBuka}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          {/* isActive checkbox */}
          <div className="flex items-center gap-2">
            <input
              name="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={handleChange}
            />
            <label className="font-medium">Aktif?</label>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white p-5 rounded-full"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePoolPage;
