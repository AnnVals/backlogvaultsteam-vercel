import axios from 'axios';
import { SteamGame, SteamImportPreview, SteamGamePreview } from '../../types';
import { query } from '../../config/database';

const STEAM_API = 'https://api.steampowered.com';
const STEAM_KEY = process.env.STEAM_API_KEY;

export const resolveVanityUrl = async (vanityUrl: string): Promise<string> => {
  const res = await axios.get(STEAM_API + '/ISteamUser/ResolveVanityURL/v1/', {
    params: { key: STEAM_KEY, vanityurl: vanityUrl },
  });

  if (res.data.response.success !== 1) {
    throw new Error('Steam profile not found. Make sure the URL is correct.');
  }

  return res.data.response.steamid;
};

export const getSteamProfile = async (steamId: string) => {
  const res = await axios.get(STEAM_API + '/ISteamUser/GetPlayerSummaries/v2/', {
    params: { key: STEAM_KEY, steamids: steamId },
  });

  const players = res.data.response?.players;

  if (!players?.length) {
    throw new Error('Steam profile not found or private.');
  }

  return players[0];
};

export const getOwnedGames = async (steamId: string): Promise<SteamGame[]> => {
  const res = await axios.get(STEAM_API + '/IPlayerService/GetOwnedGames/v1/', {
    params: {
      key: STEAM_KEY,
      steamid: steamId,
      include_appinfo: true,
      include_played_free_games: true,
    },
  });

  const data = res.data.response;

  if (!data || !data.games) {
    throw new Error(
      'Could not read Steam library. Make sure your profile is set to Public:\n' +
      'Steam → Privacy Settings → Game Details → Public'
    );
  }

  return data.games;
};

export const previewImport = async (
  steamIdOrUrl: string,
  userId?: string
): Promise<SteamImportPreview> => {
  const isDirectId = /^\d{17}$/.test(steamIdOrUrl);
  const vanity = steamIdOrUrl.replace(/^.*\/id\//, '').replace(/\/$/, '');
  const steamId = isDirectId ? steamIdOrUrl : await resolveVanityUrl(vanity);

  const [profile, games] = await Promise.all([
    getSteamProfile(steamId),
    getOwnedGames(steamId),
  ]);

  let existingAppIds = new Set<number>();

  if (userId) {
    const existing = await query(
      `SELECT g.steam_appid FROM user_library ul
       JOIN games g ON ul.game_id = g.id
       WHERE ul.user_id = $1 AND g.steam_appid IS NOT NULL`,
      [userId]
    );
    existingAppIds = new Set(existing.rows.map(r => r.steam_appid));
  }

  const gamePreviews: SteamGamePreview[] = games.map(g => ({
    appid: g.appid,
    name: g.name || 'App ' + g.appid,
    playtime_hours: Math.round((g.playtime_forever || 0) / 60 * 10) / 10,
    cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/' + g.appid + '/library_600x900.jpg',
    already_in_library: existingAppIds.has(g.appid),
  }));

  return {
    steam_id: steamId,
    steam_username: profile.personaname,
    steam_avatar: profile.avatarfull,
    total_games: games.length,
    games: gamePreviews,
  };
};

export const normalizeSteamGame = (steamGame: SteamGame) => ({
  steam_appid: steamGame.appid,
  title: steamGame.name,
  cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/' + steamGame.appid + '/library_600x900.jpg',
  background_url: 'https://cdn.akamai.steamstatic.com/steam/apps/' + steamGame.appid + '/header.jpg',
  platforms: ['PC'],
});