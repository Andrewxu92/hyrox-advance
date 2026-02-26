import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Import routes
import analysisRoutes from './routes/analysis.js';
import trainingRoutes from './routes/training.js';
import scraperRoutes from './routes/scraper.js';
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
        service: 'HYROX Advance API'
    });
});
// Mount routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/scrape', scraperRoutes);
// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🏃 HYROX Advance server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
//# sourceMappingURL=index.js.map