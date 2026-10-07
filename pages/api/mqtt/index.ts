// @/pages/api/mqtt/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  connectMqtt,
  getMqttConnectionStatus,
  MQTT_TELEMETRY_TOPIC,
} from "@/lib/mqttClient";
import { AuthError, getAuthenticatedUserId } from "@/lib/auth";
import verifyCors, { cors } from "@/middleware/verifyCors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await verifyCors(req, res, cors);
  if (req.method === "OPTIONS") return res.status(200).end();
  try { getAuthenticatedUserId(req); }
  catch (error) {
    if (error instanceof AuthError) return res.status(401).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: "Konfigurasi server tidak valid" });
  }

  if (req.method === "GET") {
    connectMqtt();
    return res.status(200).json({
      success: true,
      connected: getMqttConnectionStatus(),
      telemetryTopic: MQTT_TELEMETRY_TOPIC,
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method Not Allowed" });
}
