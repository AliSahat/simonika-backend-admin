export type WaterControlConfig = {
  kedalaman: number;
  jarakSensorDasar: number;
  batasIsiMulai: number;
  batasIsiBerhenti: number;
  batasBuangMulai: number;
  batasBuangBerhenti: number;
  modeAuto: boolean;
};

const asNumber = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function parseWaterControlConfig(
  input: Record<string, unknown>,
): { config?: WaterControlConfig; error?: string } {
  const kedalaman = asNumber(input.kedalaman);
  const jarakSensorDasar =
    asNumber(input.jarakSensorDasar) ?? kedalaman;
  const batasIsiMulai =
    asNumber(input.batasIsiMulai) ?? asNumber(input.keranBuka);
  const batasIsiBerhenti =
    asNumber(input.batasIsiBerhenti) ?? asNumber(input.keranTutup);
  const batasBuangBerhenti =
    asNumber(input.batasBuangBerhenti) ?? asNumber(input.keranNormal);
  const batasBuangMulai =
    asNumber(input.batasBuangMulai) ?? asNumber(input.pembuanganBatasBuka);
  const modeAuto = input.modeAuto === undefined ? true : Boolean(input.modeAuto);

  const required = {
    kedalaman,
    jarakSensorDasar,
    batasIsiMulai,
    batasIsiBerhenti,
    batasBuangMulai,
    batasBuangBerhenti,
  };

  for (const [key, value] of Object.entries(required)) {
    if (value === null) {
      return { error: `${key} wajib berupa angka` };
    }
  }

  const config = {
    kedalaman: kedalaman as number,
    jarakSensorDasar: jarakSensorDasar as number,
    batasIsiMulai: batasIsiMulai as number,
    batasIsiBerhenti: batasIsiBerhenti as number,
    batasBuangMulai: batasBuangMulai as number,
    batasBuangBerhenti: batasBuangBerhenti as number,
    modeAuto,
  };

  if (config.kedalaman <= 0) {
    return { error: "Kedalaman wadah harus lebih dari 0 cm" };
  }

  if (config.jarakSensorDasar < config.kedalaman) {
    return {
      error:
        "Jarak sensor ke dasar tidak boleh lebih kecil dari kedalaman wadah",
    };
  }

  const thresholds = [
    config.batasIsiMulai,
    config.batasBuangBerhenti,
    config.batasIsiBerhenti,
    config.batasBuangMulai,
  ];

  if (thresholds.some((value) => value < 0 || value > config.kedalaman)) {
    return {
      error: "Semua ambang harus berada di antara 0 cm dan kedalaman wadah",
    };
  }

  if (
    !(
      config.batasIsiMulai <
        config.batasBuangBerhenti &&
      config.batasBuangBerhenti <
        config.batasIsiBerhenti &&
      config.batasIsiBerhenti <
        config.batasBuangMulai
    )
  ) {
    return {
      error:
        "Urutan ambang harus: isi mulai < buang berhenti < isi berhenti < buang mulai",
    };
  }

  return { config };
}

export function buildDeviceConfigPayload(
  serial: string,
  config: WaterControlConfig,
) {
  return {
    type: "water-control-config",
    version: 1,
    serial,
    modeAuto: config.modeAuto,
    tankDepthCm: config.kedalaman,
    sensorToBottomCm: config.jarakSensorDasar,
    fillStartCm: config.batasIsiMulai,
    fillStopCm: config.batasIsiBerhenti,
    drainStartCm: config.batasBuangMulai,
    drainStopCm: config.batasBuangBerhenti,
  };
}
