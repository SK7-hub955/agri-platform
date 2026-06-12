# AgriConnect Render Deployment Checklist

## Project Structure ✅

```
agri-platform/
├── .gitignore                 # Protects .env files
├── .nojekyll                  # Tells Render to skip Jekyll
├── render.yaml                # Render deployment config
├── RENDER_DEPLOY.md           # Detailed deployment guide
├── SERVER_SETUP.md            # Local server setup guide
├── package.json               # Workspace root scripts
│
├── agri-platform/             # Frontend (React + Vite)
│   ├── vite.config.js         # Vite configuration
│   ├── package.json           # Frontend dependencies (with Node engine)
│   ├── .gitignore
│   ├── src/
│   │   └── App.jsx            # Main app with email API integration
│   └── dist/                  # Built files (auto-generated)
│
└── server/                    # Backend (Express)
    ├── index.js               # Express server with email endpoint
    ├── package.json           # Backend dependencies (with Node engine)
    ├── .env.example           # Configuration template
    ├── .gitignore
    └── .env                   # Actual credentials (NOT in Git)
```

## Files Added/Updated for Render ✅

| File | Purpose |
|------|---------|
| `render.yaml` | Render infrastructure config (backend + frontend) |
| `agri-platform/vite.config.js` | Vite build configuration |
| `.gitignore` | Prevents .env files from being committed |
| `server/.gitignore` | Additional .env protection |
| `.nojekyll` | Disables Jekyll processing on Render |
| `RENDER_DEPLOY.md` | Step-by-step deployment guide |
| `agri-platform/package.json` | Added Node version requirement |
| `server/package.json` | Added Node version requirement |
| `server/.env.example` | Render setup instructions |

## Environment Files

### Local Development
Create `/workspaces/agri-platform/server/.env`:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Render Deployment
Set these in Render dashboard:
```
Backend (agri-platform-api):
- GMAIL_USER
- GMAIL_PASS
- FRONTEND_URL (update after frontend deploys)
- NODE_ENV=production

Frontend (agri-platform):
- REACT_APP_API_URL (backend URL)
```

## Build Verification ✅

```bash
# Frontend builds successfully
$ npm run build
✓ built in 256ms

# File structure ready for deployment
agri-platform/dist/
├── index.html
└── assets/
    └── index-xxx.js  (575.61 kB, gzip: 108.67 kB)
```

## Deployment Commands

### For Render (Automatic)
- Push to GitHub → Render auto-deploys via `render.yaml`
- No manual build needed

### For Local Testing
```bash
# Install all dependencies
npm run install-all

# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend
npm run server
```

## Pre-Deployment Checklist

- [ ] Gmail account with 2-Step Verification enabled
- [ ] Gmail App Password generated (16 characters)
- [ ] GitHub repo connected to Render account
- [ ] No `.env` files committed to Git
- [ ] Frontend builds successfully (`npm run build`)
- [ ] `render.yaml` properly formatted
- [ ] Backend URL will be `https://agri-platform-api.onrender.com`
- [ ] Frontend URL will be `https://agri-platform.onrender.com`

## Render Deployment Steps

1. **Create Backend Service**
   - Type: Web Service
   - Root: `server/`
   - Build: `npm install`
   - Start: `npm start`
   - Set env vars: GMAIL_USER, GMAIL_PASS, FRONTEND_URL

2. **Create Frontend Service**
   - Type: Static Site
   - Root: `agri-platform/`
   - Build: `npm install && npm run build`
   - Publish: `dist/`
   - Set env vars: REACT_APP_API_URL

3. **Update Backend FRONTEND_URL**
   - After frontend deploys, update backend's FRONTEND_URL env var

4. **Test Full Stack**
   - Register → Verify email → Login

## Vite Configuration Details

- **Minification**: Disabled (faster build, simpler troubleshooting)
- **Source Maps**: Disabled (smaller package size)
- **Output**: `dist/` directory
- **Target**: ES2020+

## Post-Deployment

- [ ] Test user registration with Gmail
- [ ] Verify verification email is sent
- [ ] Test verification code entry
- [ ] Test login with verified account
- [ ] Test adding roles to existing account
- [ ] Monitor backend logs for errors
- [ ] Check frontend console for CORS issues

## Troubleshooting

| Issue | Check |
|-------|-------|
| Build fails | Run `npm run build` locally first |
| Email not sent | Verify GMAIL_USER/GMAIL_PASS in backend env vars |
| CORS error | Verify FRONTEND_URL in backend matches frontend domain |
| Blank page | Check browser console (F12), verify REACT_APP_API_URL |
| Cold start > 30s | Normal on free tier, upgrade to prevent |

## Security Reminders

✅ `.env` files are in `.gitignore`
✅ Environment variables set in Render dashboard (not in code)
✅ No credentials in `render.yaml` or committed files
✅ All data transmitted over HTTPS
✅ Gmail app password is restricted to Mail only

## Next Steps After Deployment

1. Add persistent database (MongoDB/PostgreSQL)
2. Implement password reset flow
3. Add user profile management
4. Scale to multiple Render instances if needed
5. Set up monitoring and alerts

## Support Resources

- [Render Docs](https://render.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Nodemailer Documentation](https://nodemailer.com/)

---

**Status**: ✅ Ready for Render deployment
**Last Updated**: 2026-06-12
**Build Status**: ✅ Passing
