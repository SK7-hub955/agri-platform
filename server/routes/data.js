import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

const SILV_COMMODITY_ENDPOINT = 'https://data.silv.app/commodities.json';
const MARKET_PRICE_CATEGORIES =
  config.marketPriceCategories === 'all'
    ? []
    : config.marketPriceCategories.split(',').map((s) => s.trim()).filter(Boolean);

const WEATHER_CODE_MAP = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Slight rain showers',
  81: 'Moderate rain showers', 82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

// GET /api/weather?lat=&lon=
router.get('/weather', async (req, res) => {
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
    if (!response.ok) throw new Error(`Open-Meteo returned status ${response.status}`);

    const payload = await response.json();
    const current = payload.current_weather;
    if (!current) throw new Error('Open-Meteo did not return current weather');

    const hourlyTimes = payload.hourly?.time || [];
    const humidityValues = payload.hourly?.relativehumidity_2m || [];
    const precipitationValues = payload.hourly?.precipitation_probability || [];
    const timeIndex = hourlyTimes.indexOf(current.time);
    const humidity = timeIndex >= 0 ? humidityValues[timeIndex] : null;
    const precipitationProbability = timeIndex >= 0 ? precipitationValues[timeIndex] : null;

    const condition = WEATHER_CODE_MAP[current.weathercode] || 'Local weather';
    const advisory = precipitationProbability >= 40 ? 'Carry an umbrella today.' : 'Dry conditions expected.';

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
        advisory,
        source: 'Open-Meteo',
        timestamp: current.time,
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    });
  } catch (error) {
    console.error('Weather fetch failed:', error.message);
    return res.status(200).json({ success: false, error: error.message });
  }
});

// GET /api/market-prices — live data only, no demo fallback
router.get('/market-prices', async (req, res) => {
  try {
    if (config.marketPriceProvider !== 'silv') {
      return res.status(200).json({
        success: false,
        source: config.marketPriceProvider,
        prices: [],
        error: `Unsupported market price provider: ${config.marketPriceProvider}`,
      });
    }

    const response = await fetch(SILV_COMMODITY_ENDPOINT);
    if (!response.ok) throw new Error(`Silv API responded with status ${response.status}`);

    const payload = await response.json();
    const commodities = payload?.commodities;
    if (!commodities || typeof commodities !== 'object') {
      throw new Error('Unexpected Silv API response format');
    }

    const prices = Object.keys(commodities)
      .map((key) => ({ key, ...commodities[key] }))
      .filter((item) => MARKET_PRICE_CATEGORIES.length === 0 || MARKET_PRICE_CATEGORIES.includes(item.category))
      .map((item) => {
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
      throw new Error(`No Silv commodities found for categories: ${MARKET_PRICE_CATEGORIES.join(', ') || 'all'}`);
    }

    return res.json({ success: true, source: 'Silv Data', prices });
  } catch (error) {
    console.error('Market prices fetch failed:', error.message);
    return res.status(200).json({ success: false, source: 'Silv Data', prices: [], error: error.message });
  }
});

export default router;
