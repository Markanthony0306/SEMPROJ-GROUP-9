#pragma once
// Copy to secrets.h locally. Never commit the real credentials.
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL = "https://your-api.example.com/api/scanner/check-in";
const char* SCANNER_KEY = "REPLACE_WITH_THE_SERVER_SCANNER_API_KEY";
const char* DEVICE_ID = "entrance-esp32-cam";
// Paste the PEM root CA certificate for your API's TLS certificate chain.
const char* ROOT_CA = R"CERT(-----BEGIN CERTIFICATE-----
REPLACE_WITH_YOUR_ROOT_CA
-----END CERTIFICATE-----
)CERT";
