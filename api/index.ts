import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { IncomingMessage, ServerResponse } from 'http';
import { connectDatabase } from '../server/db.ts';
import { seedDatabase } from '../server/seed.ts';
import { registerRoutes } from '../server/routes.ts';

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

registerRoutes(app);

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      await seedDatabase();
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureInitialized();
  } catch (err) {
    console.error('[Vercel API] Init error:', err);
  }
  return app(req as any, res as any);
}
