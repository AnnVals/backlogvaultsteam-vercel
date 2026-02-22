import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user!.userId;
    const { platform, status, page = 1, limit = 50000 } = req.query;

    let where = 'WHERE ul.user_id=$1';
    const params: any[] = [uid];
    let i = 2;

    if (platform) { where += ` AND ul.platform=$${i++}`; params.push(platform); }
    if (status)   { where += ` AND ul.status=$${i++}`;   params.push(status);   }

    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const rows = await query(
      `SELECT ul.*, g.title, g.cover_url, g.genres, g.steam_appid, g.rawg_id
       FROM user_library ul
       JOIN games g ON ul.game_id = g.id
       ${where}
       ORDER BY ul.added_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params
    );

    const count = await query(
      `SELECT COUNT(*) FROM user_library ul ${where}`,
      params.slice(0, -2)
    );

    const total = parseInt(count.rows[0].count);

    res.json({
      success: true,
      data: rows.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    console.error('[getLibrary] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addToLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user!.userId;
    const {
      game_id, platform, status, source = 'manual', hours_played = 0, rating, notes,
      rawg_id, title, cover_url, background_url, release_date, genres, platforms,
    } = req.body;

    let internalGameId = game_id;

    if (rawg_id) {
      await query(
        `INSERT INTO games (rawg_id, title, cover_url, background_url, release_date, genres, platforms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (rawg_id) DO UPDATE SET title = EXCLUDED.title`,
        [rawg_id, title, cover_url || null, background_url || null, release_date || null, genres || null, platforms || null]
      );

      const gameRow = await query('SELECT id FROM games WHERE rawg_id = $1', [rawg_id]);
      internalGameId = gameRow.rows[0].id;
    }

    const r = await query(
      `INSERT INTO user_library (user_id, game_id, platform, status, source, hours_played, rating, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, game_id, platform) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
       RETURNING *`,
      [uid, internalGameId, platform, status || null, source, hours_played, rating || null, notes || null]
    );

    res.json({ success: true, data: r.rows[0] });
  } catch (err: any) {
    console.error('[addToLibrary] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateLibraryEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user!.userId;
    const { id } = req.params;
    const { status, rating, notes, hours_played } = req.body;

    const r = await query(
      `UPDATE user_library
       SET status      = COALESCE($3, status),
           rating      = COALESCE($4, rating),
           notes       = COALESCE($5, notes),
           hours_played = COALESCE($6, hours_played),
           updated_at  = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, uid, status, rating, notes, hours_played]
    );

    res.json({ success: true, data: r.rows[0] });
  } catch (err: any) {
    console.error('[updateLibraryEntry] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const removeFromLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user!.userId;
    await query('DELETE FROM user_library WHERE id = $1 AND user_id = $2', [req.params.id, uid]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[removeFromLibrary] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const clearLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM user_library WHERE user_id = $1', [req.user!.userId]);
    res.json({ success: true, message: 'Library cleared' });
  } catch (err: any) {
    console.error('[clearLibrary] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};