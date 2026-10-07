import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import mongoConnect from "@/lib/mongoConnect";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";
import { buildDeviceConfigPayload } from "@/lib/waterControl";
import { publishMqtt } from "@/lib/mqttClient";

const JWT_SECRET = process.env.JWT_SECRET || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await mongoConnect();

    const poolId = String(req.body.poolId ?? "").trim();
    if (!poolId) {
      return res.status(400).json({ success: false, message: "poolId wajib diisi" });
    }

    const pool = await Pool.findOne({ _id: poolId, userId: decoded.userId });
    if (!pool) {
      return res.status(404).json({ success: false, message: "Wadah tidak ditemukan" });
    }

    const payload = buildDeviceConfigPayload(pool.serial, {
      kedalaman: pool.kedalaman,
      jarakSensorDasar: pool.jarakSensorDasar,
      batasIsiMulai: pool.batasIsiMulai,
      batasIsiBerhenti: pool.batasIsiBerhenti,
      batasBuangMulai: pool.batasBuangMulai,
      batasBuangBerhenti: pool.batasBuangBerhenti,
      modeAuto: pool.modeAuto,
    });

    const topic = `devices/${pool.serial}/command`;
    await publishMqtt(topic, payload);

    return res.status(200).json({ success: true, topic, payload });
  } catch (error) {
    console.error("MQTT publish API error:", error);
    return res.status(500).json({ success: false, message: "Gagal mengirim konfigurasi ke perangkat" });
  }
}
