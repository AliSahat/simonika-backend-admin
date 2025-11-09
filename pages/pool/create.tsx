"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const CreatePoolPage = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    serial: "",
    namaWadah: "",
    kedalaman: "",
    keranTutup: "",
    keranNormal: "",
    keranBuka: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/api/pool",
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
        },
      );

      router.push("/pool/read");
    } catch (error) {
      console.error("Error creating pool:", error);
      alert("Gagal membuat pool!");
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="pl-[150px] pt-5 min-h-screen">
        <h1 className="text-2xl font-normal mb-5">Buat Kolam Baru</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[350px]">
          <div className="flex flex-col gap-1">
            <label className="font-medium">Serial</label>
            <input
              name="serial"
              placeholder="Serial"
              value={form.serial}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Nama Wadah</label>
            <input
              name="namaWadah"
              placeholder="Nama Kolam"
              value={form.namaWadah}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium">Kedalaman (cm)</label>
            <input
              name="kedalaman"
              placeholder="Kedalaman"
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
              placeholder="Keran Tutup"
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
              placeholder="Keran Normal"
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
              placeholder="Keran Buka"
              type="number"
              value={form.keranBuka}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white p-5 rounded-full hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePoolPage;
