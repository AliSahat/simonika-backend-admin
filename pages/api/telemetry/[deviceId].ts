import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import {
  ensureMqttConnected,
  getDeviceStatus,
  getMqttConnectionStatus,
} from "@/lib/mqttClient";
import { ConfigValidationError, normalizeSerial } from "@/lib/waterControl";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool } from "@/models/Pool";
import { WaterLevel, type IWaterLevel } from "@/models/WaterLevel";

function formatTelemetryLog(log: IWaterLevel) {
  return {
    _id: log._id,
    device_id: log.serial,
    serial: log.serial,
    poolId: log.poolId,
    water_level: log.waterLevel ?? null,
    sensor_distance: log.distance ?? null,
    inlet_valve: log.fillValveOpen,
    outlet_valve: log.drainValveOpen,
    system_state: log.controlState,
    sensor_valid: log.sensorValid,
    waterLevel: log.waterLevel,
    distance: log.distance,
    fillValveOpen: log.fillValveOpen,
    drainValveOpen: log.drainValveOpen,
    controlState: log.controlState,
    sensorValid: log.sensorValid,
    timestamp: log.timestamp,
    uptimeMs: log.uptimeMs,
    sequence: log.sequence,
    created_at: log.createdAt,
    createdAt: log.createdAt,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  }

  let userId: string;
  try {
    userId = getAuthenticatedUserId(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }

  try {
    if (!getMqttConnectionStatus()) {
      await ensureMqttConnected(1500).catch(() => undefined);
    }
  } catch {
    // Abaikan warning auto-connect
  }

  const rawDeviceId = Array.isArray(req.query.deviceId) ? req.query.deviceId[0] : req.query.deviceId;
  if (!rawDeviceId || !rawDeviceId.trim()) {
    return res.status(400).json({ success: false, message: "Parameter deviceId wajib diisi" });
  }

  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const parsedLimit = rawLimit === undefined ? 50 : Number(rawLimit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ success: false, message: "limit harus berupa bilangan bulat positif" });
  }
  const limit = Math.min(parsedLimit, 200);

  try {
    await mongoConnect();

    const isObjectId = mongoose.isValidObjectId(rawDeviceId);
    let normalizedSerial: string | null = null;
    try {
      normalizedSerial = normalizeSerial(rawDeviceId);
    } catch (error) {
      if (!isObjectId && error instanceof ConfigValidationError) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }

    const queryFilter = isObjectId
      ? { $or: [{ _id: rawDeviceId, userId }, ...(normalizedSerial ? [{ serial: normalizedSerial, userId }] : [])] }
      : { serial: normalizedSerial, userId };

    const pool = await Pool.findOne(queryFilter).select("_id serial namaWadah kedalaman");
    if (!pool) {
      return res.status(404).json({ success: false, message: "Data wadah / perangkat tidak ditemukan" });
    }

    const logs = await WaterLevel.find({
      $or: [
        { poolId: pool._id, userId },
        { poolId: { $exists: false }, serial: pool.serial },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    const formattedLogs = logs.map((doc) => formatTelemetryLog(doc));

    return res.status(200).json({
      success: true,
      device_id: pool.serial,
      count: formattedLogs.length,
      mqtt_connected: getMqttConnectionStatus(),
      device_status: getDeviceStatus(pool.serial) ?? null,
      data: formattedLogs,
    });
  } catch (error) {
    console.error("Telemetry deviceId API error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
}
