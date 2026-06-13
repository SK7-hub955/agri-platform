import { Router } from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  generateVerificationCode,
  isGmail,
  serializeUser,
  authMiddleware,
  recordAction,
} from '../auth.js';
import { sendVerificationEmail, emailEnabled } from '../email.js';

const router = Router();

const VALID_ROLES = ['customer', 'supplier', 'transport'];

function sanitizeRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return [...new Set(roles.filter((r) => VALID_ROLES.includes(r)))];
}

async function issueVerification(userId, email, name) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + config.verificationTtlMinutes * 60 * 1000);
  await query(
    'INSERT INTO email_verifications (user_id, code, expires_at) VALUES ($1, $2, $3)',
    [userId, code, expiresAt],
  );
  let emailResult = { success: false, error: 'Email service is not configured' };
  if (emailEnabled()) {
    try {
      emailResult = await sendVerificationEmail(email, code, name);
    } catch (error) {
      emailResult = { success: false, error: error.message };
    }
  }
  return { code, emailResult };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const roles = sanitizeRoles(req.body?.roles);

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please fill all fields.' });
    }
    if (!isGmail(email)) {
      return res.status(400).json({ success: false, error: 'Please use a Gmail address to register.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (roles.length === 0) {
      return res.status(400).json({ success: false, error: 'Select at least one role.' });
    }

    const normalizedEmail = email.toLowerCase();
    const { rows: existingRows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const existing = existingRows[0];

    if (existing) {
      const passwordOk = await comparePassword(password, existing.password_hash);
      if (!passwordOk) {
        return res.status(400).json({
          success: false,
          error: 'Password mismatch. Please use the password associated with this email.',
        });
      }
      const mergedRoles = [...new Set([...existing.roles, ...roles])];
      await query('UPDATE users SET roles = $1 WHERE id = $2', [mergedRoles, existing.id]);
      await recordAction(existing.id, 'add_roles', { roles });

      if (!existing.verified) {
        await issueVerification(existing.id, normalizedEmail, existing.name);
        return res.json({
          success: true,
          requiresVerification: true,
          email: normalizedEmail,
          message: 'Roles added! A verification code has been sent to your Gmail to complete the process.',
        });
      }
      return res.json({
        success: true,
        requiresVerification: false,
        message: 'Roles added successfully! You can now use these roles to login.',
      });
    }

    const passwordHash = await hashPassword(password);
    const avatar = name.slice(0, 2).toUpperCase();
    const { rows: insertedRows } = await query(
      `INSERT INTO users (name, email, password_hash, roles, verified, avatar)
       VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING *`,
      [name, normalizedEmail, passwordHash, roles, avatar],
    );
    const user = insertedRows[0];
    await recordAction(user.id, 'register', { email: normalizedEmail, roles });
    await issueVerification(user.id, normalizedEmail, name);

    return res.json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'A verification code has been sent to your Gmail. Enter it below to complete registration.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password.' });
    }
    const normalizedEmail = email.toLowerCase();
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Check email and password.' });
    }
    if (role && !user.roles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'This account does not have that role. Please choose a different role or register for it.',
      });
    }
    if (!user.verified) {
      await issueVerification(user.id, normalizedEmail, user.name);
      return res.json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'This account is not verified. Enter the verification code sent to your Gmail.',
      });
    }
    await recordAction(user.id, 'login', { role: role || user.roles[0] });
    const token = signToken(user);
    return res.json({ success: true, token, user: serializeUser(user, role) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code are required.' });
    }
    const normalizedEmail = email.toLowerCase();
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found for this email.' });
    }
    const { rows: codeRows } = await query(
      `SELECT * FROM email_verifications
       WHERE user_id = $1 AND code = $2 AND consumed = FALSE AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, String(code).trim()],
    );
    if (codeRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Verification code is incorrect or has expired.' });
    }
    await query('UPDATE email_verifications SET consumed = TRUE WHERE id = $1', [codeRows[0].id]);
    await query('UPDATE users SET verified = TRUE WHERE id = $1', [user.id]);
    await recordAction(user.id, 'verify_email', { email: normalizedEmail });

    const { rows: freshRows } = await query('SELECT * FROM users WHERE id = $1', [user.id]);
    const fresh = freshRows[0];
    const token = signToken(fresh);
    return res.json({ success: true, token, user: serializeUser(fresh) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/resend
router.post('/resend', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    const normalizedEmail = email.toLowerCase();
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found to resend code.' });
    }
    const { emailResult } = await issueVerification(user.id, normalizedEmail, user.name);
    return res.json({
      success: true,
      message: emailResult.success
        ? 'A new verification code has been sent to your Gmail.'
        : 'A new verification code was generated, but email delivery is not configured.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: serializeUser(req.user) });
});

export default router;
