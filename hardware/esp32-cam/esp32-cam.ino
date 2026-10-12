#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ESP32QRCodeReader.h>
#include <esp_system.h>
#include <time.h>
#include "secrets.h"

// AI Thinker board with PSRAM. Read README.md before installing the decoder.
ESP32QRCodeReader reader(CAMERA_MODEL_AI_THINKER, FRAMESIZE_VGA);
String previousToken;
String previousRequestId;
bool previousFinished = false;
unsigned long lastAttempt = 0;

String requestId() {
  char value[33];
  snprintf(value, sizeof(value), "%08lx%08lx%08lx%08lx",
    (unsigned long)esp_random(), (unsigned long)esp_random(),
    (unsigned long)esp_random(), (unsigned long)esp_random());
  return String(value);
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 30000) delay(250);
  if (WiFi.status() != WL_CONNECTED) { Serial.println("WiFi unavailable; access stays denied."); return; }
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  started = millis();
  while (time(nullptr) < 1700000000 && millis() - started < 30000) delay(250);
  if (time(nullptr) < 1700000000) { Serial.println("Clock unavailable; access stays denied."); return; }
  if (reader.setup() != SETUP_OK) { Serial.println("Camera or PSRAM setup failed."); return; }
  reader.beginOnCore(1);
  Serial.println("Scanner ready.");
}

void loop() {
  if (!reader.begun) { delay(250); return; }
  QRCodeData data;
  if (!reader.receiveQrCode(&data, 100) || !data.valid || data.payloadLen <= 0 || data.payloadLen >= sizeof(data.payload)) return;
  String token;
  token.reserve(data.payloadLen);
  // FitPulse QR tokens are JWTs: only these characters can enter the JSON body.
  for (int index = 0; index < data.payloadLen; index++) {
    char value = (char)data.payload[index];
    if (!isalnum((unsigned char)value) && value != '-' && value != '_' && value != '.') return;
    token += value;
  }
  if (token != previousToken) {
    previousToken = token;
    previousRequestId = requestId();
    previousFinished = false;
  }
  if (previousFinished || millis() - lastAttempt < 2000) return;
  lastAttempt = millis();
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); Serial.println("Network unavailable; access stays denied."); return; }
  if (!String(API_URL).startsWith("https://")) { Serial.println("HTTPS is required."); return; }
  WiFiClientSecure client;
  client.setCACert(ROOT_CA); // Never use setInsecure().
  HTTPClient http;
  http.setTimeout(8000);
  if (!http.begin(client, API_URL)) return;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Scanner-Key", SCANNER_KEY);
  String body = "{\"qrToken\":\"" + token + "\",\"requestId\":\"" + previousRequestId + "\",\"deviceId\":\"" + DEVICE_ID + "\"}";
  int status = http.POST(body);
  String response = http.getString();
  http.end();
  if ((status == 201 || status == 200) && response.indexOf("\"allowed\":true") >= 0) {
    previousFinished = true;
    Serial.println("MEMBER VERIFIED - check-in recorded.");
    // Connect your indicator here. A door/relay requires a separate reviewed design.
  } else if (status >= 400 && status < 500 && status != 429) {
    previousFinished = true;
    Serial.printf("ACCESS DENIED - HTTP %d. Ask the front desk.\n", status);
  } else {
    Serial.println("Server unavailable; access stays denied. Retrying the same request ID.");
  }
}
