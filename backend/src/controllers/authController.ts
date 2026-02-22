import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

if (!process.env.JWT_SECRET) {
  throw new Error('Environment variable JWT_SECRET is not defined.');
}

const signToken = (payload: { userId: string; username: string; email: string }) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '30d' });

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE email=$1 OR username=$2', [email, username]);
    if (existing.rowCount) {
      res.status(409).json({ success: false, error: 'Username or email already taken' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email, created_at',
      [username, email, password_hash]
    );

    const user = rows[0];
    const token = signToken({ userId: user.id, username: user.username, email: user.email });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (err: any) {
    console.error('[auth] register error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const { rows, rowCount } = await query('SELECT * FROM users WHERE username=$1', [username]);
    const validPassword = rowCount && await bcrypt.compare(password, rows[0].password_hash);

    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const { password_hash: _, ...user } = rows[0];
    const token = signToken({ userId: user.id, username: user.username, email: user.email });

    res.json({ success: true, data: { user, token } });
  } catch (err: any) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { rows } = await query(
      'SELECT id, username, email, steam_id, created_at FROM users WHERE id=$1',
      [req.user!.userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    console.error('[auth] getMe error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};