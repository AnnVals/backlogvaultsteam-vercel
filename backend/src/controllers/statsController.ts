import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const uid = req.user!.userId;

    const [total, byStatus, byPlatform, byGenre, bySource, rating, hours] = await Promise.all([
      query('SELECT COUNT(*) FROM user_library WHERE user_id = $1', [uid]),
      query('SELECT status, COUNT(*) FROM user_library WHERE user_id = $1 GROUP BY status', [uid]),
      query('SELECT platform, COUNT(*) FROM user_library WHERE user_id = $1 GROUP BY platform ORDER BY COUNT(*) DESC', [uid]),
      query(
        `SELECT unnest(g.genres) AS genre, COUNT(*)
         FROM user_library ul
         JOIN games g ON ul.game_id = g.id
         WHERE ul.user_id = $1
         GROUP BY genre
         ORDER BY COUNT(*) DESC
         LIMIT 10`,
        [uid]
      ),
      query('SELECT source, COUNT(*) FROM user_library WHERE user_id = $1 GROUP BY source', [uid]),
      query('SELECT AVG(rating) FROM user_library WHERE user_id = $1 AND rating IS NOT NULL', [uid]),
      query('SELECT SUM(hours_played) FROM user_library WHERE user_id = $1', [uid]),
    ]);

    const gamesByStatus: Record<string, number>   = {};
    const gamesByPlatform: Record<string, number> = {};
    const gamesByGenre: Record<string, number>    = {};
    const gamesBySource: Record<string, number>   = {};

    byStatus.rows.forEach(r   => { gamesByStatus[r.status]     = parseInt(r.count); });
    byPlatform.rows.forEach(r => { gamesByPlatform[r.platform] = parseInt(r.count); });
    byGenre.rows.forEach(r    => { gamesByGenre[r.genre]       = parseInt(r.count); });
    bySource.rows.forEach(r   => { gamesBySource[r.source]     = parseInt(r.count); });

    const totalGames = parseInt(total.rows[0].count);

    res.json({
      success: true,
      data: {
        total_games:      totalGames,
        games_by_status:  gamesByStatus,
        games_by_platform: gamesByPlatform,
        games_by_genre:   gamesByGenre,
        games_by_source:  gamesBySource,
        avg_rating:       parseFloat(rating.rows[0].avg)   || 0,
        total_hours:      parseInt(hours.rows[0].sum)       || 0,
        favorite_genre:   byGenre.rows[0]?.genre            || 'N/A',
        favorite_platform: byPlatform.rows[0]?.platform     || 'N/A',
        completion_rate:  totalGames > 0
          ? Math.round(((gamesByStatus.completed || 0) / totalGames) * 100)
          : 0,
      },
    });
  } catch (err: any) {
    console.error('[getStats] error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};