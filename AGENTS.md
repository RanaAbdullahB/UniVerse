# AGENTS.md

## Cursor Cloud specific instructions

### Overview

UniVerse is a full-stack MERN (MongoDB, Express, React, Vite) university student portal. It has three npm workspaces: root, `client/`, and `server/`.

### Services

| Service | Port | Start command |
|---------|------|---------------|
| MongoDB | 27017 | `mongod --dbpath /data/db --bind_ip 127.0.0.1` |
| Backend (Express + Socket.IO) | 5000 | `npm run dev:server` (from root) |
| Frontend (Vite + React) | 3000 | `npm run dev:client` (from root) |

Both servers together: `npm run dev` (uses `concurrently`).

### Startup caveats

- **MongoDB must be running first.** The Express server calls `process.exit(1)` if it cannot connect to Mongo.
- **node_modules bin permissions:** After `npm install`, you may need to run `chmod +x server/node_modules/.bin/* client/node_modules/.bin/* node_modules/.bin/*` if you see "Permission denied" errors for `nodemon` or `vite`.
- **Email domain hard-coded in login:** The student login route (`server/routes/auth.js` line 168) enforces `@lgu.edu.pk` regardless of the `UNIVERSITY_EMAIL_DOMAIN` env var. The seed script reads the env var, so keep `UNIVERSITY_EMAIL_DOMAIN=lgu.edu.pk` in `server/.env` for consistency.
- **Environment file:** Copy `.env.example` to `server/.env`. The seed script and server both read from `server/.env` via `dotenv`.
- **Seeding:** Run `npm run seed` from root to populate the DB. Credentials after seeding: admin `admin@lgu.edu.pk` / student `alex.johnson@lgu.edu.pk`, both with password `password123`.
- **No lint/test scripts** are configured in the project. There is no ESLint config or test runner at the project level.
- **Build:** `npm run build` runs the Vite production build for the client.
- **Optional services:** SMTP email and VAPID push notifications gracefully degrade when not configured.
