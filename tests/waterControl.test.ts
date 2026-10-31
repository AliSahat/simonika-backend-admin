import assert from "node:assert/strict";
import test from "node:test";
import { buildDeviceConfigPayload } from "../lib/deviceConfig.ts";
import { normalizeSerial, parseTelemetryPayload, validateWaterControlConfig } from "../lib/waterControl.ts";

const valid = {
  kedalaman: 100,
  jarakSensorDasar: 103,
  batasIsiMulai: 30,
  batasIsiBerhenti: 90,
  batasBuangMulai: 95,
  batasBuangBerhenti: 75,
};

test("menerima konfigurasi valid untuk ukuran wadah yang berbeda", () => {
  assert.deepEqual(validateWaterControlConfig(valid), valid);
  assert.doesNotThrow(() => validateWaterControlConfig({
    kedalaman: 60, jarakSensorDasar: 64, batasIsiMulai: 15,
    batasBuangBerhenti: 40, batasIsiBerhenti: 50, batasBuangMulai: 57,
  }));
});

test("menolak ambang yang melebihi kedalaman", () => {
  assert.throws(() => validateWaterControlConfig({ ...valid, batasBuangMulai: 120 }), /melebihi kedalaman/);
});

test("menolak urutan ambang yang salah", () => {
  assert.throws(() => validateWaterControlConfig({ ...valid, batasBuangMulai: 80 }), /Urutan ambang/);
});

test("menolak angka non-finite dan serial yang dapat menyisipkan topic MQTT", () => {
  assert.throws(() => validateWaterControlConfig({ ...valid, kedalaman: Infinity }), /angka yang valid/);
  assert.throws(() => normalizeSerial("device/+/data"), /Format serial/);
});

test("membangun payload MQTT dengan mapping final", () => {
  assert.deepEqual(buildDeviceConfigPayload({ serial: "00E5B570", modeAuto: true, ...valid }), {
    type: "water-control-config", version: 1, serial: "00e5b570", modeAuto: true,
    tankDepthCm: 100, sensorToBottomCm: 103, fillStartCm: 30,
    fillStopCm: 90, drainStartCm: 95, drainStopCm: 75,
  });
});

test("mem-parsing telemetry Firmware v2 (valid dan fault/null) serta kompatibilitas Firmware v1", () => {
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
