import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import * as steamService from '../services/steam/steamService';
import { normalizeSteamGame } from '../services/steam/steamService';

export const steamPreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { steamId } = req.params;
    const preview = await steamService.previewImport(steamId, req.user?.userId);
    res.json({ success: true, data: preview });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const importSteam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { steam_id, selected_appids } = req.body;

  try {
    const games = await steamService.getOwnedGames(steam_id);
    let toImport;
    if (selected_appids) {
      toImport = games.filter((g: any) => selected_appids.includes(g.appid));
    } else {
      toImport = games;
    }

    let imported = 0;
    let skipped = 0;

    for (const steamGame of toImport) {
      try {
        const normalized = normalizeSteamGame(steamGame);

        await query(
          `INSERT INTO games (steam_appid, title, cover_url, background_url, platforms)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (steam_appid) DO UPDATE SET title = EXCLUDED.title`,
          [normalized.steam_appid, normalized.title, normalized.cover_url,
           normalized.background_url, normalized.platforms]
        );

        const gameRow = await query('SELECT id FROM games WHERE steam_appid = $1', [normalized.steam_appid]);

        if (!gameRow.rows.length) { skipped++; continue; }

        await query(
          `INSERT INTO user_library (user_id, game_id, platform, source, hours_played, external_id)
           VALUES ($1, $2, 'PC', 'steam', $3, $4)
           ON CONFLICT (user_id, game_id, platform) DO NOTHING`,
          [userId, gameRow.rows[0].id, Math.round((steamGame.playtime_forever || 0) / 60), String(steamGame.appid)]
        );

        imported++;
      } catch (err: any) {
        console.error('[importSteam] Game import error:', err.message);
        skipped++;
      }
    }

    await query('UPDATE users SET steam_id = $1 WHERE id = $2', [steam_id, userId]);

    await query(
      `INSERT INTO import_logs (user_id, service, games_found, games_imported, games_skipped)
       VALUES ($1, 'steam', $2, $3, $4)`,
      [userId, toImport.length, imported, skipped]
    );

    res.json({ success: true, data: { imported, skipped, total: toImport.length } });
  } catch (err: any) {
    console.error('[importSteam] Fatal error:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};