import { ElementType } from 'react';
import {
  BookMarked,
  Play,
  CircleCheck,
  Star,
  XCircle,
  PenLine,
  Gamepad2,
  Monitor,
} from 'lucide-react';

export type GameStatus = 'playing' | 'completed' | 'wishlist' | 'dropped' | 'backlog';
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
  cover_url?: string;
  background_url?: string;
  release_date?: string;
  metacritic?: number;
  genres?: string[];
  platforms?: string[];
  rating?: number;
}

export interface LibraryEntry {
  id: string;
  game_id: number;
  rawg_id?: number;
  steam_appid?: number;
  platform: string;
  status: GameStatus | null;
  source: GameSource;
  hours_played?: number;
  rating?: number;
  notes?: string;
  is_subscription: boolean;
  subscription_service?: string;
  added_at: string;
  title: string;
  cover_url?: string;
  metacritic?: number;
  genres?: string[];
  game_rating?: number;
}

export interface SteamPreview {
  steam_id: string;
  steam_username: string;
  steam_avatar: string;
  total_games: number;
  games: {
    appid: number;
    name: string;
    playtime_hours: number;
    cover_url: string;
    already_in_library: boolean;
  }[];
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
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

// ─── Config objects ────────────────────────────────────────────────────────

export const PLATFORMS: {
  id: string;
  label: string;
  icon: ElementType;
  color: string;
}[] = [
  { id: 'PC', label: 'PC / Steam', icon: Monitor, color: '#ff6b00' },
];

export const STATUS_CONFIG: Record<
  GameStatus,
  { color: string; icon: ElementType; bg: string }
> = {
  backlog:   { color: '#6366f1', icon: BookMarked,   bg: 'rgba(99,102,241,.85)'  },
  playing:   { color: '#3b82f6', icon: Play,         bg: 'rgba(59,130,246,.85)'  },
  completed: { color: '#22c55e', icon: CircleCheck,  bg: 'rgba(34,197,94,.85)'   },
  wishlist:  { color: '#f59e0b', icon: Star,         bg: 'rgba(245,158,11,.85)'  },
  dropped:   { color: '#ef4444', icon: XCircle,      bg: 'rgba(239,68,68,.85)'   },
};

export const SOURCE_CONFIG: Record<
  GameSource,
  { icon: ElementType; color: string }
> = {
  manual: { icon: PenLine,  color: '#aaa'    },
  steam:  { icon: Gamepad2, color: '#1b2838' },
};