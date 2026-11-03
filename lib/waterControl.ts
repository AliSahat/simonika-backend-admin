export const WATER_CONTROL_STATES = [
  "IDLE",
  "FILLING",
  "DRAINING",
  "MANUAL",
  "FAULT",
] as const;

export type WaterControlState = (typeof WATER_CONTROL_STATES)[number];

export interface WaterControlConfig {
  kedalaman: number;
  jarakSensorDasar: number;
  batasIsiMulai: number;
  batasIsiBerhenti: number;
  batasBuangMulai: number;
  batasBuangBerhenti: number;
}

export interface ContainerThresholdInput {
  max_depth?: unknown;
  sensor_to_bottom?: unknown;
  fill_start?: unknown;
  fill_stop?: unknown;
  drain_start?: unknown;
  drain_stop?: unknown;
  kedalaman?: unknown;
  jarakSensorDasar?: unknown;
  batasIsiMulai?: unknown;
  batasIsiBerhenti?: unknown;
  batasBuangMulai?: unknown;
  batasBuangBerhenti?: unknown;
}

export interface PoolConfigInput extends WaterControlConfig {
  serial: string;
  namaWadah: string;
  modeAuto: boolean;
  isActive?: boolean;
}

export class ConfigValidationError extends Error {}

const numericLabels: Record<keyof WaterControlConfig, string> = {
  kedalaman: "Kedalaman wadah (max_depth)",
  jarakSensorDasar: "Jarak sensor ke dasar (sensor_to_bottom)",
  batasIsiMulai: "Batas isi mulai (fill_start)",
  batasIsiBerhenti: "Batas isi berhenti (fill_stop)",
  batasBuangMulai: "Batas buang mulai (drain_start)",
  batasBuangBerhenti: "Batas buang berhenti (drain_stop)",
};

export function normalizeSerial(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ConfigValidationError("Serial / device_id perangkat wajib diisi");
  }
  const serial = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(serial)) {
    throw new ConfigValidationError(
      "Format serial tidak valid; gunakan 3-64 karakter huruf, angka, garis bawah, atau tanda hubung",
    );
  }
  return serial;
}

/**
 * Menormalisasi input konfigurasi baik dari format snake_case
 * (max_depth, fill_start, fill_stop, drain_start, drain_stop, sensor_to_bottom)
 * maupun format existing (kedalaman, batasIsiMulai, dst).
 */
export function mapThresholdInputToWaterControl(
  raw: Record<string, unknown>,
  fallbackSensorToBottom?: number,
): Record<keyof WaterControlConfig, unknown> {
  const kedalaman = raw.kedalaman !== undefined ? raw.kedalaman : raw.max_depth;
  const batasIsiMulai = raw.batasIsiMulai !== undefined ? raw.batasIsiMulai : raw.fill_start;
  const batasIsiBerhenti = raw.batasIsiBerhenti !== undefined ? raw.batasIsiBerhenti : raw.fill_stop;
  const batasBuangMulai = raw.batasBuangMulai !== undefined ? raw.batasBuangMulai : raw.drain_start;
  const batasBuangBerhenti = raw.batasBuangBerhenti !== undefined ? raw.batasBuangBerhenti : raw.drain_stop;

  let jarakSensorDasar =
    raw.jarakSensorDasar !== undefined ? raw.jarakSensorDasar : raw.sensor_to_bottom;

  if (jarakSensorDasar === undefined) {
    if (typeof fallbackSensorToBottom === "number" && Number.isFinite(fallbackSensorToBottom) && fallbackSensorToBottom > 0) {
      jarakSensorDasar = fallbackSensorToBottom;
    } else if (typeof kedalaman === "number" && Number.isFinite(kedalaman) && kedalaman > 0) {
      jarakSensorDasar = kedalaman + 5;
    }
  }

  return {
    kedalaman,
    jarakSensorDasar,
    batasIsiMulai,
    batasIsiBerhenti,
    batasBuangMulai,
    batasBuangBerhenti,
  };
}

/**
 * Validasi ketat hierarki 5 parameter batas air:
 * Rumus mutlak: 0 < fill_start < drain_stop < fill_stop < drain_start < max_depth
 */
