# Share FitPulse with ngrok

The configured public address is:

https://surprise-datebook-glancing.ngrok-free.dev

## How the connection works

```text
Visitor's browser
  -> HTTPS ngrok address
  -> Vite on localhost:5173
  -> /api requests forwarded to Node on 127.0.0.1:3001
  -> Supabase
```

`server.allowedHosts` in `vite.config.js` allows this exact ngrok hostname.
Keep an explicit hostname instead of `allowedHosts: true` or `.ngrok-free.dev`.
`strictPort: true` prevents Vite from silently moving to another port while
ngrok still forwards to 5173.

The frontend uses `VITE_API_URL=/api`. A relative path keeps API requests on the
visitor's public HTTPS address. A browser URL containing `localhost:3001`
would point to the visitor's own device.

## Start or restart the services

Run these commands from the project root in three separate terminals. If a
service is already running, use its existing terminal; do not start a duplicate.
Press Ctrl+C in that terminal before restarting it.

1. API:

   ```powershell
   npm run server
   ```

2. Frontend:

   ```powershell
   npm run dev
   ```

3. Tunnel, using the ngrok domain assigned to your account:

   ```powershell
   ngrok http 5173 --url https://surprise-datebook-glancing.ngrok-free.dev
   ```

Share the HTTPS address printed by ngrok. Keep the computer awake, connected to
the internet, and all three services running. Test the address on a phone using
mobile data. If ngrok displays a visit confirmation page, choose Visit Site.

## Environment settings

The local `.env` uses these public connection settings alongside its private
keys. Edit the existing entries; do not replace the whole file.

```dotenv
VITE_API_URL=/api
CLIENT_URL=https://surprise-datebook-glancing.ngrok-free.dev
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,https://surprise-datebook-glancing.ngrok-free.dev
```

Restart Vite after changing frontend environment variables and restart the API
after changing `CLIENT_URL` or `CORS_ORIGINS`. `CLIENT_URL` controls password
recovery links. Apply the FitPulse recovery migration and configure the server's
SMTP settings as described in [Supabase setup](../supabase/README.md). The app
sends password reset links to this page:

```text
https://surprise-datebook-glancing.ngrok-free.dev/reset-password
```

If the ngrok domain changes, update `allowedHosts`, `CLIENT_URL`, `CORS_ORIGINS`,
and the ngrok command to match it. `VITE_API_URL=/api`
stays the same. If the API port changes from 3001, update the Vite proxy target.

## Check access without changing data

Open the public address and then:

```text
https://surprise-datebook-glancing.ngrok-free.dev/api/me
```

Without signing in, the API should return a 401 JSON response. That means the
request reached the protected API and still requires a valid session. An HTML
page at this path means the proxy is missing; a 500 proxy error usually means
the Node API is stopped or using a different port.

## Permanent hosting

This setup shares a development server for temporary demonstrations. For
permanent access, deploy the production frontend build and the Node API to
managed hosting. Vite's development proxy is not included in `npm run build`:
configure a production `/api` reverse proxy, or build with `VITE_API_URL` set to
the deployed API's HTTPS URL and allow the frontend origin in the API's CORS.

Use `NODE_ENV=production` on the deployed API, keep stable signing and encryption
keys in server environment settings, and replace any default administrator
password. The development demo-account route is disabled in production. Keep
Supabase secret keys and other server secrets out of `VITE_*` variables and Git.

References: [Vite 7 server options](https://v7.vite.dev/config/server-options),
[ngrok HTTP endpoints](https://ngrok.com/docs/gateway/endpoints/http), and
[Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
