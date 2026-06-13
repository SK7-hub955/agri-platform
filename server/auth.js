import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { query } from './db.js';

export function hashPassword(plain) {
  return bcrypt.hash(plain, config.bcryptRounds);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isGmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@gmail.com');
}

// Maps a DB user row to the shape the frontend expects (never exposes password_hash).
export function serializeUser(row, activeRole = null) {
  if (!row) return null;
  const roles = row.roles || ['customer'];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roles,
    role: activeRole && roles.includes(activeRole) ? activeRole : roles[0],
    verified: row.verified,
    avatar: row.avatar,
    location: row.location,
    truckType: row.truck_type,
    available: row.available,
  };
}

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }
    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];
    if (!roles.includes(role)) {
      return res.status(403).json({ success: false, error: `Requires ${role} role` });
    }
    next();
  };
}

export async function recordAction(userId, type, details) {
  try {
    await query('INSERT INTO user_actions (user_id, type, details) VALUES ($1, $2, $3)', [
      userId,
      type,
      details ? JSON.stringify(details) : null,
    ]);
  } catch (error) {
    console.error('Failed to record action:', error.message);
  }
}

export default {
  hashPassword,
  comparePassword,
  signToken,
  generateVerificationCode,
  isGmail,
  serializeUser,
  authMiddleware,
  requireRole,
  recordAction,
};
