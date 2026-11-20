import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './server/db.ts';
import { seedDatabase } from './server/seed.ts';
import { registerRoutes } from './server/routes.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser());

  await connectDatabase();
  await seedDatabase();

  registerRoutes(app);

  // Serve generated and uploaded public assets cleanly in both dev and prod
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }
  const srcAssetsDir = path.resolve(process.cwd(), 'src/assets');
  if (fs.existsSync(srcAssetsDir)) {
    app.use('/src/assets', express.static(srcAssetsDir));
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] YRT Esports CMS running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
