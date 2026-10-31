import mqtt, { type MqttClient } from "mqtt";
import mongoConnect from "@/lib/mongoConnect";
import {
  normalizeSerial,
  parseTelemetryPayload,
  type ParsedTelemetry,
} from "@/lib/waterControl";
import { Pool } from "@/models/Pool";
import { WaterLevel } from "@/models/WaterLevel";

export { parseTelemetryPayload, type ParsedTelemetry };
export const MQTT_TELEMETRY_TOPIC = "devices/+/data";
export const MQTT_STATUS_TOPIC = "devices/+/status";
export const MQTT_AVAILABILITY_TOPIC = "devices/+/availability";
export const MQTT_ACK_TOPIC = "devices/+/ack";

declare global {
  var simonikaMqttClient: MqttClient | undefined;
  var simonikaDeviceStatus: Map<string, Record<string, unknown>> | undefined;
  var simonikaLatestMqttData: Record<string, unknown> | null | undefined;
  var simonikaMqttSubscribed: boolean | undefined;
}

function getStatusCache(): Map<string, Record<string, unknown>> {
  if (!global.simonikaDeviceStatus) {
    global.simonikaDeviceStatus = new Map<string, Record<string, unknown>>();
  }
  return global.simonikaDeviceStatus;
}

export function getDeviceStatus(serial: string): Record<string, unknown> | undefined {
  try {
    return getStatusCache().get(normalizeSerial(serial));
  } catch {
    return undefined;
  }
}

export function getAllDeviceStatuses(): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const [serial, status] of getStatusCache().entries()) {
    result[serial] = status;
  }
  return result;
}

export function getLatestMqttData(): Record<string, unknown> | null {
  return global.simonikaLatestMqttData ?? null;
}

function mqttOptions() {
  const brokerUrl = process.env.MQTT_BROKER_URL;
  const username = process.env.MQTT_USERNAME;
  const password = process.env.MQTT_PASSWORD;
  if (!brokerUrl || !username || !password) throw new Error("Konfigurasi MQTT belum lengkap");
  return { brokerUrl, username, password };
}

function processStatus(topic: string, message: Buffer): void {
  const match = /^devices\/([^/]+)\/(status|availability|ack)$/.exec(topic);
  if (!match) return;
  try {
    const topicSerial = normalizeSerial(match[1]);
    const kind = match[2];
    const existing = getStatusCache().get(topicSerial) ?? { serial: topicSerial };
    const nowIso = new Date().toISOString();

    if (kind === "availability") {
      const availability = message.toString().trim();
      const updated = {
        ...existing,
        serial: topicSerial,
        availability,
        receivedAt: nowIso,
      };
      getStatusCache().set(topicSerial, updated);
      return;
    }

    const payload = JSON.parse(message.toString()) as Record<string, unknown>;
    if (payload.serial !== undefined && normalizeSerial(payload.serial) !== topicSerial) {
      return;
    }

    if (kind === "ack") {
      const updated = {
        ...existing,
        serial: topicSerial,
        lastAck: payload,
        receivedAt: nowIso,
      };
      getStatusCache().set(topicSerial, updated);
      return;
    }

    const updated = {
      ...existing,
      ...payload,
      serial: topicSerial,
      topic,
      receivedAt: nowIso,
    };
    getStatusCache().set(topicSerial, updated);
    global.simonikaLatestMqttData = updated;
  } catch {
    // Abaikan payload status yang tidak valid
  }
}

