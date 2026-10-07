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
