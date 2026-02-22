import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '5mb' }));
app.use('/api', routes);

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 BacklogVault API running`);
});