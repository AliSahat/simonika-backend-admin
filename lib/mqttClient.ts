import mqtt, { type MqttClient } from "mqtt";
import {
  buildDeviceConfigPayload,
  buildSimonikaConfigPayload,
  type DeviceConfigPayload,
  type DeviceConfigSource,
  type SimonikaConfigPayload,
} from "@/lib/deviceConfig";
import mongoConnect from "@/lib/mongoConnect";
import {
  DEFAULT_TELEMETRY_THROTTLE_MS,
  normalizeSerial,
  parseTelemetryPayload,
  shouldPersistTelemetry,
  type ParsedTelemetry,
  type TelemetryThrottleSnapshot,
} from "@/lib/waterControl";
import { Pool } from "@/models/Pool";
import { WaterLevel } from "@/models/WaterLevel";

export { parseTelemetryPayload, type ParsedTelemetry };
export const MQTT_TELEMETRY_TOPIC = "devices/+/data";
export const MQTT_SIMONIKA_TELEMETRY_TOPIC = "simonika/+/telemetry";
export const MQTT_STATUS_TOPIC = "devices/+/status";
export const MQTT_SIMONIKA_STATUS_TOPIC = "simonika/+/status";
export const MQTT_AVAILABILITY_TOPIC = "devices/+/availability";
export const MQTT_ACK_TOPIC = "devices/+/ack";

declare global {
  var simonikaMqttClient: MqttClient | undefined;
  var simonikaDeviceStatus: Map<string, Record<string, unknown>> | undefined;
  var simonikaTelemetryThrottle: Map<string, TelemetryThrottleSnapshot> | undefined;
  var simonikaLatestMqttData: Record<string, unknown> | null | undefined;
  var simonikaMqttSubscribed: boolean | undefined;
}

function getStatusCache(): Map<string, Record<string, unknown>> {
  if (!global.simonikaDeviceStatus) {
    global.simonikaDeviceStatus = new Map<string, Record<string, unknown>>();
  }
  return global.simonikaDeviceStatus;
}

