/**
 * server.ts
 * Production-ready Express entry point for the Dashboard Backup & Sharing API.
 *
 * Prerequisites (run once before starting):
 *   npm run tsoa:routes   →  generates routes/routes.ts
 *   npm run tsoa:spec     →  generates build/swagger.json
 *   (or simply: npm run build)
 *
 * Start development server:
 *   npm run dev           →  nodemon + ts-node with auto-restart
 *
 * Start production server:
 *   npm run build && npm start
 */

// reflect-metadata MUST be the first import for tsoa decorators to work
import 'reflect-metadata';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/db';

// ── tsoa generated routes ─────────────────────────────────────────────────────
// This file is auto-created by `npm run tsoa:routes`. If missing, run that
// command first. The import will fail at compile time if routes.ts is absent.
import { RegisterRoutes } from './routes/routes';

// ─── Environment ──────────────────────────────────────────────────────────────
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Swagger JSON Endpoint  ───────────────────────────────────────────────────
// Serves the raw OpenAPI spec at GET /swagger.json
// The Angular frontend (or any tool) can fetch this to auto-generate clients.
app.get('/swagger.json', (_req: Request, res: Response) => {
  try {
    // swagger.json is written to build/ by `npm run tsoa:spec`.
    // __dirname is dist/ at runtime, so we go up one level to reach build/.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swaggerDocument = require(
      path.join(__dirname, '..', 'build', 'swagger.json'),
    );
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(swaggerDocument);
  } catch {
    res.status(503).json({
      error: 'swagger.json not found. Run `npm run build` to generate it.',
    });
  }
});

// ─── Swagger UI  ──────────────────────────────────────────────────────────────
// Interactive API documentation at GET /api/docs
// swagger.json is loaded at startup; if it doesn't exist yet a warning is shown.
let swaggerDocument: Record<string, unknown> = {};
try {
  // __dirname is dist/ at runtime – go up one level to reach build/swagger.json
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  swaggerDocument = require(
    path.join(__dirname, '..', 'build', 'swagger.json'),
  );
  console.log('[Swagger] swagger.json loaded successfully.');
} catch {
  console.warn(
    '[Swagger] swagger.json not found. Run `npm run build` to generate it. ' +
      'Swagger UI will be unavailable until then.',
  );
}

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Dashboard API – Swagger UI',
    customCss: `
      .topbar { background-color: #1e293b; }
      .topbar-wrapper img { content: url(''); }
    `,
  }),
);

// ─── API Routes (tsoa generated) ──────────────────────────────────────────────
// RegisterRoutes registers all @Route decorated controller methods onto a
// sub-router that we mount at /api.
// Final paths: /api/dashboard/backup, /api/dashboard/:id, etc.
const apiRouter = express.Router();
RegisterRoutes(apiRouter as unknown as express.Express);
app.use('/api', apiRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Global Error]', err.stack ?? err.message);
  res.status(err.status ?? 500).json({
    success: false,
    message: err.message ?? 'Internal server error.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server]  http://localhost:${PORT}`);
  console.log(`[Docs]    http://localhost:${PORT}/api/docs`);
  console.log(`[Spec]    http://localhost:${PORT}/swagger.json`);
  console.log(`[Health]  http://localhost:${PORT}/health`);
  console.log(`[Env]     ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
