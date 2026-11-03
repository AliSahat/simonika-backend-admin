import assert from "node:assert/strict";
import test from "node:test";
import { buildDeviceConfigPayload, buildSimonikaConfigPayload } from "../lib/deviceConfig.ts";
import {
  DEFAULT_TELEMETRY_THROTTLE_MS,
  normalizeSerial,
  parseTelemetryPayload,
  shouldPersistTelemetry,
  validateWaterControlConfig,
} from "../lib/waterControl.ts";

const valid = {
  kedalaman: 100,
  jarakSensorDasar: 103,
  batasIsiMulai: 30,
  batasIsiBerhenti: 90,
  batasBuangMulai: 95,
  batasBuangBerhenti: 75,
};

test("menerima konfigurasi valid untuk ukuran wadah yang berbeda (camelCase & snake_case)", () => {
  assert.deepEqual(validateWaterControlConfig(valid), valid);
  assert.doesNotThrow(() => validateWaterControlConfig({
    kedalaman: 60, jarakSensorDasar: 64, batasIsiMulai: 15,
    batasBuangBerhenti: 40, batasIsiBerhenti: 50, batasBuangMulai: 57,
  }));
  assert.deepEqual(
    validateWaterControlConfig({
      max_depth: 100,
      sensor_to_bottom: 105,
      fill_start: 30,
      drain_stop: 75,
      fill_stop: 90,
      drain_start: 95,
    }),
    {
      kedalaman: 100,
      jarakSensorDasar: 105,
      batasIsiMulai: 30,
      batasBuangBerhenti: 75,
      batasIsiBerhenti: 90,
      batasBuangMulai: 95,
    },
  );
});

test("menolak nilai <= 0 dan memberikan pesan spesifik pada setiap pelanggaran hierarki", () => {
  assert.throws(
    () => validateWaterControlConfig({ ...valid, batasIsiMulai: 0 }),
    /angka positif lebih besar dari 0/,
  );
  assert.throws(
    () => validateWaterControlConfig({ ...valid, batasIsiMulai: 75 }),
    /fill_start \(75 cm\) harus lebih kecil dari drain_stop \(75 cm\)/,
  );
  assert.throws(
    () => validateWaterControlConfig({ ...valid, batasBuangBerhenti: 92 }),
    /drain_stop \(92 cm\) harus lebih kecil dari fill_stop \(90 cm\)/,
  );
  assert.throws(
    () => validateWaterControlConfig({ ...valid, batasBuangMulai: 80 }),
    /fill_stop \(90 cm\) harus lebih kecil dari drain_start \(80 cm\)/,
  );
  assert.throws(
    () => validateWaterControlConfig({ ...valid, batasBuangMulai: 100 }),
    /tidak boleh melebihi atau sama dengan kedalaman wadah/,
  );
  assert.throws(
    () => validateWaterControlConfig({ ...valid, batasBuangMulai: 120 }),
    /melebihi/,
  );
});

test("menolak angka non-finite dan serial yang dapat menyisipkan topic MQTT", () => {
  assert.throws(() => validateWaterControlConfig({ ...valid, kedalaman: Infinity }), /angka yang valid/);
  assert.throws(() => normalizeSerial("device/+/data"), /Format serial/);
});

test("membangun payload MQTT dengan mapping final (legacy & simonika)", () => {
  assert.deepEqual(buildDeviceConfigPayload({ serial: "00E5B570", modeAuto: true, ...valid }), {
    type: "water-control-config", version: 1, serial: "00e5b570", modeAuto: true,
    tankDepthCm: 100, sensorToBottomCm: 103, fillStartCm: 30,
    fillStopCm: 90, drainStartCm: 95, drainStopCm: 75,
  });

  assert.deepEqual(buildSimonikaConfigPayload({ serial: "00E5B570", modeAuto: true, ...valid }), {
    device_id: "00e5b570",
    max_depth: 100,
    fill_start: 30,
    fill_stop: 90,
    drain_start: 95,
    drain_stop: 75,
    sensor_to_bottom: 103,
    mode_auto: true,
  });
});

