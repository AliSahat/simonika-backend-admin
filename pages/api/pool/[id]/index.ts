import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import { connectMqtt, publishDeviceConfig } from "@/lib/mqttClient";
import {
  ConfigValidationError,
  mapThresholdInputToWaterControl,
  validatePoolConfig,
} from "@/lib/waterControl";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";

const editableFields = ["serial", "namaWadah", "kedalaman", "jarakSensorDasar", "batasIsiMulai",
  "batasIsiBerhenti", "batasBuangMulai", "batasBuangBerhenti", "modeAuto", "isActive"] as const;
const isDuplicateKey = (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  let userId: string;
  try { userId = getAuthenticatedUserId(req); }
  catch (error) {
    if (error instanceof AuthError) return res.status(401).json({ success: false, message: error.message });
    console.error("Pool auth configuration error:", error);
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }
  try { connectMqtt(); } catch { /* ignore auto-connect errors */ }
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || !mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Pool ID tidak valid" });
  try {
    await mongoConnect();
    if (req.method === "GET") {
      const pool = await Pool.findOne({ _id: id, userId });
      if (!pool) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
      return res.status(200).json({ success: true, data: pool });
    }
    if (req.method === "DELETE") {
      const pool = await Pool.findOneAndDelete({ _id: id, userId });
      if (!pool) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
      return res.status(200).json({ success: true, message: "Data berhasil dihapus" });
    }
    if (req.method === "PUT") {
      const existing = await Pool.findOne({ _id: id, userId });
      if (!existing) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
      const merged = existing.toObject() as unknown as Record<string, unknown>;
      const body = (req.body ?? {}) as Record<string, unknown>;
      const mappedThresholds = mapThresholdInputToWaterControl(body, existing.jarakSensorDasar);
      for (const [key, val] of Object.entries(mappedThresholds)) {
        if (val !== undefined) merged[key] = val;
      }
      for (const field of editableFields) if (body[field] !== undefined) merged[field] = body[field];
      const input = validatePoolConfig(merged);
      if (await Pool.exists({ serial: input.serial, _id: { $ne: id } })) return res.status(409).json({ success: false, message: "Serial perangkat sudah terdaftar" });
      const updatedPool = await Pool.findOneAndUpdate({ _id: id, userId }, { $set: input }, { new: true, runValidators: true });
      if (!updatedPool) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });

      let mqttPublished = false;
      if (updatedPool.isActive) {
        try {
          await publishDeviceConfig(updatedPool);
          mqttPublished = true;
        } catch (mqttErr) {
          console.error("Auto-publish MQTT on pool update warning:", mqttErr instanceof Error ? mqttErr.message : mqttErr);
        }
      }
      return res.status(200).json({ success: true, mqttPublished, data: updatedPool });
    }
    return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  } catch (error) {
    if (error instanceof ConfigValidationError) return res.status(400).json({ success: false, message: error.message });
    if (isDuplicateKey(error)) return res.status(409).json({ success: false, message: "Serial perangkat sudah terdaftar" });
    console.error("Pool detail API error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
}
