import { Request, Response } from 'express';
import axios from 'axios';
import { query } from '../config/database';

const RAWG_BASE_URL = 'https://api.rawg.io/api';
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!RAWG_API_KEY) {
  throw new Error('Environment variable RAWG_API_KEY is not defined.');
}

const buildPagination = (page: number, count: number, limit = 20) => ({
  page,
  total: count,
  limit,
  totalPages: Math.ceil(count / limit),
});

export const searchGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = 1 } = req.query;
    const { data } = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: { key: RAWG_API_KEY, search: q, page, page_size: 20, ordering: '-rating' },
    });
    res.json({ success: true, data: data.results, pagination: buildPagination(Number(page), data.count) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPopular = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1 } = req.query;
    const { data } = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: { key: RAWG_API_KEY, ordering: '-rating', page, page_size: 20, metacritic: '70,100' },
    });
    res.json({ success: true, data: data.results, pagination: buildPagination(Number(page), data.count) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await axios.get(`${RAWG_BASE_URL}/games/${req.params.id}`, {
      params: { key: RAWG_API_KEY },
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};