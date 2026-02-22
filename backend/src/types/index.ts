export type GameStatus = 'owned' | 'playing' | 'completed' | 'wishlist' | 'dropped' | 'backlog';
export type GameSource = 'manual' | 'steam';

export interface User {
  id: string;
  username: string;
  email: string;
  steam_id?: string;
  has_nintendo_linked: boolean;
  created_at: string;
}

export interface Game {
  id: number;
  rawg_id?: number;
  steam_appid?: number;
  title: string;
  slug?: string;
  cover_url?: string;
  background_url?: string;
  release_date?: string;
  metacritic?: number;
  genres?: string[];
  platforms?: string[];
  rating?: number;
  ratings_count?: number;
  description?: string;
}

export interface LibraryEntry {
  id: string;
  user_id: string;
  game_id: number;
  rawg_id?: number;
  steam_appid?: number;
  platform: string;
  status: GameStatus;
  source: GameSource;
  hours_played?: number;
  rating?: number;
  notes?: string;
  is_subscription: boolean;
  subscription_service?: string;
  added_at: string;
  updated_at: string;
  title: string;
  cover_url?: string;
  metacritic?: number;
  genres?: string[];
  release_date?: string;
  game_rating?: number;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
  playtime_2weeks?: number;
}

export interface SteamImportPreview {
  steam_id: string;
  steam_username: string;
  steam_avatar: string;
  total_games: number;
  games: SteamGamePreview[];
}

export interface SteamGamePreview {
  appid: number;
  name: string;
  playtime_hours: number;
  cover_url: string;
  already_in_library: boolean;
  rawg_match?: Partial<Game>;
}

export interface NintendoGame {
  titleId: string;
  name: string;
  imageUrl?: string;
  totalPlayedMinutes?: number;
  lastPlayedAt?: string;
}

export interface NintendoImportPreview {
  nintendo_username: string;
  total_games: number;
  games: NintendoGamePreview[];
}

export interface NintendoGamePreview {
  titleId: string;
  name: string;
  cover_url?: string;
  hours_played: number;
  already_in_library: boolean;
  rawg_match?: Partial<Game>;
}

export interface CsvRow {
  Name: string;
  Platform?: string;
  Status?: string;
  Rating?: string;
  Review?: string;
  'Date Added'?: string;
}

export interface UserStats {
  total_games: number;
  games_by_status: Record<GameStatus, number>;
  games_by_platform: Record<string, number>;
  games_by_genre: Record<string, number>;
  games_by_source: Record<GameSource, number>;
  avg_rating: number;
  total_hours: number;
  favorite_genre: string;
  favorite_platform: string;
  completion_rate: number;
  free_games_count: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}