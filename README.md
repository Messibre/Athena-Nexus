# Athena Nexus

Athena Nexus is a MERN platform for weekly and milestone coding challenges, with role-based access, submissions workflow, and a public gallery.

## Core Stack

- Frontend: React 18, React Router v6, Redux Toolkit, Axios, Framer Motion
- Backend: Node.js, Express, Mongoose
- Security: Helmet, CORS allowlist, rate limiting, httpOnly cookie auth
- Deployment: Vercel (static client + serverless Node API)

## Key Capabilities

- Weekly challenge workflow for members (view challenge, submit, edit)
- Milestone progression (categories, levels, challenge unlock flow)
- Admin console for weeks, users, submissions, milestones, and stats
- Public gallery for approved weekly and milestone submissions
- Global mini-modal UX for error/success messaging
- Mobile-aware back navigation for in-page drill-down states
- Legal and trust pages: Privacy Policy, Terms of Service, Cookie Consent
- Route-aware SEO manager and custom 404 page

## Security Model

- Access token is stored in an httpOnly cookie (short-lived)
- Refresh token is stored in an httpOnly cookie and rotated on refresh
- Refresh tokens are hashed and tracked per user (with revocation metadata)
- Client uses `withCredentials` and no longer relies on localStorage JWT storage
- API CORS is allowlist-based via environment configuration

## Monorepo Layout

```
Athena-Nexus/
├── client/                # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   └── config/
│   └── public/
├── server/                # Express API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── scripts/
├── vercel.json
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Install

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### Environment Variables (server/.env)

Required:

- `MONGODB_URI`
- `JWT_SECRET`

Recommended / optional:

- `PORT` (default `5000`)
- `NODE_ENV` (`development` or `production`)
- `FRONTEND_URL`
- `CLIENT_URL`
- `ALLOWED_ORIGINS` (comma-separated allowed origins)
- `JWT_EXPIRE` (default `15m`)
- `JWT_REFRESH_EXPIRE` (default `7d`)
- `JWT_REFRESH_SECRET` (falls back to `JWT_SECRET`)
- `AUTH_COOKIE_NAME` (default `auth_token`)
- `REFRESH_COOKIE_NAME` (default `refresh_token`)
- `AUTH_COOKIE_SAME_SITE` (default `lax`)
- `REFRESH_COOKIE_MAX_AGE_MS` (default `604800000`)

Frontend env (optional):

- `REACT_APP_API_URL` (set for non-proxied environments)

### Generate JWT Secret

```bash
cd server
npm run generate-secret
```

## Run the App

From repository root (recommended):

```bash
npm run dev
```

Or run services separately:

```bash
cd server && npm run dev
cd client && npm start
```

Default local URLs:

- Frontend: http://localhost:3000
- API: http://localhost:5000

## Scripts

Root:

- `npm run dev` — run client and server concurrently
- `npm run server` — run backend dev server
- `npm run client` — run frontend dev server
- `npm run install-all` — install all dependencies

Server (`server/package.json`):

- `npm run dev`
- `npm run start`
- `npm run create-admin`
- `npm run generate-secret`

Client (`client/package.json`):

- `npm start`
- `npm run build`
- `npm test`

## Authentication Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

## Deployment Notes (Vercel)

- `vercel.json` routes `/api/*` to `server/index.js`
- Static client is built from `client/package.json` with `distDir: build`
- Non-API routes are rewritten to SPA entry (`/client/index.html`)

## Admin User Bootstrap

```bash
cd server
npm run create-admin
```

Ensure required environment variables are available when running the script.

## License

ISC
