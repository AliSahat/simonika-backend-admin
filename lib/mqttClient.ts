import mqtt from "mqtt";
import mongoose from "mongoose";
import { WaterLevel } from "@/models/WaterLevel";

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL as string;
const MQTT_USERNAME = process.env.MQTT_USERNAME as string;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD as string;
export const MQTT_TOPIC = process.env.MQTT_TOPIC || "devices/+/data";

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
    connectTimeout: 15000,
    clean: true,
  });

  client.on("connect", () => {
    console.log("MQTT Connected");
    client?.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
      console.log(err ? "MQTT subscribe error" : `Subscribed to ${MQTT_TOPIC}`);
    });
  });

  client.on("error", (err) => {
    console.error("MQTT Error:", err.message);
  });

  client.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString()) as Record<string, unknown>;
      latestData = data;

      const serialFromTopic = topic.split("/")[1];
      const serial =
        typeof data.serial === "string" && data.serial.trim()
          ? data.serial.trim()
          : serialFromTopic;

      const waterLevel =
        typeof data.waterLevel === "number" ? data.waterLevel : undefined;
      const distance =
        typeof data.distance === "number" ? data.distance : undefined;

      if (!serial || (waterLevel === undefined && distance === undefined)) return;

      await connectDB();
      await WaterLevel.create({
        serial,
        waterLevel,
        distance,
        timestamp: data.timestamp,
        uptimeMs: data.uptimeMs,
        sequence: data.sequence,
        fillValveOpen: data.fillValveOpen,
        drainValveOpen: data.drainValveOpen,
        controlState: data.controlState,
        sensorValid: data.sensorValid,
      });
    } catch (err) {
      latestData = message.toString();
      console.error("Failed to process MQTT data:", err);
    }
  });

  return client;
}

export async function publishMqtt(
  topic: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const mqttClient = connectMqtt();

  if (!mqttClient.connected) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("MQTT connection timeout")), 10000);
      mqttClient.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      mqttClient.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  await new Promise<void>((resolve, reject) => {
    mqttClient.publish(topic, JSON.stringify(payload), { qos: 1, retain: true }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