test("mem-parsing telemetry Firmware v2, topic simonika/{deviceId}/telemetry (snake_case), serta kompatibilitas Firmware v1", () => {
  const v2Valid = parseTelemetryPayload(
    "devices/00e5b570/data",
    JSON.stringify({
      serial: "00e5b570",
      waterLevel: 14.5,
      distance: 7.5,
      sensorValid: true,
      fillValveOpen: false,
      drainValveOpen: false,
      controlState: "IDLE",
      timestamp: 1793465000,
      uptimeMs: 50000,
      sequence: 10,
    }),
  );
  assert.equal(v2Valid?.topicSerial, "00e5b570");
  assert.equal(v2Valid?.waterLevel, 14.5);
  assert.equal(v2Valid?.controlState, "IDLE");

  const simonikaSnake = parseTelemetryPayload(
    "simonika/00e5b570/telemetry",
    JSON.stringify({
      device_id: "00e5b570",
      water_level: 28.4,
      sensor_distance: 74.6,
      inlet_valve: true,
      outlet_valve: false,
      system_state: "FILLING",
      timestamp: 1793465002,
      uptimeMs: 52000,
      sequence: 11,
    }),
  );
  assert.equal(simonikaSnake?.topicSerial, "00e5b570");
  assert.equal(simonikaSnake?.waterLevel, 28.4);
  assert.equal(simonikaSnake?.distance, 74.6);
  assert.equal(simonikaSnake?.fillValveOpen, true);
  assert.equal(simonikaSnake?.drainValveOpen, false);
  assert.equal(simonikaSnake?.controlState, "FILLING");

  const v2Fault = parseTelemetryPayload(
    "devices/00e5b570/data",
    JSON.stringify({
      serial: "00e5b570",
      waterLevel: null,
      distance: null,
      sensorValid: false,
      fillValveOpen: false,
      drainValveOpen: false,
      controlState: "FAULT",
      timestamp: 1793465005,
      uptimeMs: 55000,
      sequence: 11,
    }),
  );
  assert.equal(v2Fault?.sensorValid, false);
  assert.equal(v2Fault?.waterLevel, undefined);
  assert.equal(v2Fault?.controlState, "FAULT");

  const v1Compat = parseTelemetryPayload(
    "devices/00e5b570/data",
    JSON.stringify({
      serial: "00e5b570",
      waterLevel: 65.2,
      distance: 34.8,
      timestamp: 1793465010,
      uptimeMs: 60000,
      sequence: 12,
    }),
    { sensorOk: true, kranIsi: true, kranBuang: false, modeAuto: true },
  );
  assert.equal(v1Compat?.sensorValid, true);
  assert.equal(v1Compat?.fillValveOpen, true);
  assert.equal(v1Compat?.controlState, "FILLING");
});

test("mekanisme throttling telemetry: tahan di bawah 15 detik jika state sama, langsung simpan jika state/kran berubah", () => {
  const t0 = 1_000_000;
  const idleState = {
    controlState: "IDLE" as const,
    fillValveOpen: false,
    drainValveOpen: false,
    sensorValid: true,
  };

  // Data pertama selalu disimpan
  assert.equal(shouldPersistTelemetry(undefined, idleState, t0), true);

  const prevSnapshot = { savedAtMs: t0, ...idleState };

  // 5 detik kemudian, state masih IDLE -> ditahan (false)
  assert.equal(shouldPersistTelemetry(prevSnapshot, idleState, t0 + 5_000), false);

  // 7 detik kemudian, state berubah ke FILLING -> langsung disimpan (true) meskipun belum 15 detik!
  assert.equal(
    shouldPersistTelemetry(
      prevSnapshot,
      { ...idleState, controlState: "FILLING", fillValveOpen: true },
      t0 + 7_000,
    ),
    true,
  );

  // 15 detik kemudian, state masih IDLE -> disimpan (true)
  assert.equal(
    shouldPersistTelemetry(prevSnapshot, idleState, t0 + DEFAULT_TELEMETRY_THROTTLE_MS),
    true,
  );
});
