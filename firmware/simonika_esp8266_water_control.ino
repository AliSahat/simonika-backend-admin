/*
  SIMONIKA - ESP8266 water-level controller
  Sensor : HY-SRF05 / HC-SR04 compatible
  Board  : NodeMCU ESP8266

  IMPORTANT:
  HY-SRF05 ECHO is typically 5V. Use a voltage divider / level shifter
  before connecting ECHO to an ESP8266 GPIO (3.3V max).

  MQTT topics:
    telemetry : devices/<SERIAL>/data
    command   : devices/<SERIAL>/command

  Required libraries:
    PubSubClient
    ArduinoJson
*/

#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ---------- USER CONFIG ----------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* MQTT_HOST = "s1.eu.hivemq.cloud";
const uint16_t MQTT_PORT = 8883;
const char* MQTT_USERNAME = "YOUR_MQTT_USERNAME";
const char* MQTT_PASSWORD = "YOUR_MQTT_PASSWORD";

const char* DEVICE_SERIAL = "00e5b570";

// NodeMCU pin mapping
const uint8_t PIN_TRIG = D1;        // GPIO5
const uint8_t PIN_ECHO = D2;        // GPIO4 (through level shifter/divider)
const uint8_t PIN_FILL_RELAY = D5;  // GPIO14
const uint8_t PIN_DRAIN_RELAY = D6; // GPIO12

// Most relay modules used with NodeMCU are active LOW.
// Change to false if your module is active HIGH.
const bool RELAY_ACTIVE_LOW = true;

// ---------- WATER CONFIG ----------
struct WaterConfig {
  float tankDepthCm = 100.0f;
  float sensorToBottomCm = 100.0f;
  float fillStartCm = 30.0f;
  float fillStopCm = 90.0f;
  float drainStartCm = 95.0f;
  float drainStopCm = 75.0f;
  bool modeAuto = true;
};

WaterConfig config;

enum ControlState {
  STATE_IDLE,
  STATE_FILLING,
  STATE_DRAINING,
  STATE_MANUAL,
  STATE_FAULT
};

ControlState controlState = STATE_IDLE;
bool fillValveOpen = false;
bool drainValveOpen = false;
bool sensorValid = false;

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

String telemetryTopic;
String commandTopic;

unsigned long lastTelemetryMs = 0;
unsigned long lastSensorMs = 0;
float lastDistanceCm = NAN;
float lastWaterLevelCm = NAN;
uint32_t sequenceNumber = 0;

const unsigned long SENSOR_INTERVAL_MS = 1000;
const unsigned long TELEMETRY_INTERVAL_MS = 5000;

// ---------- HELPERS ----------
const char* stateName(ControlState state) {
  switch (state) {
    case STATE_IDLE: return "IDLE";
    case STATE_FILLING: return "FILLING";
    case STATE_DRAINING: return "DRAINING";
    case STATE_MANUAL: return "MANUAL";
    case STATE_FAULT: return "FAULT";
  }
  return "FAULT";
}

void writeRelay(uint8_t pin, bool active) {
  const uint8_t onLevel = RELAY_ACTIVE_LOW ? LOW : HIGH;
  const uint8_t offLevel = RELAY_ACTIVE_LOW ? HIGH : LOW;
  digitalWrite(pin, active ? onLevel : offLevel);
}

void applyValves(bool fillOpen, bool drainOpen) {
  // Hard safety interlock: inlet and outlet can never be ON together.
  if (fillOpen && drainOpen) {
    fillOpen = false;
    drainOpen = false;
    controlState = STATE_FAULT;
  }

  fillValveOpen = fillOpen;
  drainValveOpen = drainOpen;

  writeRelay(PIN_FILL_RELAY, fillValveOpen);
  writeRelay(PIN_DRAIN_RELAY, drainValveOpen);
}

void stopAllValves() {
  applyValves(false, false);
}

bool configIsValid(const WaterConfig& value) {
  if (value.tankDepthCm <= 0) return false;
  if (value.sensorToBottomCm < value.tankDepthCm) return false;

  if (value.fillStartCm < 0 ||
      value.drainStopCm < 0 ||
      value.fillStopCm < 0 ||
      value.drainStartCm < 0) {
    return false;
  }

  if (value.fillStartCm > value.tankDepthCm ||
      value.drainStopCm > value.tankDepthCm ||
      value.fillStopCm > value.tankDepthCm ||
      value.drainStartCm > value.tankDepthCm) {
    return false;
  }

  return value.fillStartCm < value.drainStopCm &&
         value.drainStopCm < value.fillStopCm &&
         value.fillStopCm < value.drainStartCm;
}

