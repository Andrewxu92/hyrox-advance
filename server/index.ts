import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import database
import { initializeDatabase, closeDatabase } from './db/index.js';

// Import routes
import analysisRoutes from './routes/analysis.js';
import analysisDbRoutes from './routes/analysis-db.js';
import trainingRoutes from './routes/training.js';
import scraperRoutes from './routes/scraper.js';
import athletesRoutes from './routes/athletes.js';
import resultsRoutes from './routes/results.js';
import historyRoutes from './routes/history.js';
import exportRoutes from './routes/export.js';
import paceCalculatorRoutes from './routes/pace-calculator.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limit for analysis APIs (AI cost + CPU)
const analysisLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_ANALYSIS_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ANALYSIS_MAX) || 20,
  message: { success: false, error: 'Too many analysis requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for scraper APIs (external site load)
const scrapeLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_SCRAPE_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SCRAPE_MAX) || 10,
  message: { success: false, error: 'Too many scrape requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware - production: use ALLOWED_ORIGINS whitelist; development: allow all
const corsOrigin = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || true)
  : true;
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HYROX Advance API',
    database: 'connected'
  });
});

// Mount routes (rate-limited first)
app.use('/api/athletes', athletesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/analysis', analysisLimit, analysisRoutes);
app.use('/api/analysis-db', analysisLimit, analysisDbRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/scrape', scrapeLimit, scraperRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/pace-calculator', paceCalculatorRoutes);

// Error handling: never leak error details to client in production
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(isDev && err?.message && { message: err.message })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Check and serve static files
    const clientDistPath = path.join(__dirname, '../client/dist');
    console.log('📁 __dirname:', __dirname);
    console.log('📁 Looking for client at:', clientDistPath);
    console.log('📁 Client dist exists:', fs.existsSync(clientDistPath));
    
    // Serve static files
    if (fs.existsSync(clientDistPath)) {
      app.use(express.static(clientDistPath, {
        maxAge: '0',
        etag: true
      }));
      
      // SPA fallback - serve index.html for all non-API routes
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        const indexPath = path.join(clientDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).json({ error: 'Frontend not built' });
        }
      });
      console.log('✅ Static files serving enabled');
    }
    
    app.listen(PORT, () => {
      console.log(`🏃 HYROX Advance server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 API Endpoints:`);
      console.log(`   - GET/POST /api/athletes`);
      console.log(`   - GET/POST/DELETE /api/results`);
      console.log(`   - GET /api/results/athlete/:id/compare`);
      console.log(`   - POST /api/analysis`);
      console.log(`   - POST /api/analysis-db (with DB persistence)`);
      console.log(`   - GET  /api/analysis-db/reports`);
      console.log(`   - POST /api/training`);
      console.log(`   - GET  /api/history/athletes/:id/performance`);
      console.log(`   - GET  /api/history/athletes/:id/analysis`);
      console.log(`   - GET  /api/history/statistics`);
      console.log(`   - GET  /api/export/json`);
      console.log(`   - GET  /api/export/csv`);
      console.log(`   - POST /api/pace-calculator/target-splits`);
      console.log(`   - POST /api/pace-calculator/estimate`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
