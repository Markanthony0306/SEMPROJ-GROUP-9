# FitPulse

Gym membership & attendance management for the FitPulse project.

## Stack

- **Frontend**: Vite + React 18 (no router library — a small custom route in `src/App.jsx`)
- **Backend**: Express 5 API with JWT auth, bcrypt password hashing, nodemailer, and a JSON file database
- **Deploy**: GitHub Actions → GitHub Pages (frontend only; the API runs separately)

## Local development

Requirements: Node.js 20+ (the repo is developed on Node 24).

```bash
npm install

# Terminal 1 — API server (http://localhost:3001)
npm run server

# Terminal 2 — Vite dev server (http://localhost:5173)
npm run dev
```

Open http://localhost:5173 and log in with a demo account:

| Role   | Email               | Password  |
| ------ | ------------------- | --------- |
| Admin  | admin@fitpulse.com  | admin123  |
| Member | member@fitpulse.com | member123 |

On a **fresh** database (`server/data.json` does not exist) the server seeds the two
demo accounts above plus a few attendance/payment records so the dashboards have data
to show. To regenerate demo data, stop the server and delete `server/data.json`.

## Environment variables

Copy `.env.example` to `.env` and adjust. The server reads `.env` automatically; the
frontend (Vite) reads `VITE_*` variables automatically. The most important ones:

| Variable         | Purpose                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `JWT_SECRET`     | Signing key for sessions. **Required in production.**                                     |
| `ADMIN_PASSWORD` | Password for the first admin on a fresh database. **Required in production.**             |
| `CLIENT_URL`     | Origin the password-reset email links to.                                                 |
| `CORS_ORIGINS`   | Comma-separated browser origins allowed to call the API.                                  |
| `SMTP_*`         | Optional mail settings. Without them, reset links print to the server console (dev only). |
| `VITE_API_URL`   | API base URL the browser requests (defaults to `http://localhost:3001/api`).              |

## Database

`server/data.json` holds accounts, attendance, and payments. It is **gitignored** so
real user emails and password hashes never reach the repository. The API initializes it
automatically with a minimal schema on first boot.

## Deployment

- The API must be hosted somewhere that supports Node (Render, Railway, Fly.io, a VPS).
  Base the API URL and set `JWT_SECRET`, `ADMIN_PASSWORD`, `CLIENT_URL`, and `CORS_ORIGINS` there.
- The frontend builds to `dist/` and the included GitHub Actions workflow
  (`.github/workflows/deploy-pages.yml`) publishes it to GitHub Pages. Set the repository
  variable `API_URL` (e.g. `https://your-api.example.com/api`) so the Pages build embeds it.
- `BASE_PATH` is handled by the workflow, so the app also works under the
  `https://user.github.io/<repo>/` subpath.

## Tests

```bash
npm run test:server   # starts the API on a temp database and runs a smoke test
```

The frontend is verified by `npm run build` (Vite fails the build on syntax errors).

## Scripts

| Script                | What it does                           |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Vite dev server                        |
| `npm run build`       | Production build into `dist/`          |
| `npm run server`      | Express API server on port 3001        |
| `npm run test:server` | API smoke test                         |
| `npm run admin:password -- <new-password>` | Change the admin password in `server/data.json` |
| `npm run format`      | Format the whole repository (Prettier) |

> Forgot the admin password? Run `npm run admin:password -- MyNewPassword` (8-72 characters),
> then restart the server. If you hit the "Too many attempts" message, wait 15 minutes or
> restart the API server — the rate-limit counters reset on boot.
