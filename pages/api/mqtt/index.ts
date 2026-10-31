// @/pages/api/mqtt/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import mongoConnect from "@/lib/mongoConnect";
import {
  ensureMqttConnected,
  getAllDeviceStatuses,
  getLatestMqttData,
  getMqttConnectionStatus,
  MQTT_STATUS_TOPIC,
  MQTT_TELEMETRY_TOPIC,
} from "@/lib/mqttClient";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import verifyCors, { cors } from "@/middleware/verifyCors";
import { WaterLevel } from "@/models/WaterLevel";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();

  // Jika klien menyertakan header Authorization, validasi tokennya;
  // namun jika dibuka langsung dari browser (tanpa header Authorization), tetap izinkan GET untuk pengecekan koneksi & data MQTT.
  let userId: string | null = null;
  if (req.headers.authorization) {
    try {
      userId = getAuthenticatedUserId(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(401).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
    }
  }

  if (req.method === "GET") {
    try {
      await ensureMqttConnected();
      const latestMqtt = getLatestMqttData();
      const devices = getAllDeviceStatuses();

      await mongoConnect();
      const latestDb = await WaterLevel.findOne(userId ? { userId } : {})
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        connected: getMqttConnectionStatus(),
        telemetryTopic: MQTT_TELEMETRY_TOPIC,
        statusTopic: MQTT_STATUS_TOPIC,
        data: latestMqtt ?? latestDb ?? "Belum ada data diterima dari broker",
        devices,
        latestTelemetryInDb: latestDb ?? null,
      });
    } catch (error) {
      console.error("MQTT GET error:", error);
      return res.status(500).json({
        success: false,
        connected: getMqttConnectionStatus(),
        message: error instanceof Error ? error.message : "Gagal memeriksa koneksi MQTT",
      });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method Not Allowed" });
}