async function processTelemetry(topic: string, message: Buffer): Promise<void> {
  const match = /^devices\/([^/]+)\/data$/.exec(topic);
  if (!match) return;
  const topicSerial = normalizeSerial(match[1]);
  const parsed = parseTelemetryPayload(topic, message, getStatusCache().get(topicSerial));
  if (!parsed) return;

  const nowIso = new Date().toISOString();
  const telemetryRecord: Record<string, unknown> = {
    serial: parsed.topicSerial,
    topic,
    ...(parsed.waterLevel === undefined ? {} : { waterLevel: parsed.waterLevel }),
    ...(parsed.distance === undefined ? {} : { distance: parsed.distance }),
    ...(parsed.timestamp === undefined ? {} : { timestamp: parsed.timestamp }),
    ...(parsed.uptimeMs === undefined ? {} : { uptimeMs: parsed.uptimeMs }),
    ...(parsed.sequence === undefined ? {} : { sequence: parsed.sequence }),
    sensorValid: parsed.sensorValid,
    fillValveOpen: parsed.fillValveOpen,
    drainValveOpen: parsed.drainValveOpen,
    controlState: parsed.controlState,
    receivedAt: nowIso,
  };

  global.simonikaLatestMqttData = telemetryRecord;
  const existing = getStatusCache().get(topicSerial) ?? { serial: topicSerial };
  getStatusCache().set(topicSerial, {
    ...existing,
    ...telemetryRecord,
  });

  await mongoConnect();
  const pool = await Pool.findOne({ serial: parsed.topicSerial, isActive: true }).select("_id userId");
  if (!pool) throw new Error(`Telemetry ditolak: serial ${parsed.topicSerial} tidak terdaftar atau nonaktif`);
  await WaterLevel.create({
    poolId: pool._id,
    userId: pool.userId,
    serial: parsed.topicSerial,
    ...(parsed.waterLevel === undefined ? {} : { waterLevel: parsed.waterLevel }),
    ...(parsed.distance === undefined ? {} : { distance: parsed.distance }),
    ...(parsed.timestamp === undefined ? {} : { timestamp: parsed.timestamp }),
    ...(parsed.uptimeMs === undefined ? {} : { uptimeMs: parsed.uptimeMs }),
    ...(parsed.sequence === undefined ? {} : { sequence: parsed.sequence }),
    sensorValid: parsed.sensorValid,
    fillValveOpen: parsed.fillValveOpen,
    drainValveOpen: parsed.drainValveOpen,
    controlState: parsed.controlState,
  });
}

export function connectMqtt(): MqttClient {
  if (global.simonikaMqttClient) return global.simonikaMqttClient;
  const { brokerUrl, username, password } = mqttOptions();
  const client = mqtt.connect(brokerUrl, { username, password, protocol: "mqtts", reconnectPeriod: 5000 });
  global.simonikaMqttClient = client;
  client.on("connect", () => {
    client.subscribe(
      [MQTT_TELEMETRY_TOPIC, MQTT_STATUS_TOPIC, MQTT_AVAILABILITY_TOPIC, MQTT_ACK_TOPIC],
      { qos: 1 },
      (error) => {
        if (error) {
          console.error("MQTT subscribe error:", error.message);
        } else {
          global.simonikaMqttSubscribed = true;
        }
      },
    );
  });
  client.on("message", (topic, message) => {
    if (/^devices\/[^/]+\/(status|availability|ack)$/.test(topic)) {
      processStatus(topic, message);
      return;
    }
    void processTelemetry(topic, message).catch((error: unknown) => {
      console.error("MQTT telemetry rejected:", error instanceof Error ? error.message : error);
    });
  });
  client.on("error", (error) => console.error("MQTT connection error:", error.message));
  return client;
}

export async function ensureMqttConnected(timeoutMs = 4000): Promise<boolean> {
  const client = connectMqtt();
  if (client.connected && getStatusCache().size > 0) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.removeListener("connect", onConnect);
      client.removeListener("message", onMessage);
      resolve(result);
    };

    const onMessage = () => {
      // Beri jeda singkat 150ms agar seluruh retained message (availability & status) masuk
      setTimeout(() => finish(client.connected), 150);
    };

    const onConnect = () => {
      // Setelah terhubung, tunggu sebentar untuk retained message dari HiveMQ
      setTimeout(() => finish(client.connected), 450);
    };

    const timer = setTimeout(() => finish(client.connected), timeoutMs);

    client.on("message", onMessage);
    if (client.connected) {
      setTimeout(() => finish(true), 350);
    } else {
      client.once("connect", onConnect);
    }
  });
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
