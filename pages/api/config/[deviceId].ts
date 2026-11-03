import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import mongoConnect from "@/lib/mongoConnect";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import {
  ensureMqttConnected,
  getDeviceStatus,
  getMqttConnectionStatus,
  publishDeviceConfig,
} from "@/lib/mqttClient";
import {
  ConfigValidationError,
  mapThresholdInputToWaterControl,
  normalizeSerial,
  validatePoolConfig,
} from "@/lib/waterControl";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { Pool, type IPool } from "@/models/Pool";
import { WaterLevel } from "@/models/WaterLevel";

function formatConfigResponse(pool: IPool) {
  return {
    _id: pool._id,
    device_id: pool.serial,
    serial: pool.serial,
    namaWadah: pool.namaWadah,
    max_depth: pool.kedalaman,
    sensor_to_bottom: pool.jarakSensorDasar,
    fill_start: pool.batasIsiMulai,
    fill_stop: pool.batasIsiBerhenti,
    drain_start: pool.batasBuangMulai,
    drain_stop: pool.batasBuangBerhenti,
    kedalaman: pool.kedalaman,
    jarakSensorDasar: pool.jarakSensorDasar,
    batasIsiMulai: pool.batasIsiMulai,
    batasIsiBerhenti: pool.batasIsiBerhenti,
    batasBuangMulai: pool.batasBuangMulai,
    batasBuangBerhenti: pool.batasBuangBerhenti,
    mode_auto: pool.modeAuto,
    modeAuto: pool.modeAuto,
    is_active: pool.isActive,
    isActive: pool.isActive,
    created_at: pool.createdAt,
    updated_at: pool.updatedAt,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();

  let userId: string;
  try {
    userId = getAuthenticatedUserId(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }

  const rawDeviceId = Array.isArray(req.query.deviceId) ? req.query.deviceId[0] : req.query.deviceId;
  if (!rawDeviceId || !rawDeviceId.trim()) {
    return res.status(400).json({ success: false, message: "Parameter deviceId wajib diisi" });
  }

  try {
    if (!getMqttConnectionStatus()) {
      await ensureMqttConnected(1500).catch(() => undefined);
    }
  } catch {
    // Abaikan warning auto-connect
  }

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

    if (req.method === "GET") {
      const pool = await Pool.findOne(queryFilter);
      if (!pool) {
        return res.status(404).json({ success: false, message: "Konfigurasi wadah untuk perangkat ini tidak ditemukan" });
      }

      const liveStatus = getDeviceStatus(pool.serial);
      const latestLog = await WaterLevel.findOne({ poolId: pool._id, userId })
        .sort({ createdAt: -1 })
        .lean();

      const lastStatus = liveStatus ?? (latestLog
        ? {
            device_id: latestLog.serial,
            water_level: latestLog.waterLevel ?? null,
            sensor_distance: latestLog.distance ?? null,
            inlet_valve: latestLog.fillValveOpen,
            outlet_valve: latestLog.drainValveOpen,
            system_state: latestLog.controlState,
            sensor_valid: latestLog.sensorValid,
            updated_at: latestLog.createdAt,
          }
        : null);

      return res.status(200).json({
        success: true,
        mqtt_connected: getMqttConnectionStatus(),
        data: {
          config: formatConfigResponse(pool),
          last_status: lastStatus,
        },
      });
    }

    if (req.method === "PUT" || req.method === "POST") {
      const existing = await Pool.findOne(queryFilter);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Konfigurasi wadah untuk perangkat ini tidak ditemukan" });
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const merged = existing.toObject() as unknown as Record<string, unknown>;
      const mappedThresholds = mapThresholdInputToWaterControl(body, existing.jarakSensorDasar);

      for (const [key, val] of Object.entries(mappedThresholds)) {
        if (val !== undefined) merged[key] = val;
      }
      if (body.namaWadah !== undefined) merged.namaWadah = body.namaWadah;
      if (body.modeAuto !== undefined || body.mode_auto !== undefined) {
        merged.modeAuto = body.modeAuto !== undefined ? body.modeAuto : body.mode_auto;
      }
      if (body.isActive !== undefined || body.is_active !== undefined) {
        merged.isActive = body.isActive !== undefined ? body.isActive : body.is_active;
      }

      // Jika jarakSensorDasar lama lebih kecil/sama dengan kedalaman baru dan user tidak mengirim jarakSensorDasar baru,
      // sesuaikan otomatis ke kedalaman + 5 cm agar posisi sensor tetap di atas max_depth.
      if (
        body.jarakSensorDasar === undefined &&
        body.sensor_to_bottom === undefined &&
        typeof merged.kedalaman === "number" &&
        typeof merged.jarakSensorDasar === "number" &&
        merged.jarakSensorDasar <= merged.kedalaman
      ) {
        merged.jarakSensorDasar = merged.kedalaman + 5;
      }

      const validatedInput = validatePoolConfig(merged);
      const updatedPool = await Pool.findOneAndUpdate(
        { _id: existing._id, userId },
        { $set: validatedInput },
        { new: true, runValidators: true },
      );
      if (!updatedPool) {
        return res.status(404).json({ success: false, message: "Konfigurasi wadah tidak ditemukan" });
      }

      let mqttPublishResult = null;
      if (updatedPool.isActive) {
        mqttPublishResult = await publishDeviceConfig(updatedPool);
      }

      return res.status(200).json({
        success: true,
        message: updatedPool.isActive
          ? "Konfigurasi wadah berhasil diperbarui dan dipublish ke MQTT (retain: true, QoS: 1)"
          : "Konfigurasi wadah berhasil disimpan (wadah nonaktif, tidak dipublish ke MQTT)",
        mqtt: mqttPublishResult
          ? {
              published: true,
              retain: true,
              qos: 1,
              topic: mqttPublishResult.simonikaTopic,
              legacy_topic: mqttPublishResult.topic,
              payload: mqttPublishResult.simonikaPayload,
            }
          : { published: false },
        data: formatConfigResponse(updatedPool),
      });
    }

    return res.status(405).json({ success: false, message: "Metode tidak diizinkan" });
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Config API error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan server",
    });
  }
}
