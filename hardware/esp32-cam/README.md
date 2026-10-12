# FitPulse ESP32-CAM integration

The server verifies membership; the camera only decodes the QR and sends it over HTTPS. Firmware is a starting sketch for an AI Thinker ESP32-CAM with PSRAM, not a hardware-tested build. Confirm your exact board before flashing.

## Server setup

1. Set a random `SCANNER_API_KEY` of at least 32 characters in `.env` and keep it private. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` locally.
2. Set `SCANNER_DEVICE_ID=entrance-esp32-cam`. This configuration supports one device; provision separate keys before adding more devices.
3. Run the API behind HTTPS with a valid certificate. Use a stable `JWT_SECRET` in production. Keep `server/data.json` and `AVATAR_DIR` on persistent storage.
4. Members need active status and valid start/expiry dates. Legacy/demo accounts without expiry dates must be reviewed or renewed by staff. Dates are not invented automatically.

## Device setup

1. Use the [ESP32QRCodeReader library](https://github.com/alvarowolfx/ESP32QRCodeReader) with PSRAM enabled. Its camera code targets older Arduino ESP32 APIs; start with Arduino ESP32 core 2.0.17 and verify compatibility on your board. No firmware dependencies or toolchains were installed by this change.
2. **Apply this decoder safety fix before deployment.** The upstream decoder copies `data.payload_len` into a fixed 1024-byte array without a bound check. In `src/ESP32QRCodeReader.cpp`, immediately before `qrCodeData.dataType = data.data_type`, add:

   ```cpp
   if (data.payload_len >= sizeof(qrCodeData.payload)) {
     continue;
   }
   ```

   Pin your patched copy. The sketch's own length check happens after decoding and cannot protect the library's earlier copy.
3. Copy `secrets.example.h` to `secrets.h`; fill in Wi-Fi, HTTPS API URL, device key, device ID, and your API's root CA certificate. Do not commit this file.
4. Open `esp32-cam.ino`, select your board, and flash it. The sketch synchronizes its clock before verifying TLS certificates, following [Espressif's HTTPS pattern](https://github.com/espressif/arduino-esp32/blob/master/libraries/HTTPClient/examples/BasicHttpsClient/BasicHttpsClient.ino).
5. Test screen brightness, focus, scan distance, power stability, and network outages. Start with Serial output; relay/buzzer/display pins depend on the board and are deliberately not guessed.

## API contract

`POST /api/scanner/check-in`, with `Content-Type: application/json` and `X-Scanner-Key: <private device key>`:

```json
{
  "deviceId": "entrance-esp32-cam",
  "requestId": "a-new-random-32-character-id",
  "qrToken": "the-decoded-QR-text"
}
```

Reuse the same request ID when retrying the same scan. Generate a new ID for a different scan. Never send an account password or web login token.

| Result | HTTP | `allowed` | Device behavior |
| --- | --- | --- | --- |
| `CHECK_IN_RECORDED` | 201 | true | Indicate successful verification once |
| `ALREADY_RECORDED` | 200 | true | Retry acknowledged; do not duplicate attendance |
| Invalid device | 401 | false | Deny |
| Invalid, expired, or ineligible member QR | 403 | false | Deny; request a fresh QR or staff assistance |
| Used QR, conflicting request, or recent check-in | 409 | false | Deny repeat entry |
| Rate limit | 429 | absent | Deny; back off |
| Missing configuration / server outage | 503 / connection failure | false or absent | Deny; never grant access offline |

Codes expire after two minutes and are consumed by a successful scan. Refreshing creates a new code. A copied code can still be used first by someone else within that window: QR verifies membership credentials, not a person's identity. Staff photo checks or another identity factor are needed to prevent sharing. A QR scanner must not replace physical emergency-exit controls.

The current JSON database and local photo storage suit a single-server prototype. Before a real multi-device deployment, use database transactions and unique constraints for request IDs/QR usage, per-device credential rotation, and private object storage such as Supabase Storage with access policies. The profile uploader resizes photos and serves them to their authenticated owner and authorized gym staff. Staff can compare the attendance photo with the person at the entrance.

## Acceptance checks

- Active member: fresh QR records exactly one entrance check-in.
- Same request retry: same attendance ID; no new row.
- QR replay, tampering, expiry, staff QR, missing dates, or suspended membership: denied.
- Renewal/status changes after QR generation: checked again at scan time.
- Wi-Fi/server/TLS failure: denied.
- Member attendance and staff attendance show `ESP32-CAM` as the source.

CSV exports contain all loaded payment rows. Member exports contain only their own authorized records; staff exports include member identification. Amounts use PHP and dates use Asia/Manila. Spreadsheet formula-like text is escaped.
