import { Router } from 'express';
import { scrapeHyresult, searchAthleteResults } from '../lib/scraper.js';

const router = Router();

// POST /api/scrape - Scrape athlete data from hyresult.com
router.post('/', async (req, res) => {
  try {
    const { athleteName, raceLocation } = req.body;
    
    if (!athleteName) {
      return res.status(400).json({
        success: false,
        error: 'athleteName is required'
      });
    }

    console.log(`Scraping request for: ${athleteName}`);
    
    const result = await scrapeHyresult(athleteName, raceLocation);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found or failed to scrape data'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Scrape error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/scrape/search - Search for athletes
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter q is required'
      });
    }

    const results = await searchAthleteResults(q);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search'
    });
  }
});

export default router;