// ---------- SENSOR ----------
float readDistanceOnceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  const unsigned long duration = pulseIn(PIN_ECHO, HIGH, 30000UL);
  if (duration == 0) return NAN;

  const float distance = duration * 0.0343f / 2.0f;
  if (distance < 2.0f || distance > 450.0f) return NAN;
  return distance;
}

float readFilteredDistanceCm() {
  float samples[5];
  uint8_t count = 0;

  for (uint8_t i = 0; i < 5; i++) {
    const float reading = readDistanceOnceCm();
    if (!isnan(reading)) {
      samples[count++] = reading;
    }
    delay(20);
    yield();
  }

  if (count < 3) return NAN;

  // Small insertion sort; median is resistant to ultrasonic spikes.
  for (uint8_t i = 1; i < count; i++) {
    float key = samples[i];
    int8_t j = i - 1;
    while (j >= 0 && samples[j] > key) {
      samples[j + 1] = samples[j];
      j--;
    }
    samples[j + 1] = key;
  }

  return samples[count / 2];
}

float calculateWaterLevelCm(float distanceCm) {
  float level = config.sensorToBottomCm - distanceCm;
  if (level < 0) level = 0;
  if (level > config.tankDepthCm) level = config.tankDepthCm;
  return level;
}

// ---------- AUTOMATIC CONTROL ----------
// This is hysteresis/state-machine control:
// - Once filling starts at fillStart, it remains ON until fillStop.
// - Once draining starts at drainStart, it remains ON until drainStop.
void runAutomaticControl(float waterLevelCm) {
  if (!config.modeAuto) {
    if (controlState != STATE_MANUAL) {
      controlState = STATE_MANUAL;
      stopAllValves();
    }
    return;
  }

  if (!sensorValid) {
    controlState = STATE_FAULT;
    stopAllValves();
    return;
  }

  switch (controlState) {
    case STATE_FILLING:
      if (waterLevelCm >= config.fillStopCm) {
        controlState = STATE_IDLE;
        stopAllValves();
      } else {
        applyValves(true, false);
      }
      break;

    case STATE_DRAINING:
      if (waterLevelCm <= config.drainStopCm) {
        controlState = STATE_IDLE;
        stopAllValves();
      } else {
        applyValves(false, true);
      }
      break;

    case STATE_IDLE:
    case STATE_MANUAL:
    case STATE_FAULT:
    default:
      stopAllValves();

      if (waterLevelCm <= config.fillStartCm) {
        controlState = STATE_FILLING;
        applyValves(true, false);
      } else if (waterLevelCm >= config.drainStartCm) {
        controlState = STATE_DRAINING;
        applyValves(false, true);
      } else {
        controlState = STATE_IDLE;
      }
      break;
  }
}

// ---------- MQTT ----------
void publishTelemetry() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc;
  doc["serial"] = DEVICE_SERIAL;
  doc["waterLevel"] = sensorValid ? lastWaterLevelCm : nullptr;
  doc["distance"] = sensorValid ? lastDistanceCm : nullptr;
  doc["sensorValid"] = sensorValid;
  doc["fillValveOpen"] = fillValveOpen;
  doc["drainValveOpen"] = drainValveOpen;
  doc["controlState"] = stateName(controlState);
  doc["modeAuto"] = config.modeAuto;
  doc["uptimeMs"] = millis();
  doc["sequence"] = ++sequenceNumber;

  JsonObject limits = doc.createNestedObject("limits");
  limits["tankDepthCm"] = config.tankDepthCm;
  limits["sensorToBottomCm"] = config.sensorToBottomCm;
  limits["fillStartCm"] = config.fillStartCm;
  limits["fillStopCm"] = config.fillStopCm;
  limits["drainStartCm"] = config.drainStartCm;
  limits["drainStopCm"] = config.drainStopCm;

  char buffer[512];
  const size_t length = serializeJson(doc, buffer, sizeof(buffer));
  mqttClient.publish(telemetryTopic.c_str(), buffer, length, false);
}