function getThrottleCache(): Map<string, TelemetryThrottleSnapshot> {
  if (!global.simonikaTelemetryThrottle) {
    global.simonikaTelemetryThrottle = new Map<string, TelemetryThrottleSnapshot>();
  }
  return global.simonikaTelemetryThrottle;
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
  const match = /^(?:devices|simonika)\/([^/]+)\/(status|availability|ack)$/.exec(topic);
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
    const rawSerial = payload.serial !== undefined ? payload.serial : payload.device_id;
    if (rawSerial !== undefined && normalizeSerial(rawSerial) !== topicSerial) {
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
  const match = /^(?:devices\/([^/]+)\/data|simonika\/([^/]+)\/telemetry)$/.exec(topic);
  if (!match) return;
  const topicSerial = normalizeSerial(match[1] ?? match[2]);
  const parsed = parseTelemetryPayload(topic, message, getStatusCache().get(topicSerial));
  if (!parsed) return;

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const telemetryRecord: Record<string, unknown> = {
    serial: parsed.topicSerial,
    device_id: parsed.topicSerial,
    topic,
    ...(parsed.waterLevel === undefined
      ? {}
      : { waterLevel: parsed.waterLevel, water_level: parsed.waterLevel }),
    ...(parsed.distance === undefined
      ? {}
      : { distance: parsed.distance, sensor_distance: parsed.distance }),
    ...(parsed.timestamp === undefined ? {} : { timestamp: parsed.timestamp }),
    ...(parsed.uptimeMs === undefined ? {} : { uptimeMs: parsed.uptimeMs }),
    ...(parsed.sequence === undefined ? {} : { sequence: parsed.sequence }),
    sensorValid: parsed.sensorValid,
    fillValveOpen: parsed.fillValveOpen,
    drainValveOpen: parsed.drainValveOpen,
    controlState: parsed.controlState,
    inlet_valve: parsed.fillValveOpen,
    outlet_valve: parsed.drainValveOpen,
    system_state: parsed.controlState,
    receivedAt: nowIso,
  };

  // Selalu perbarui cache in-memory secara real-time meskipun penyimpanan DB di-throttle
  global.simonikaLatestMqttData = telemetryRecord;
  const existing = getStatusCache().get(topicSerial) ?? { serial: topicSerial };
  getStatusCache().set(topicSerial, {
    ...existing,
    ...telemetryRecord,
  });

  // Cek mekanisme throttling (15 detik untuk data rutin, atau simpan langsung jika terjadi perubahan state/kran)
  const throttleCache = getThrottleCache();
  const previousSnapshot = throttleCache.get(topicSerial);
  if (!shouldPersistTelemetry(previousSnapshot, parsed, nowMs, DEFAULT_TELEMETRY_THROTTLE_MS)) {
    return;
  }

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

  throttleCache.set(topicSerial, {
    savedAtMs: nowMs,
    controlState: parsed.controlState,
    fillValveOpen: parsed.fillValveOpen,
    drainValveOpen: parsed.drainValveOpen,
    sensorValid: parsed.sensorValid,
  });
}

export function connectMqtt(): MqttClient {
  if (global.simonikaMqttClient) return global.simonikaMqttClient;
  const { brokerUrl, username, password } = mqttOptions();
  const client = mqtt.connect(brokerUrl, { username, password, protocol: "mqtts", reconnectPeriod: 5000 });
  global.simonikaMqttClient = client;
  client.on("connect", () => {
    client.subscribe(
      [
        MQTT_TELEMETRY_TOPIC,
        MQTT_SIMONIKA_TELEMETRY_TOPIC,
        MQTT_STATUS_TOPIC,
        MQTT_SIMONIKA_STATUS_TOPIC,
        MQTT_AVAILABILITY_TOPIC,
        MQTT_ACK_TOPIC,
      ],
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
    if (/^(?:devices|simonika)\/[^/]+\/(status|availability|ack)$/.test(topic)) {
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

export function publishMqtt(
  topic: string,
  payload: object,
  options: { qos?: 0 | 1 | 2; retain?: boolean } = {},
): Promise<void> {
  const isValidCommandTopic =
    /^devices\/[a-z0-9][a-z0-9_-]{2,63}\/command$/.test(topic) ||
    /^simonika\/[a-z0-9][a-z0-9_-]{2,63}\/config$/.test(topic);
  if (!isValidCommandTopic) {
    return Promise.reject(new Error("Topic command/config MQTT tidak valid"));
  }
  const client = connectMqtt();
  const qos = options.qos ?? 1;
  const retain = options.retain ?? true;
  return new Promise((resolve, reject) =>
    client.publish(topic, JSON.stringify(payload), { qos, retain }, (error) =>
      error ? reject(error) : resolve(),
    ),
  );
}

export interface PublishDeviceConfigResult {
  topic: string;
  simonikaTopic: string;
  payload: DeviceConfigPayload;
  simonikaPayload: SimonikaConfigPayload;
}

/**
 * Menerbitkan konfigurasi wadah ke broker MQTT dengan opsi retain: true & QoS: 1
 * baik ke topic baru `simonika/{deviceId}/config` maupun topic existing `devices/{serial}/command`.
 */
export async function publishDeviceConfig(
  pool: DeviceConfigSource & { isActive?: boolean },
): Promise<PublishDeviceConfigResult> {
  const payload = buildDeviceConfigPayload(pool);
  const simonikaPayload = buildSimonikaConfigPayload(pool);
  const topic = `devices/${payload.serial}/command`;
  const simonikaTopic = `simonika/${payload.serial}/config`;

  await ensureMqttConnected(2500).catch(() => undefined);
  await Promise.all([
    publishMqtt(simonikaTopic, simonikaPayload, { qos: 1, retain: true }),
    publishMqtt(topic, payload, { qos: 1, retain: true }),
  ]);

  // Kompatibilitas Firmware v1
  const status = getDeviceStatus(payload.serial);
  if (status && "jarakDasar" in status && !("configReady" in status) && pool.kedalaman > 0) {
    const jarakDasar = Math.max(5, Math.min(400, Math.round(pool.jarakSensorDasar * 10) / 10));
    const batasBawah = Math.max(0, Math.min(95, Math.round((pool.batasIsiMulai / pool.kedalaman) * 1000) / 10));
    const batasAtas = Math.max(batasBawah + 5, Math.min(100, Math.round((pool.batasBuangMulai / pool.kedalaman) * 1000) / 10));
    const rawHyst = Math.round(((pool.batasIsiBerhenti - pool.batasIsiMulai) / pool.kedalaman) * 1000) / 10;
    const maxHyst = Math.max(0, Math.floor(((batasAtas - batasBawah - 0.2) / 2) * 10) / 10);
    const hysteresis = Math.max(0, Math.min(10, maxHyst, rawHyst));
    await publishMqtt(
      topic,
      {
        serial: payload.serial,
        modeAuto: pool.modeAuto,
        isActive: pool.isActive ?? true,
        jarakDasar,
        batasBawah,
        batasAtas,
        hysteresis,
      },
      { qos: 1, retain: true },
    ).catch(() => undefined);
  }

  return { topic, simonikaTopic, payload, simonikaPayload };
}

export function getMqttConnectionStatus(): boolean {
  return global.simonikaMqttClient?.connected ?? false;
}
