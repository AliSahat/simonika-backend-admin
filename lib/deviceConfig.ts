import type { WaterControlConfig } from "./waterControl.ts";
import { normalizeSerial, validateWaterControlConfig } from "./waterControl.ts";

export interface DeviceConfigSource extends WaterControlConfig {
  serial: string;
  modeAuto: boolean;
}

export interface DeviceConfigPayload {
  type: "water-control-config";
  version: 1;
  serial: string;
  modeAuto: boolean;
  tankDepthCm: number;
  sensorToBottomCm: number;
  fillStartCm: number;
  fillStopCm: number;
  drainStartCm: number;
  drainStopCm: number;
}

export interface SimonikaConfigPayload {
  device_id: string;
  max_depth: number;
  fill_start: number;
  fill_stop: number;
  drain_start: number;
  drain_stop: number;
  sensor_to_bottom: number;
  mode_auto: boolean;
}

export function buildDeviceConfigPayload(source: DeviceConfigSource): DeviceConfigPayload {
  const config = validateWaterControlConfig(source);
  if (typeof source.modeAuto !== "boolean") {
    throw new Error("Mode otomatis pada konfigurasi wadah tidak valid");
  }

  return {
    type: "water-control-config",
    version: 1,
    serial: normalizeSerial(source.serial),
    modeAuto: source.modeAuto,
    tankDepthCm: config.kedalaman,
    sensorToBottomCm: config.jarakSensorDasar,
    fillStartCm: config.batasIsiMulai,
    fillStopCm: config.batasIsiBerhenti,
    drainStartCm: config.batasBuangMulai,
    drainStopCm: config.batasBuangBerhenti,
  };
}

export function buildSimonikaConfigPayload(source: DeviceConfigSource): SimonikaConfigPayload {
  const config = validateWaterControlConfig(source);
  if (typeof source.modeAuto !== "boolean") {
    throw new Error("Mode otomatis pada konfigurasi wadah tidak valid");
  }

  return {
    device_id: normalizeSerial(source.serial),
    max_depth: config.kedalaman,
    fill_start: config.batasIsiMulai,
    fill_stop: config.batasIsiBerhenti,
    drain_start: config.batasBuangMulai,
    drain_stop: config.batasBuangBerhenti,
    sensor_to_bottom: config.jarakSensorDasar,
    mode_auto: source.modeAuto,
  };
}
