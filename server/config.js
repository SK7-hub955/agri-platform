import dotenv from 'dotenv';

dotenv.config();

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

export const config = {
  nodeEnv: NODE_ENV,
  isProduction,
  port: Number(process.env.PORT) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://agri:agri_dev_pw@127.0.0.1:5432/agriconnect',
  // Render/managed Postgres requires SSL. Enable in production or when DATABASE_SSL=true.
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    (isProduction && process.env.DATABASE_SSL !== 'false'),

  // Auth
  jwtSecret: isProduction
    ? required('JWT_SECRET', process.env.JWT_SECRET)
    : process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  verificationTtlMinutes: Number(process.env.VERIFICATION_CODE_TTL_MINUTES) || 1440,

  // Email
  gmailUser: process.env.GMAIL_USER || '',
  gmailPass: process.env.GMAIL_PASS || '',

  // Market prices
  marketPriceProvider: process.env.MARKET_PRICE_PROVIDER || 'silv',
  marketPriceCategories: (process.env.MARKET_PRICE_CATEGORIES || 'dairy,livestock'),
};

export default config;