void applyConfigMessage(JsonDocument& doc) {
  WaterConfig next = config;

  if (doc["tankDepthCm"].is<float>() || doc["tankDepthCm"].is<int>())
    next.tankDepthCm = doc["tankDepthCm"].as<float>();
  if (doc["sensorToBottomCm"].is<float>() || doc["sensorToBottomCm"].is<int>())
    next.sensorToBottomCm = doc["sensorToBottomCm"].as<float>();
  if (doc["fillStartCm"].is<float>() || doc["fillStartCm"].is<int>())
    next.fillStartCm = doc["fillStartCm"].as<float>();
  if (doc["fillStopCm"].is<float>() || doc["fillStopCm"].is<int>())
    next.fillStopCm = doc["fillStopCm"].as<float>();
  if (doc["drainStartCm"].is<float>() || doc["drainStartCm"].is<int>())
    next.drainStartCm = doc["drainStartCm"].as<float>();
  if (doc["drainStopCm"].is<float>() || doc["drainStopCm"].is<int>())
    next.drainStopCm = doc["drainStopCm"].as<float>();
  if (doc["modeAuto"].is<bool>())
    next.modeAuto = doc["modeAuto"].as<bool>();

  if (!configIsValid(next)) {
    Serial.println("Rejected invalid water-control configuration");
    return;
  }

  config = next;
  controlState = config.modeAuto ? STATE_IDLE : STATE_MANUAL;
  stopAllValves();
  Serial.println("Water-control configuration updated");
}

void applyManualMessage(JsonDocument& doc) {
  if (config.modeAuto) return;

  const bool fill = doc["fillValveOpen"] | false;
  const bool drain = doc["drainValveOpen"] | false;

  controlState = STATE_MANUAL;
  applyValves(fill, drain);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<768> doc;
  const DeserializationError error = deserializeJson(doc, payload, length);
  if (error) {
    Serial.println("Invalid MQTT JSON");
    return;
  }

  const char* targetSerial = doc["serial"] | "";
  if (strlen(targetSerial) > 0 && String(targetSerial) != DEVICE_SERIAL) return;

  const char* type = doc["type"] | "water-control-config";

  if (strcmp(type, "water-control-config") == 0) {
    applyConfigMessage(doc);
  } else if (strcmp(type, "manual-control") == 0) {
    applyManualMessage(doc);
  }

  publishTelemetry();
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    yield();
  }
  Serial.println();
  Serial.print("WiFi connected: ");
  Serial.println(WiFi.localIP());
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    String clientId = "simonika-" + String(DEVICE_SERIAL) + "-" + String(ESP.getChipId(), HEX);

    Serial.print("Connecting MQTT...");
    if (mqttClient.connect(
          clientId.c_str(),
          MQTT_USERNAME,
          MQTT_PASSWORD
        )) {
      Serial.println("connected");
      mqttClient.subscribe(commandTopic.c_str(), 1);
      publishTelemetry();
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      delay(3000);
    }
    yield();
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_FILL_RELAY, OUTPUT);
  pinMode(PIN_DRAIN_RELAY, OUTPUT);
  stopAllValves();

  telemetryTopic = "devices/" + String(DEVICE_SERIAL) + "/data";
  commandTopic = "devices/" + String(DEVICE_SERIAL) + "/command";

  connectWiFi();

  // Development-friendly TLS. For production, install the HiveMQ CA certificate
  // with secureClient.setTrustAnchors(...) instead of setInsecure().
  secureClient.setInsecure();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(1024);

  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  const unsigned long now = millis();

  if (now - lastSensorMs >= SENSOR_INTERVAL_MS) {
    lastSensorMs = now;

    const float distance = readFilteredDistanceCm();
    sensorValid = !isnan(distance);

    if (sensorValid) {
      lastDistanceCm = distance;
      lastWaterLevelCm = calculateWaterLevelCm(distance);
      runAutomaticControl(lastWaterLevelCm);
    } else {
      lastDistanceCm = NAN;
      lastWaterLevelCm = NAN;
      controlState = STATE_FAULT;
      stopAllValves();
    }
  }

  if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = now;
    publishTelemetry();
  }

  yield();
}
