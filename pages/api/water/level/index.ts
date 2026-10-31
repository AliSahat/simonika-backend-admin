import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import { connectMqtt, getDeviceStatus, getMqttConnectionStatus } from "@/lib/mqttClient";
import { ConfigValidationError, normalizeSerial } from "@/lib/waterControl";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";
import { WaterLevel } from "@/models/WaterLevel";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  let userId: string;
  try { userId = getAuthenticatedUserId(req); }
  catch (error) {
    if (error instanceof AuthError) return res.status(401).json({ success: false, message: error.message });
    console.error("Telemetry auth configuration error:", error);
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }

  // Pastikan subscriber MQTT selalu aktif saat FE/Mobile melakukan polling data level air
  try {
    connectMqtt();
  } catch (error) {
    console.error("MQTT auto-connect warning:", error instanceof Error ? error.message : error);
  }

  const rawPoolId = Array.isArray(req.query.poolId) ? req.query.poolId[0] : req.query.poolId;
  const rawSerial = Array.isArray(req.query.serial) ? req.query.serial[0] : req.query.serial;
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const parsedLimit = rawLimit === undefined ? 50 : Number(rawLimit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ success: false, message: "limit harus berupa bilangan bulat positif" });
  }
  const limit = Math.min(parsedLimit, 200);

  try {
    await mongoConnect();

    if (rawPoolId !== undefined) {
      if (!rawPoolId || !mongoose.isValidObjectId(rawPoolId)) {
        return res.status(400).json({ success: false, message: "poolId tidak valid" });
      }
      const pool = await Pool.findOne({ _id: rawPoolId, userId }).select("_id serial");
      if (!pool) return res.status(404).json({ success: false, message: "Data wadah tidak ditemukan" });
      const data = await WaterLevel.find({
        $or: [
          { poolId: pool._id, userId },
          { poolId: { $exists: false }, serial: pool.serial },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit);
      return res.status(200).json({
        success: true,
        count: data.length,
        mqttConnected: getMqttConnectionStatus(),
        deviceStatus: getDeviceStatus(pool.serial) ?? null,
        data,
      });
    }

    if (rawSerial !== undefined) {
      let normalizedSerial: string;
      try {
        normalizedSerial = normalizeSerial(rawSerial);
      } catch (error) {
        if (error instanceof ConfigValidationError) {
          return res.status(400).json({ success: false, message: error.message });
        }
        throw error;
      }
      const pool = await Pool.findOne({ serial: normalizedSerial, userId }).select("_id serial");
      if (!pool) return res.status(404).json({ success: false, message: "Data wadah tidak ditemukan" });
      const data = await WaterLevel.find({
        $or: [
          { poolId: pool._id, userId },
          { poolId: { $exists: false }, serial: pool.serial },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit);
      return res.status(200).json({
        success: true,
        count: data.length,
        mqttConnected: getMqttConnectionStatus(),
        deviceStatus: getDeviceStatus(pool.serial) ?? null,
        data,
      });
    }

    // Jika tanpa poolId maupun serial (misalnya HistoryScreen pada aplikasi Mobile Flutter),
    // kembalikan riwayat pembacaan dari seluruh wadah milik user yang terautentikasi.
    const userPools = await Pool.find({ userId }).select("_id serial");
    if (userPools.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        mqttConnected: getMqttConnectionStatus(),
        data: [],
      });
    }
    const poolIds = userPools.map((p) => p._id);
    const poolSerials = userPools.map((p) => p.serial).filter(Boolean);
    const data = await WaterLevel.find({
      $or: [
        { userId },
        { poolId: { $in: poolIds } },
        { poolId: { $exists: false }, serial: { $in: poolSerials } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.status(200).json({
      success: true,
      count: data.length,
      mqttConnected: getMqttConnectionStatus(),
      data,
    });
  } catch (error) {
    console.error("Telemetry API error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
}