export function validateWaterControlConfig(
  value: Record<string, unknown> | WaterControlConfig,
): WaterControlConfig {
  const normalizedInput = mapThresholdInputToWaterControl(value as Record<string, unknown>);
  const config = {} as WaterControlConfig;

  for (const field of Object.keys(numericLabels) as (keyof WaterControlConfig)[]) {
    const current = normalizedInput[field];
    if (typeof current !== "number" || !Number.isFinite(current)) {
      throw new ConfigValidationError(`${numericLabels[field]} harus berupa angka yang valid`);
    }
    if (current <= 0) {
      throw new ConfigValidationError(
        `${numericLabels[field]} harus berupa angka positif lebih besar dari 0 (diterima: ${current})`,
      );
    }
    config[field] = current;
  }

  const thresholds: (keyof WaterControlConfig)[] = [
    "batasIsiMulai",
    "batasBuangBerhenti",
    "batasIsiBerhenti",
    "batasBuangMulai",
  ];
  for (const field of thresholds) {
    if (config[field] >= config.kedalaman) {
      throw new ConfigValidationError(
        `Urutan ambang level air tidak valid: ${numericLabels[field]} (${config[field]} cm) tidak boleh melebihi atau sama dengan kedalaman wadah / max_depth (${config.kedalaman} cm). Rumus wajib: 0 < fill_start < drain_stop < fill_stop < drain_start < max_depth`,
      );
    }
  }

  if (config.batasIsiMulai >= config.batasBuangBerhenti) {
    throw new ConfigValidationError(
      `Urutan ambang level air tidak valid: fill_start (${config.batasIsiMulai} cm) harus lebih kecil dari drain_stop (${config.batasBuangBerhenti} cm). Rumus wajib: 0 < fill_start < drain_stop < fill_stop < drain_start < max_depth`,
    );
  }

  if (config.batasBuangBerhenti >= config.batasIsiBerhenti) {
    throw new ConfigValidationError(
      `Urutan ambang level air tidak valid: drain_stop (${config.batasBuangBerhenti} cm) harus lebih kecil dari fill_stop (${config.batasIsiBerhenti} cm). Rumus wajib: 0 < fill_start < drain_stop < fill_stop < drain_start < max_depth`,
    );
  }

  if (config.batasIsiBerhenti >= config.batasBuangMulai) {
    throw new ConfigValidationError(
      `Urutan ambang level air tidak valid: fill_stop (${config.batasIsiBerhenti} cm) harus lebih kecil dari drain_start (${config.batasBuangMulai} cm). Rumus wajib: 0 < fill_start < drain_stop < fill_stop < drain_start < max_depth`,
    );
  }

  return config;
}

export function validatePoolConfig(value: Record<string, unknown>): PoolConfigInput {
  const serial = normalizeSerial(value.serial);
  if (typeof value.namaWadah !== "string" || !value.namaWadah.trim()) {
    throw new ConfigValidationError("Nama wadah wajib diisi");
  }
  if (typeof value.modeAuto !== "boolean") {
    throw new ConfigValidationError("Mode otomatis harus berupa boolean");
  }
  if (value.isActive !== undefined && typeof value.isActive !== "boolean") {
    throw new ConfigValidationError("Status aktif harus berupa boolean");
  }

  return {
    serial,
    namaWadah: value.namaWadah.trim(),
    ...validateWaterControlConfig(value),
    modeAuto: value.modeAuto,
    ...(value.isActive === undefined ? {} : { isActive: value.isActive }),
  };
}

export function isWaterControlState(value: unknown): value is WaterControlState {
  return WATER_CONTROL_STATES.includes(value as WaterControlState);
}

export interface ParsedTelemetry {
  topicSerial: string;
  waterLevel?: number;
  distance?: number;
  timestamp?: number;
  uptimeMs?: number;
  sequence?: number;
  sensorValid: boolean;
  fillValveOpen: boolean;
  drainValveOpen: boolean;
  controlState: WaterControlState;
}

function finiteOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || value === null || (typeof value === "number" && Number.isFinite(value));
}

function toOptionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function deriveControlState(
  rawState: unknown,
  sensorValid: boolean,
  fillValveOpen: boolean,
  drainValveOpen: boolean,
  modeAuto: unknown,
  runLimitFault: unknown,
): WaterControlState {
  if (isWaterControlState(rawState)) return rawState;
  if (!sensorValid || runLimitFault === true) return "FAULT";
  if (modeAuto === false) return "MANUAL";
  if (fillValveOpen) return "FILLING";
  if (drainValveOpen) return "DRAINING";
  return "IDLE";
}

