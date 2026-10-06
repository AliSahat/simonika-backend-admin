import mqtt from "mqtt";
import mongoose from "mongoose";
import { WaterLevel } from "@/models/WaterLevel";

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL as string;
const MQTT_USERNAME = process.env.MQTT_USERNAME as string;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD as string;
export const MQTT_TOPIC = process.env.MQTT_TOPIC as string;

let latestData: Record<string, unknown> | string | null = null;
let client: mqtt.MqttClient | null = null;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI as string);
}

export function getLatestMqttData() {
  return latestData;
}

export function connectMqtt() {
  if (client) return client;

  client = mqtt.connect(MQTT_BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    protocol: "mqtts",
    reconnectPeriod: 5000,
  });

  client.on("connect", () => {
    console.log("✅ MQTT Connected");
    client?.subscribe(MQTT_TOPIC, (err) => {
      console.log(
        err ? "❌ Subscribe Error" : `📡 Subscribed to ${MQTT_TOPIC}`,
      );
    });
  });

  client.on("error", (err) => {
    console.error("❌ MQTT Error:", err.message);
  });

  client.on("message", async (topic, message) => {
    if (topic !== MQTT_TOPIC) return;

    try {
      const data = JSON.parse(message.toString()) as Record<string, unknown>;
      latestData = data;

      const { serial, waterLevel, distance, timestamp, uptimeMs, sequence } =
        data;

      if (
        typeof serial === "string" &&
        (typeof waterLevel === "number" || typeof distance === "number")
      ) {
        await connectDB();
        await WaterLevel.create({
          serial,
          waterLevel,
          distance,
          timestamp,
          uptimeMs,
          sequence,
        });
        console.log("✅ Saved to DB", data);
      }
    } catch (err) {
      latestData = message.toString();
      console.error("❌ Failed to process MQTT data:", err);
    }
  });

  return client;
}
