import type { NextApiRequest, NextApiResponse } from "next";
import mqtt from "mqtt";
import mongoose from "mongoose";
import { WaterLevel } from "@/models/WaterLevel";

const MQTT_BROKER_URL =
  "mqtts://11190e424a874a52968a4670e731d792.s1.eu.hivemq.cloud:8883";
const MQTT_USERNAME = "banjir";
const MQTT_PASSWORD = "Classmild1";

const TOPIC = "devices/00e5b570/data";

// CONNECT MONGODB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
}

let latestData: any = null;
let client: mqtt.MqttClient | null = null;

// MQTT CONNECT FUNCTION
function connectMqtt() {
  if (client) return client;

  client = mqtt.connect(MQTT_BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: "mqtts",
    reconnectPeriod: 5000,
  });

  client.on("connect", () => {
    console.log("✅ MQTT Connected");

    client?.subscribe(TOPIC, (err) => {
      console.log(err ? "❌ Subscribe Error" : `📡 Subscribed to ${TOPIC}`);
    });
  });

  client.on("message", async (topic, message) => {
    if (topic === TOPIC) {
      try {
        latestData = JSON.parse(message.toString());
      } catch {
        latestData = message.toString();
      }

      console.log("📥 MQTT Data Received:", latestData);

      // --- SAVE to MONGODB ---
      try {
        await connectDB();

        const { serial, waterLevel, distance } = latestData;

        // Jika format lengkap
        if (serial && (waterLevel !== undefined || distance !== undefined)) {
          await WaterLevel.create({
            serial,
            waterLevel,
            distance,
          });

          console.log("✅ Saved to DB");
        }
      } catch (err) {
        console.error("❌ Failed to save to MongoDB:", err);
      }
    }
  });

  return client;
}

// --- API ENDPOINT ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  connectMqtt();

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      topic: TOPIC,
      data: latestData || "No data received yet",
    });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method Not Allowed" });
}
