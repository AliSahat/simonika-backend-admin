// @/pages/api/mqtt/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  connectMqtt,
  getLatestMqttData,
  MQTT_TOPIC,
} from "@/lib/mqttClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  connectMqtt();

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      topic: MQTT_TOPIC,
      data: getLatestMqttData() || "No data received yet",
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method Not Allowed" });
}
