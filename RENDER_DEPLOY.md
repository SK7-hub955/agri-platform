# Render Deployment Guide

This guide walks you through deploying AgriConnect to [Render.com](https://render.com), a modern cloud platform.

## Prerequisites

- GitHub account with the agri-platform repository
- Render.com account (sign up at https://render.com)
- Gmail account with App Password configured
- Basic familiarity with Render dashboard

## Step 1: Get Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select **Mail** and **Windows Computer**
5. Google will generate a 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Copy this password (remove spaces): `abcdefghijklmnop`

## Step 2: Deploy Backend (Express API)

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Select **Build and deploy from a Git repository**
4. Click **Connect** and authorize GitHub
5. Select the **agri-platform** repository

### 2.2 Configure Backend Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `agri-platform-api` |
| **Environment** | `Node` |
| **Region** | `Oregon` (or closest to you) |
| **Plan** | `Free` |
| **Branch** | `main` |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && npm start` |

### 2.3 Set Environment Variables

Click **Advanced** and add these environment variables:

```
GMAIL_USER = your-email@gmail.com
GMAIL_PASS = abcdefghijklmnop
PORT = 3001
FRONTEND_URL = https://agri-platform.onrender.com
NODE_ENV = production
```

⚠️ **Replace:**
- `your-email@gmail.com` with your Gmail address
- `abcdefghijklmnop` with your App Password
- Update `FRONTEND_URL` after frontend is deployed (see Step 3)

### 2.4 Deploy

Click **Create Web Service**. Render will:
1. Build the application
2. Install dependencies
3. Start the server

**Expected Output:**
```
✅ Email service connected and ready
🚀 AgriConnect API running on http://localhost:3001
```

⏳ First deploy takes 3-5 minutes. Copy the backend URL (e.g., `https://agri-platform-api.onrender.com`) — you'll need it for the frontend.

## Step 3: Deploy Frontend (React Static Site)

### 3.1 Create Static Site

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Static Site**
3. Click **Connect** and select the **agri-platform** repository

### 3.2 Configure Frontend Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `agri-platform` |
| **Branch** | `main` |
| **Build Command** | `cd agri-platform && npm install && npm run build` |
| **Publish Directory** | `agri-platform/dist` |

### 3.3 Set Environment Variables

Click **Advanced** and add:

```
VITE_API_URL = https://agri-platform-api.onrender.com
```

Replace with your actual backend URL from Step 2.

### 3.4 Deploy

Click **Create Static Site**. Render will build and deploy your frontend.

⏳ Deploy takes 2-3 minutes.

## Step 4: Update Backend FRONTEND_URL

After frontend is deployed, you'll have a URL like `https://agri-platform.onrender.com`.

Update the backend's environment variable:

1. Go to your **agri-platform-api** Web Service
2. Click **Settings** → **Environment**
3. Update `FRONTEND_URL` to your frontend URL
4. The service will automatically restart

## Step 5: Test the Full Stack

1. Open your frontend URL: `https://agri-platform.onrender.com`
2. Register with a Gmail account
3. Check your Gmail inbox for verification email (within 30 seconds)
4. Enter the verification code
5. Login and verify all features work

## Monitoring & Logs

### View Backend Logs

1. Go to **agri-platform-api** service
2. Click **Logs**
3. Look for:
   - ✅ Email service connected
   - ✅ Verification code sent
   - ❌ Error messages

### View Frontend Logs

1. Go to **agri-platform** static site
2. Click **Logs**

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check logs for email service errors. Verify GMAIL_USER and GMAIL_PASS in environment variables. |
| **Frontend shows blank page** | Clear browser cache. Check browser console (F12) for errors. Verify REACT_APP_API_URL is correct. |
| **Email not received** | Check backend logs for "Verification code sent". Verify GMAIL_PASS is correct (16 chars, no spaces). Check Gmail spam folder. |
| **CORS errors in console** | Verify FRONTEND_URL in backend environment variables matches your frontend URL. Restart backend service. |
| **Build failures** | Ensure all dependencies are in package.json. Check build command syntax. View full build logs in Render. |

## Updating Code

After pushing changes to GitHub:

1. **Backend changes**: Go to **agri-platform-api** → Click **Manual Deploy** → **Deploy latest**
2. **Frontend changes**: Go to **agri-platform** → Click **Manual Deploy** → **Deploy latest**

Or enable auto-deploy:
1. Click **Settings**
2. Toggle **Auto-Deploy** to ON
3. Every GitHub push to `main` will trigger a deploy

## Cost Considerations

- **Free Plan**: Includes 0.5 hours of build time/month, 100GB bandwidth/month
- Services spin down after 15 min of inactivity (cold starts ~30 sec)
- Upgrade to **Paid** for persistent uptime: ~$12/month per service

## Security Notes

- ✅ Never commit `.env` file to Git
- ✅ Use Render environment variables for secrets (GMAIL_PASS, API keys)
- ✅ Use HTTPS (Render provides free SSL)
- ✅ Keep dependencies updated
- ✅ Consider adding rate limiting for email endpoint

## Next Steps

1. ✅ Set up database (MongoDB Atlas, PostgreSQL)
2. ✅ Add password reset via email
3. ✅ Implement user profile management
4. ✅ Add order management features
5. ✅ Set up monitoring & alerts

## Support

- [Render Documentation](https://render.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Express.js Deployment](https://expressjs.com/en/advanced/best-practice-performance.html)

