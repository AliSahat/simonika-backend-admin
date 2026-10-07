import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import { buildDeviceConfigPayload } from "@/lib/deviceConfig";
import { ConfigValidationError } from "@/lib/waterControl";
import { publishMqtt } from "@/lib/mqttClient";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });

  let userId: string;
  try { userId = getAuthenticatedUserId(req); }
  catch (error) {
    if (error instanceof AuthError) return res.status(401).json({ success: false, message: error.message });
    console.error("MQTT publish auth configuration error:", error);
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }

  const poolId = (req.body as Record<string, unknown> | undefined)?.poolId;
  if (typeof poolId !== "string" || !mongoose.isValidObjectId(poolId)) {
    return res.status(400).json({ success: false, message: "poolId tidak valid" });
  }

  try {
    await mongoConnect();
    const pool = await Pool.findOne({ _id: poolId, userId });
    if (!pool) return res.status(404).json({ success: false, message: "Data wadah tidak ditemukan" });
    if (!pool.isActive) return res.status(400).json({ success: false, message: "Wadah nonaktif tidak dapat menerima konfigurasi" });

    const payload = buildDeviceConfigPayload(pool);
    const topic = `devices/${pool.serial}/command`;
    await publishMqtt(topic, payload);
    return res.status(200).json({
      success: true,
      message: "Konfigurasi berhasil dipublish ke broker; penerapan oleh perangkat belum terkonfirmasi",
      topic,
      data: payload,
    });
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json({ success: false, message: `Konfigurasi wadah belum valid: ${error.message}` });
    }
    console.error("MQTT publish error:", error);
    return res.status(500).json({ success: false, message: "Konfigurasi gagal dipublish ke broker MQTT" });
  }
}
