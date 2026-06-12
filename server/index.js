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
  { crop: "Maize", symbol: "ZC", unit: "bushel", price: "K300/50kg", change: "+3.2%", trend: "up" },
  { crop: "Soybeans", symbol: "ZS", unit: "bushel", price: "K400/kg", change: "+1.8%", trend: "up" },
  { crop: "Groundnuts", symbol: "GN", unit: "kg", price: "K1,800/50kg", change: "-0.5%", trend: "down" },
  { crop: "Wheat", symbol: "ZW", unit: "bushel", price: "K920/50kg", change: "+2.1%", trend: "up" },
  { crop: "Cassava", symbol: "CC", unit: "kg", price: "K420/50kg", change: "0.0%", trend: "flat" },
];

const MARKET_PRICE_PROVIDER = process.env.MARKET_PRICE_PROVIDER || 'silv';
const MARKET_PRICE_CATEGORIES_RAW = process.env.MARKET_PRICE_CATEGORIES || 'dairy,livestock';
const MARKET_PRICE_CATEGORIES = MARKET_PRICE_CATEGORIES_RAW === 'all'
  ? []
  : MARKET_PRICE_CATEGORIES_RAW.split(',').map(s => s.trim()).filter(Boolean);
const SILV_COMMODITY_ENDPOINT = 'https://data.silv.app/commodities.json';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Weather from Open-Meteo by geographic coordinates
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Missing latitude or longitude' });
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('windspeed_unit', 'kmh');
    url.searchParams.set('precipitation_unit', 'mm');
    url.searchParams.set('relativehumidity_2m', 'true');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('hourly', 'relativehumidity_2m,precipitation_probability');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }

    const payload = await response.json();
    const current = payload.current_weather;
    if (!current) {
      throw new Error('Open-Meteo did not return current weather');
    }

    const hourlyTimes = payload.hourly?.time || [];
    const humidityValues = payload.hourly?.relativehumidity_2m || [];
    const precipitationValues = payload.hourly?.precipitation_probability || [];
    const timeIndex = hourlyTimes.indexOf(current.time);
    const humidity = timeIndex >= 0 ? humidityValues[timeIndex] : null;
    const precipitationProbability = timeIndex >= 0 ? precipitationValues[timeIndex] : null;

    const weatherCodeMap = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Freezing drizzle',
      57: 'Freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail',
    };

    const condition = weatherCodeMap[current.weathercode] || 'Local weather';
    const rainAdvisory = precipitationProbability >= 40 ? 'Carry an umbrella today.' : 'Dry conditions expected.';

    return res.json({
      success: true,
      weather: {
        temp: current.temperature,
        condition,
        wind: current.windspeed != null ? `${current.windspeed} km/h` : null,
        windDirection: current.winddirection != null ? `${current.winddirection}°` : null,
        humidity,
        precipitationProbability,
        rain: precipitationProbability != null ? `${precipitationProbability}%` : 'Unknown',
        advisory: rainAdvisory,
        source: 'Open-Meteo',
        timestamp: current.time,
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    });
  } catch (error) {
    console.error('❌ Weather fetch failed:', error.message);
    return res.status(200).json({ success: false, error: error.message });
  }
});

// Market prices from a verified source or fallback
app.get('/api/market-prices', async (req, res) => {
  try {
    if (MARKET_PRICE_PROVIDER === 'silv') {
      const response = await fetch(SILV_COMMODITY_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Silv API responded with status ${response.status}`);
      }

      const payload = await response.json();
      const commodities = payload?.commodities;
      if (!commodities || typeof commodities !== 'object') {
        throw new Error('Unexpected Silv API response format');
      }

      const symbols = Object.keys(commodities);
      const filtered = symbols
        .map(key => ({ key, ...commodities[key] }))
        .filter(item => MARKET_PRICE_CATEGORIES.length === 0 || MARKET_PRICE_CATEGORIES.includes(item.category));

      const prices = filtered.map(item => {
        const percent = item?.change_24h?.percent;
        const formattedPercent = typeof percent === 'number' ? `${(percent * 100).toFixed(2)}%` : 'N/A';
        return {
          crop: item.display_name || item.key,
          symbol: item.symbol || item.key,
          price: item.price != null ? `${item.currency || 'USD'} ${Number(item.price).toFixed(2)}` : 'N/A',
          change: formattedPercent,
          trend: typeof percent === 'number' ? (percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat') : 'flat',
          unit: item.unit || 'unit',
          source: item.source || 'silv-data',
          updatedAt: item.last_updated || item.timestamp,
        };
      });

      if (prices.length === 0) {
        throw new Error(`No Silv commodities found for categories: ${MARKET_PRICE_CATEGORIES.join(', ')}`);
      }

      return res.json({ success: true, source: 'Silv Data', prices });
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
