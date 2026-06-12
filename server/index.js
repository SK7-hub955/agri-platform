import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

const DEFAULT_MARKET_PRICES = [
  { crop: "Maize", price: "K850/50kg", change: "+3.2%", trend: "up" },
  { crop: "Soybeans", price: "K1,200/50kg", change: "+1.8%", trend: "up" },
  { crop: "Groundnuts", price: "K1,800/50kg", change: "-0.5%", trend: "down" },
  { crop: "Wheat", price: "K920/50kg", change: "+2.1%", trend: "up" },
  { crop: "Cassava", price: "K420/50kg", change: "0.0%", trend: "flat" },
];

const MARKET_PRICE_PROVIDER = process.env.MARKET_PRICE_PROVIDER || 'commoditiesapi';
const MARKET_PRICE_KEY = process.env.MARKET_PRICE_KEY || '';
const MARKET_PRICE_SYMBOLS = process.env.MARKET_PRICE_SYMBOLS || 'ZC,ZS,ZW,SB,KC';
const COMMODITY_LABELS = {
  ZC: 'Corn',
  ZS: 'Soybeans',
  ZW: 'Wheat',
  SB: 'Sugar',
  KC: 'Coffee',
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Market prices from a verified source or fallback
app.get('/api/market-prices', async (req, res) => {
  try {
    if (MARKET_PRICE_PROVIDER === 'commoditiesapi') {
      if (!MARKET_PRICE_KEY) {
        throw new Error('Commodity API key not configured');
      }

      const response = await fetch(`https://commodities-api.com/api/latest?access_key=${encodeURIComponent(MARKET_PRICE_KEY)}&symbols=${encodeURIComponent(MARKET_PRICE_SYMBOLS)}&base=USD`);
      if (!response.ok) {
        throw new Error(`Commodities API responded with status ${response.status}`);
      }

      const payload = await response.json();
      if (!payload || !payload.data || !payload.data.rates) {
        throw new Error('Unexpected Commodities API response format');
      }

      const rates = payload.data.rates;
      const prices = MARKET_PRICE_SYMBOLS.split(',').map(symbol => {
        const trimmed = symbol.trim();
        const value = rates[trimmed];
        return {
          crop: COMMODITY_LABELS[trimmed] || trimmed,
          symbol: trimmed,
          price: value != null ? `USD ${Number(value).toFixed(2)}` : 'N/A',
          change: 'N/A',
          trend: 'flat',
        };
      });

      return res.json({ success: true, source: 'Commodities API', prices });
    }

    if (MARKET_PRICE_PROVIDER === 'yahoo') {
      const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(MARKET_PRICE_SYMBOLS)}`);
      if (!response.ok) {
        throw new Error(`Yahoo Finance responded with status ${response.status}`);
      }
      const payload = await response.json();
      const results = payload?.quoteResponse?.result;
      if (!Array.isArray(results)) {
        throw new Error('Unexpected Yahoo Finance response format');
      }
      const prices = results.map(item => {
        const value = item.regularMarketPrice;
        const pct = item.regularMarketChangePercent;
        return {
          crop: item.shortName || item.symbol,
          symbol: item.symbol,
          price: value != null ? `USD ${Number(value).toFixed(2)}` : 'N/A',
          change: pct != null ? `${Number(pct).toFixed(2)}%` : '0.00%',
          trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
        };
      });
      return res.json({ success: true, source: 'Yahoo Finance', prices });
    }

    return res.json({ success: true, source: 'fallback', prices: DEFAULT_MARKET_PRICES });
  } catch (error) {
    console.error('❌ Market prices fetch failed:', error.message);
    return res.status(200).json({
      success: false,
      source: 'fallback',
      error: error.message,
      prices: DEFAULT_MARKET_PRICES,
    });
  }
});

// Send verification code
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email, code, name } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or code' });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Only Gmail addresses are supported' });
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'AgriConnect - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">🌱 AgriConnect</h1>
          </div>
          <div style="background: #f9fbf7; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hello ${name || 'User'},
            </p>
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for signing up with AgriConnect! To verify your email address and complete your registration, please use the verification code below:
            </p>
            <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 8px;">Your verification code:</p>
              <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 3px;">${code}</p>
            </div>
            <p style="color: #888; font-size: 12px; line-height: 1.6; margin-top: 20px;">
              This code will expire in 24 hours. If you did not sign up for an AgriConnect account, please ignore this email.
            </p>
            <p style="color: #888; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
              © 2026 AgriConnect. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}:`, info.messageId);

    res.json({
      success: true,
      message: 'Verification code sent to your Gmail',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code',
      details: error.message,
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AgriConnect API running on http://localhost:${PORT}`);
  console.log(`📧 Frontend expected at ${FRONTEND_URL}`);
});
