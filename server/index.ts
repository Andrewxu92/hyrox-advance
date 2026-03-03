import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import database
import { initializeDatabase, closeDatabase } from './db/index.js';

// Import routes
import analysisRoutes from './routes/analysis.js';
import trainingRoutes from './routes/training.js';
import scraperRoutes from './routes/scraper.js';
import athletesRoutes from './routes/athletes.js';
import resultsRoutes from './routes/results.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
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

// Mount routes
app.use('/api/athletes', athletesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/scrape', scraperRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
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
    
    app.listen(PORT, () => {
      console.log(`🏃 HYROX Advance server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 API Endpoints:`);
      console.log(`   - GET/POST /api/athletes`);
      console.log(`   - GET/POST/DELETE /api/results`);
      console.log(`   - GET /api/results/athlete/:id/compare`);
      console.log(`   - POST /api/analysis`);
      console.log(`   - POST /api/training`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
