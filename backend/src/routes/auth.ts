import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as linkedin from '../services/linkedin';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await query('SELECT * FROM admin_users WHERE email = \$1 AND is_active = true', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '24h' });
    await query('UPDATE admin_users SET last_login_at = NOW() WHERE id = \$1', [user.id]);
    await logAudit('admin_login', user.email, 'admin_users', user.id, {}, req.ip);

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 });
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (err: any) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT id, email, display_name, last_login_at FROM admin_users WHERE id = \$1', [req.user!.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

router.get('/linkedin/connect', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ url: linkedin.getAuthUrl() });
});

router.get('/linkedin/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    if (error || !code) return res.redirect(process.env.APP_URL + '/settings?linkedin=error');
    const tokenData = await linkedin.exchangeCode(code as string);
    const profile = await linkedin.getProfile(tokenData.accessToken);
    await linkedin.storeToken(tokenData.accessToken, tokenData.expiresIn, tokenData.scope, profile.sub, profile);
    await logAudit('linkedin_connected', 'oauth', 'oauth_tokens', profile.sub);
    res.redirect(process.env.APP_URL + '/settings?linkedin=success');
  } catch (err: any) {
    logger.error('LinkedIn callback error', { error: err.message });
    res.redirect(process.env.APP_URL + '/settings?linkedin=error');
  }
});

router.get('/linkedin/status', requireAuth, async (req: AuthRequest, res: Response) => {
  const status = await linkedin.getConnectionStatus();
  res.json(status);
});

export default router;