export function parseTelemetryPayload(
  topic: string,
  message: Buffer | string,
  cachedStatus?: Record<string, unknown>,
): ParsedTelemetry | null {
  const match = /^(?:devices\/([^/]+)\/data|simonika\/([^/]+)\/telemetry)$/.exec(topic);
  if (!match) return null;
  const topicSerial = normalizeSerial(match[1] ?? match[2]);
  const payload = JSON.parse(typeof message === "string" ? message : message.toString()) as Record<string, unknown>;

  const rawSerial = payload.serial !== undefined ? payload.serial : payload.device_id;
  if (rawSerial !== undefined && normalizeSerial(rawSerial) !== topicSerial) {
    throw new Error("Serial payload telemetry tidak sesuai dengan topic");
  }

  if (
    !finiteOptionalNumber(payload.timestamp) ||
    !finiteOptionalNumber(payload.uptimeMs) ||
    !finiteOptionalNumber(payload.sequence)
  ) {
    throw new Error("Payload telemetry tidak valid atau tidak lengkap");
  }

  const rawWaterLevel = payload.waterLevel !== undefined ? payload.waterLevel : payload.water_level;
  const rawDistance = payload.distance !== undefined ? payload.distance : payload.sensor_distance;
  const rawSensorValid =
    payload.sensorValid !== undefined
      ? payload.sensorValid
      : payload.sensor_valid !== undefined
        ? payload.sensor_valid
        : payload.inlet_valve !== undefined || payload.outlet_valve !== undefined || payload.system_state !== undefined
          ? true
          : undefined;
  const rawFillValve = payload.fillValveOpen !== undefined ? payload.fillValveOpen : payload.inlet_valve;
  const rawDrainValve = payload.drainValveOpen !== undefined ? payload.drainValveOpen : payload.outlet_valve;
  const rawControlState = payload.controlState !== undefined ? payload.controlState : payload.system_state;

  const hasV2Fields =
    typeof rawSensorValid === "boolean" ||
    typeof rawFillValve === "boolean" ||
    typeof rawDrainValve === "boolean" ||
    rawControlState !== undefined;

  const waterLevel = toOptionalFiniteNumber(rawWaterLevel);
  const distance = toOptionalFiniteNumber(rawDistance);

  if (hasV2Fields) {
    if (
      typeof rawSensorValid !== "boolean" ||
      typeof rawFillValve !== "boolean" ||
      typeof rawDrainValve !== "boolean" ||
      !isWaterControlState(rawControlState)
    ) {
      throw new Error("Payload telemetry tidak valid atau tidak lengkap");
    }
    if (rawSensorValid && (waterLevel === undefined || distance === undefined)) {
      throw new Error("waterLevel dan distance telemetry harus berupa angka finite saat sensorValid=true");
    }
    if (
      (rawWaterLevel !== null && rawWaterLevel !== undefined && waterLevel === undefined) ||
      (rawDistance !== null && rawDistance !== undefined && distance === undefined)
    ) {
      throw new Error("waterLevel dan distance telemetry harus berupa angka finite atau null");
    }

    return {
      topicSerial,
      ...(waterLevel === undefined ? {} : { waterLevel }),
      ...(distance === undefined ? {} : { distance }),
      timestamp: toOptionalFiniteNumber(payload.timestamp),
      uptimeMs: toOptionalFiniteNumber(payload.uptimeMs),
      sequence: toOptionalFiniteNumber(payload.sequence),
      sensorValid: rawSensorValid,
      fillValveOpen: rawFillValve,
      drainValveOpen: rawDrainValve,
      controlState: rawControlState,
    };
  }

  if (waterLevel === undefined || distance === undefined) {
    throw new Error("waterLevel dan distance telemetry harus berupa angka finite");
  }

  const sensorValid =
    typeof payload.sensorOk === "boolean"
      ? payload.sensorOk
      : typeof cachedStatus?.sensorOk === "boolean"
        ? cachedStatus.sensorOk
        : true;
  const fillValveOpen =
    typeof payload.kranIsi === "boolean"
      ? payload.kranIsi
      : typeof cachedStatus?.kranIsi === "boolean"
        ? cachedStatus.kranIsi
        : false;
  const drainValveOpen =
    typeof payload.kranBuang === "boolean"
      ? payload.kranBuang
      : typeof cachedStatus?.kranBuang === "boolean"
        ? cachedStatus.kranBuang
        : false;
  const modeAuto = payload.modeAuto ?? cachedStatus?.modeAuto;
  const runLimitFault = payload.runLimitFault ?? cachedStatus?.runLimitFault;

  return {
    topicSerial,
    waterLevel,
    distance,
    timestamp: toOptionalFiniteNumber(payload.timestamp),
    uptimeMs: toOptionalFiniteNumber(payload.uptimeMs),
    sequence: toOptionalFiniteNumber(payload.sequence),
    sensorValid,
    fillValveOpen,
    drainValveOpen,
    controlState: deriveControlState(
      rawControlState,
      sensorValid,
      fillValveOpen,
      drainValveOpen,
      modeAuto,
      runLimitFault,
    ),
  };
}

export interface TelemetryThrottleSnapshot {
  savedAtMs: number;
  controlState: WaterControlState;
  fillValveOpen: boolean;
  drainValveOpen: boolean;
  sensorValid: boolean;
}

export const DEFAULT_TELEMETRY_THROTTLE_MS = 15_000;

/**
 * Menentukan apakah data telemetry perlu disimpan ke database:
 * - Simpan langsung jika belum pernah disimpan
 * - Simpan langsung jika terjadi perubahan state machine atau status kran/sensor (IDLE <-> FILLING <-> DRAINING <-> FAULT)
 * - Simpan jika sudah melewati interval throttling (default 15 detik)
 */
export function shouldPersistTelemetry(
  previous: TelemetryThrottleSnapshot | undefined,
  current: Pick<ParsedTelemetry, "controlState" | "fillValveOpen" | "drainValveOpen" | "sensorValid">,
  nowMs: number,
  intervalMs: number = DEFAULT_TELEMETRY_THROTTLE_MS,
): boolean {
  if (!previous) return true;
  if (
    previous.controlState !== current.controlState ||
    previous.fillValveOpen !== current.fillValveOpen ||
    previous.drainValveOpen !== current.drainValveOpen ||
    previous.sensorValid !== current.sensorValid
  ) {
    return true;
  }
  return nowMs - previous.savedAtMs >= intervalMs;
}
