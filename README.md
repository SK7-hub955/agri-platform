# AgriConnect

A multi-sided agricultural marketplace connecting Zambian farmers, suppliers, and transporters. It provides product discovery, logistics tracking, live commodity market prices, and weather-informed agronomic advisory.

## Project Structure

```
.
├── agri-platform/        # Frontend (React 19 + Vite)
│   ├── src/App.jsx       # Main application
│   ├── src/main.jsx      # Entry point
│   └── .env.example      # Frontend env template (VITE_API_URL)
├── server/               # Backend (Node.js + Express)
│   ├── index.js          # API: weather, market prices, email verification
│   └── .env.example      # Backend env template
├── docs/                 # Deployment & setup guides
├── render.yaml           # Render Infrastructure-as-Code
└── package.json          # Workspace scripts
```

## Prerequisites

- Node.js >= 18
- npm >= 9

## Setup

Install all dependencies (root, frontend, server):

```bash
npm run install-all
```

Configure the backend environment:

```bash
cp server/.env.example server/.env
# then edit server/.env and add your Gmail App Password
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

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/weather?lat=&lon=` | Current weather (Open-Meteo) |
| GET | `/api/market-prices` | Live commodity prices (Silv Data, with fallback) |
| POST | `/api/send-verification` | Send Gmail email verification code |

## Deployment

Deployment to Render is configured via `render.yaml`. See [`docs/RENDER_DEPLOY.md`](docs/RENDER_DEPLOY.md) and [`docs/RENDER_CHECKLIST.md`](docs/RENDER_CHECKLIST.md) for details.

## Security

Never commit `.env` files or credentials. The backend reads secrets (e.g. `GMAIL_USER`, `GMAIL_PASS`) from environment variables; set these in your local `server/.env` or in the Render dashboard.
