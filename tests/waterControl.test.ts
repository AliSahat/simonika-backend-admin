import assert from "node:assert/strict";
import test from "node:test";
import { buildDeviceConfigPayload } from "../lib/deviceConfig.ts";
import { normalizeSerial, validateWaterControlConfig } from "../lib/waterControl.ts";

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
