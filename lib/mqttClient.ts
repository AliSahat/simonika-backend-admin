import mqtt, { type MqttClient } from "mqtt";
import mongoConnect from "@/lib/mongoConnect";
import { isWaterControlState, normalizeSerial } from "@/lib/waterControl";
import { Pool } from "@/models/Pool";
import { WaterLevel } from "@/models/WaterLevel";

export const MQTT_TELEMETRY_TOPIC = "devices/+/data";

declare global {
  var simonikaMqttClient: MqttClient | undefined;
}

function mqttOptions() {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const username = process.env.MQTT_USERNAME;
  const password = process.env.MQTT_PASSWORD;
  if (!brokerUrl || !username || !password) throw new Error("Konfigurasi MQTT belum lengkap");
  return { brokerUrl, username, password };
}

function finiteOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === "number" && Number.isFinite(value));
}

async function processTelemetry(topic: string, message: Buffer): Promise<void> {
  const match = /^devices\/([^/]+)\/data$/.exec(topic);
  if (!match) return;
  const topicSerial = normalizeSerial(match[1]);
  const payload = JSON.parse(message.toString()) as Record<string, unknown>;
  if (payload.serial !== undefined && normalizeSerial(payload.serial) !== topicSerial) {
    throw new Error("Serial payload telemetry tidak sesuai dengan topic");
  }
  if (![payload.waterLevel, payload.distance].every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("waterLevel dan distance telemetry harus berupa angka finite");
  }
  if (typeof payload.sensorValid !== "boolean" || typeof payload.fillValveOpen !== "boolean" ||
      typeof payload.drainValveOpen !== "boolean" || !isWaterControlState(payload.controlState) ||
      !finiteOptionalNumber(payload.timestamp) || !finiteOptionalNumber(payload.uptimeMs) ||
      !finiteOptionalNumber(payload.sequence)) {
    throw new Error("Payload telemetry tidak valid atau tidak lengkap");
  }

  await mongoConnect();
  const pool = await Pool.findOne({ serial: topicSerial, isActive: true }).select("_id userId");
  if (!pool) throw new Error(`Telemetry ditolak: serial ${topicSerial} tidak terdaftar atau nonaktif`);
  await WaterLevel.create({
    poolId: pool._id, userId: pool.userId, serial: topicSerial,
    waterLevel: payload.waterLevel, distance: payload.distance, timestamp: payload.timestamp,
    uptimeMs: payload.uptimeMs, sequence: payload.sequence, sensorValid: payload.sensorValid,
    fillValveOpen: payload.fillValveOpen, drainValveOpen: payload.drainValveOpen,
    controlState: payload.controlState,
  });
}

export function connectMqtt(): MqttClient {
  if (global.simonikaMqttClient) return global.simonikaMqttClient;
  const { brokerUrl, username, password } = mqttOptions();
  const client = mqtt.connect(brokerUrl, { username, password, protocol: "mqtts", reconnectPeriod: 5000 });
  global.simonikaMqttClient = client;
  client.on("connect", () => client.subscribe(MQTT_TELEMETRY_TOPIC, { qos: 1 }, (error) => {
    if (error) console.error("MQTT subscribe error:", error.message);
  }));
  client.on("message", (topic, message) => void processTelemetry(topic, message).catch((error: unknown) => {
    console.error("MQTT telemetry rejected:", error instanceof Error ? error.message : error);
  }));
  client.on("error", (error) => console.error("MQTT connection error:", error.message));
  return client;
}

export function publishMqtt(topic: string, payload: object): Promise<void> {
  if (!/^devices\/[a-z0-9][a-z0-9_-]{2,63}\/command$/.test(topic)) {
    return Promise.reject(new Error("Topic command MQTT tidak valid"));
  }
  const client = connectMqtt();
  return new Promise((resolve, reject) => client.publish(topic, JSON.stringify(payload), { qos: 1 },
    (error) => error ? reject(error) : resolve()));
}

export function getMqttConnectionStatus(): boolean {
  return global.simonikaMqttClient?.connected ?? false;
}
