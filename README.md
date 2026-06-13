# AgriConnect

A multi-sided agricultural marketplace connecting Zambian farmers, suppliers, and transporters. It provides product discovery, order management, logistics tracking, live commodity market prices, and weather-informed agronomic advisory.

All application data (users, products, orders, deliveries, community posts, crops) is stored server-side in **PostgreSQL**. Authentication uses **bcrypt**-hashed passwords and **JWT** session tokens — no credentials or business data live in the browser.

## Project Structure

```
.
├── agri-platform/        # Frontend (React 19 + Vite)
│   ├── src/App.jsx       # UI (calls the backend API)
│   ├── src/api.js        # API client + JWT token handling
│   ├── src/main.jsx      # Entry point
│   └── .env.example      # Frontend env template (VITE_API_URL)
├── server/               # Backend (Node.js + Express + PostgreSQL)
│   ├── index.js          # App setup + route mounting
│   ├── config.js         # Environment configuration
│   ├── db.js             # pg connection pool + query/transaction helpers
│   ├── schema.sql        # Database schema (DDL)
│   ├── migrate.js        # Applies schema + idempotent seed data
│   ├── auth.js           # bcrypt/JWT helpers + auth middleware
│   ├── email.js          # Gmail verification emails (optional)
│   ├── routes/           # auth, products, orders, deliveries, community, crops, data
│   └── .env.example      # Backend env template
├── docs/                 # Deployment & setup guides
├── render.yaml           # Render Infrastructure-as-Code (DB + API + static site)
└── package.json          # Workspace scripts
```

## Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 13 (local instance for development)

## Setup

Install all dependencies (root, frontend, server):

```bash
npm run install-all
```

Create a local database and user (one-time):

```bash
sudo -u postgres psql -c "CREATE USER agri WITH PASSWORD 'agri_dev_pw';"
sudo -u postgres psql -c "CREATE DATABASE agriconnect OWNER agri;"
```

Configure the backend environment:

```bash
cp server/.env.example server/.env
# edit server/.env: set DATABASE_URL, JWT_SECRET, and (optionally) Gmail creds
```

Apply the schema and seed reference data (idempotent):

```bash
npm run migrate
```

Optionally configure the frontend API URL:

```bash
cp agri-platform/.env.example agri-platform/.env
```

## Running Locally

In one terminal, start the backend (http://localhost:3001):

```bash
npm run server
```

In another terminal, start the frontend (http://localhost:5173):

```bash
npm run dev
```

## Building the Frontend

```bash
npm run build      # output in agri-platform/dist
npm run preview    # preview the production build
```

## Authentication

- Register with name, Gmail address, password, and one or more roles (customer, supplier, transport).
- A 6-digit verification code is generated and emailed (if Gmail SMTP is configured). After verifying, the API returns a JWT.
- The frontend stores the JWT in `localStorage` and sends it as a `Bearer` token on authenticated requests.
- Passwords are stored only as bcrypt hashes; verification codes expire after `VERIFICATION_CODE_TTL_MINUTES`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | – | Health check (includes DB connectivity) |
| POST | `/api/auth/register` | – | Create account; sends verification code |
| POST | `/api/auth/login` | – | Login; returns JWT (or prompts verification) |
| POST | `/api/auth/verify` | – | Verify email code; returns JWT |
| POST | `/api/auth/resend` | – | Resend verification code |
| GET | `/api/auth/me` | Bearer | Current user from token |
| GET | `/api/products` | – | All products |
| GET | `/api/products/mine` | Bearer | Supplier's products |
| POST | `/api/products` | Bearer (supplier) | Add a product |
| GET | `/api/orders/customer` | Bearer | Orders placed by the customer |
| GET | `/api/orders/supplier` | Bearer | Orders for the supplier's products |
| POST | `/api/orders` | Bearer | Place an order |
| GET | `/api/deliveries/available` | Bearer | Unassigned / pending deliveries |
| GET | `/api/deliveries/mine` | Bearer | Transporter's deliveries |
| POST | `/api/deliveries/:orderId/accept` | Bearer | Accept a delivery |
| GET | `/api/community/posts` | – | Community posts |
| POST | `/api/community/posts` | Bearer | Create a community post |
| GET | `/api/crops` | – | Crop knowledge data |
| GET | `/api/market-prices` | – | Live commodity prices (Silv Data — no demo fallback) |
| GET | `/api/weather?lat=&lon=` | – | Current weather (Open-Meteo) |

## Deployment

Deployment to Render is configured via `render.yaml`, which provisions a managed PostgreSQL database, the API service, and the static frontend. The API's `DATABASE_URL` is wired from the database, `JWT_SECRET` is auto-generated, and migrations run on each deploy via the start command. See [`docs/RENDER_DEPLOY.md`](docs/RENDER_DEPLOY.md) and [`docs/RENDER_CHECKLIST.md`](docs/RENDER_CHECKLIST.md).

## Security

Never commit `.env` files or credentials. The backend reads all secrets (`DATABASE_URL`, `JWT_SECRET`, `GMAIL_USER`, `GMAIL_PASS`) from environment variables — set these in your local `server/.env` or in the Render dashboard. `JWT_SECRET` is required in production (the server refuses to start without it).
