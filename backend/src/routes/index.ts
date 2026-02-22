
import { Router } from 'express';
import { body, param } from 'express-validator';
import { register, login, getMe } from '../controllers/authController';
import { searchGames, getPopular, getGame } from '../controllers/gamesController';
import { getLibrary, addToLibrary, removeFromLibrary, updateLibraryEntry, clearLibrary } from '../controllers/libraryController';
import { getStats } from '../controllers/statsController';
import {steamPreview, importSteam,
} from '../controllers/importController';
import { authenticate } from '../middleware/auth';

const router = Router();

//Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

//Games from RAWG API
router.get('/games/search', searchGames);
router.get('/games/popular', getPopular);
router.get('/games/:id', getGame);

//Library
router.get('/library', authenticate, getLibrary);
router.post('/library', authenticate, addToLibrary);
router.put('/library/:id', authenticate, updateLibraryEntry);
router.delete('/library', authenticate, clearLibrary);
router.delete('/library/:id', authenticate, removeFromLibrary);

//Stats
router.get('/stats', authenticate, getStats);

//Steam Import
router.get('/import/steam/preview/:steamId', authenticate, steamPreview);

router.post('/import/steam', authenticate, [
  body('steam_id').notEmpty().withMessage('Steam ID required'),
], importSteam);

export default router;
