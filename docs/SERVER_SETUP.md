# AgriConnect Backend Setup Guide

## Overview
The email verification system is now fully integrated with a real Express backend using Nodemailer to send emails via Gmail SMTP.

## Prerequisites
- Node.js 18+ installed
- A Gmail account
- Access to Gmail App Passwords

## Step 1: Set up Gmail App Password

1. Go to [Google Account Security Settings](https://myaccount.google.com/security)
2. Click on **2-Step Verification** and enable it if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select **Mail** and **Windows Computer** (or your device type)
5. Google will generate a 16-character app password (e.g., `abcd efgh ijkl mnop`)
6. Copy this password (you'll need it in the next step)

## Step 2: Create Environment File

Create `.env` file in `/server/` directory with your Gmail credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=abcdefghijklmnop
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Important:** Replace:
- `your-email@gmail.com` with your actual Gmail address
- `abcdefghijklmnop` with the 16-character app password from Step 1

## Step 3: Install Backend Dependencies

```bash
cd /workspaces/agri-platform/server
npm install
```

This installs:
- Express.js - Web framework
- Nodemailer - Email service
- CORS - Cross-origin requests
- dotenv - Environment variables

## Step 4: Start the Backend Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

**Expected Output:**
```
✅ Email service connected and ready
🚀 AgriConnect API running on http://localhost:3001
```

If you see errors:
- ❌ Check your Gmail credentials in `.env`
- ❌ Verify Gmail account has 2-Step Verification enabled
- ❌ Ensure app password was copied correctly (no spaces)

## Step 5: Run the Full Stack

In **separate terminal windows**:

### Terminal 1 - Frontend:
```bash
cd /workspaces/agri-platform/agri-platform
npm run dev
```
Expected: Vite dev server at `http://localhost:5173`

### Terminal 2 - Backend:
```bash
cd /workspaces/agri-platform/server
npm run dev
```
Expected: Express server at `http://localhost:3001`

## Step 6: Test Email Verification

1. Open frontend at `http://localhost:5173`
2. Click **Register**
3. Fill in:
   - Name: Your name
   - Email: Your Gmail address
   - Password: Any password
   - Select at least one role (e.g., Customer)
4. Click **Register**
5. Check your Gmail inbox for verification email
6. Copy the 6-digit code from the email
7. Enter it in the verification field
8. Click **Verify**

**If email doesn't arrive:**
- Check spam/promotions folder
- Verify backend console shows "✅ Verification code sent to..."
- Confirm Gmail credentials are correct in `.env`

## API Endpoints

### Health Check
```
GET http://localhost:3001/api/health
```
Response: `{ "status": "ok", "timestamp": "2024-..." }`

### Send Verification Email
```
POST http://localhost:3001/api/send-verification
Content-Type: application/json

{
  "email": "user@gmail.com",
  "code": "123456",
  "name": "John Doe"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "messageId": "<unique-id@gmail.com>"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error info"
}
```

## Frontend Configuration

The frontend automatically connects to the backend at `http://localhost:3001` during development.

To change the backend URL, set the environment variable:
```bash
export VITE_API_URL=http://your-backend-url:3001
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" on login | Check .env file - verify GMAIL_USER and GMAIL_PASS are correct |
| "CORS error" in browser console | Ensure backend is running and FRONTEND_URL in .env matches your frontend URL |
| Email not received | 1. Check spam folder 2. Check backend console for "✅ Verification code sent" 3. Verify Gmail app password is correct |
| "Connection refused" | Backend server not running - run `npm run dev` in server directory |
| Port 3001 already in use | Change PORT in .env to an available port (e.g., 3002) |

## Project Structure

```
agri-platform/
├── agri-platform/          # React frontend (Vite)
│   ├── src/
│   │   └── App.jsx         # Main app with auth UI
│   └── package.json
├── server/                 # Express backend
│   ├── index.js            # Email API server
│   ├── .env                # Gmail credentials (create this)
│   ├── .env.example        # Template
│   └── package.json
└── package.json            # Workspace scripts
```

## Next Steps

After testing email verification:
1. Deploy frontend to hosting (Render, Netlify, etc.)
2. Deploy backend to hosting with persistent database
3. Update FRONTEND_URL in production .env
4. Add persistent database (MongoDB, PostgreSQL) instead of localStorage
5. Implement password reset flow using same email verification pattern

## Security Notes

- ⚠️ Never commit `.env` file to git
- ⚠️ Never share your Gmail app password
- ⚠️ Use HTTPS in production
- ⚠️ Validate all emails on the backend before sending
- ⚠️ Implement rate limiting on email endpoint

