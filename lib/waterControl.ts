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

export interface PoolConfigInput extends WaterControlConfig {
  serial: string;
  namaWadah: string;
  modeAuto: boolean;
  isActive?: boolean;
}

export class ConfigValidationError extends Error {}

const numericLabels: Record<keyof WaterControlConfig, string> = {
  kedalaman: "Kedalaman",
  jarakSensorDasar: "Jarak sensor ke dasar",
  batasIsiMulai: "Batas isi mulai",
  batasIsiBerhenti: "Batas isi berhenti",
  batasBuangMulai: "Batas buang mulai",
  batasBuangBerhenti: "Batas buang berhenti",
};

export function normalizeSerial(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ConfigValidationError("Serial perangkat wajib diisi");
  }
  const serial = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(serial)) {
    throw new ConfigValidationError(
      "Format serial tidak valid; gunakan 3-64 karakter huruf, angka, garis bawah, atau tanda hubung",
    );
  }
  return serial;
}

export function validateWaterControlConfig(
  value: Record<string, unknown> | WaterControlConfig,
): WaterControlConfig {
  const config = {} as WaterControlConfig;

  for (const field of Object.keys(numericLabels) as (keyof WaterControlConfig)[]) {
    const current = value[field];
    if (typeof current !== "number" || !Number.isFinite(current)) {
      throw new ConfigValidationError(`${numericLabels[field]} harus berupa angka yang valid`);
    }
    if (current < 0) {
      throw new ConfigValidationError(`${numericLabels[field]} tidak boleh negatif`);
    }
    config[field] = current;
  }

  if (config.kedalaman <= 0) {
    throw new ConfigValidationError("Kedalaman harus lebih besar dari nol");
  }
  if (config.jarakSensorDasar <= 0) {
    throw new ConfigValidationError("Jarak sensor ke dasar harus lebih besar dari nol");
  }

  const thresholds: (keyof WaterControlConfig)[] = [
    "batasIsiMulai",
    "batasIsiBerhenti",
    "batasBuangMulai",
    "batasBuangBerhenti",
  ];
  for (const field of thresholds) {
    if (config[field] > config.kedalaman) {
      throw new ConfigValidationError(
        `${numericLabels[field]} tidak boleh melebihi kedalaman wadah`,
      );
    }
  }

  if (
    !(
      config.batasIsiMulai < config.batasBuangBerhenti &&
      config.batasBuangBerhenti < config.batasIsiBerhenti &&
      config.batasIsiBerhenti < config.batasBuangMulai
    )
  ) {
    throw new ConfigValidationError("Urutan ambang level air tidak valid");
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
