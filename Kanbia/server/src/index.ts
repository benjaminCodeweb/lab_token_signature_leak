import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { runSeed } from './db/seed';
import { authMiddleware } from './middleware/auth';

import authRouter from './routes/auth';
import configRouter from './routes/config';
import boardsRouter from './routes/boards';
import orgRouter from './routes/org';
import debugRouter from './routes/debug';

const PORT = parseInt(process.env.PORT || '1000', 10);
// Local mode binds only to loopback. Docker mode defaults to all interfaces.
const HOST = process.env.HOST || '0.0.0.0';
const CLIENT_DIST = path.join(__dirname, '../../client/dist');

runSeed();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(authMiddleware);
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'kanbia' }));

app.use('/api/auth', authRouter);
app.use('/api', configRouter);
app.use('/api', boardsRouter);
app.use('/api', orgRouter);
app.use('/api/_debug', debugRouter);

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d', etag: true }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use((_req, res) => res.status(404).json({ error: 'not found' }));

app.listen(PORT, HOST, () => console.log(`[APP] Kanbia escuchando en http://localhost:${PORT} (host: ${HOST})`));
