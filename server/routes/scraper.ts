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

// GET /api/scrape/search - Search for athletes with fuzzy matching
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter q is required'
      });
    }

    const originalQuery = q.trim();
    
    // 生成搜索变体
    const searchVariations: string[] = [originalQuery];
    
    // 如果有空格，尝试交换姓和名
    const parts = originalQuery.split(/\s+/);
    if (parts.length === 2) {
      searchVariations.push(parts[1] + ' ' + parts[0]);
    }
    
    // 如果只有一个词且是中文（2-4个字），尝试拆分
    if (parts.length === 1 && /^[\u4e00-\u9fa5]{2,4}$/.test(originalQuery)) {
      // 姓单字的情况
      searchVariations.push(originalQuery.slice(0, 1) + ' ' + originalQuery.slice(1));
      // 姓双字的情况
      if (originalQuery.length >= 3) {
        searchVariations.push(originalQuery.slice(0, 2) + ' ' + originalQuery.slice(2));
      }
    }
    
    // 去重
    const uniqueQueries = [...new Set(searchVariations)];
    
    console.log('Search variations:', uniqueQueries);
    
    // 尝试所有变体
    let allResults: any[] = [];
    
    for (const query of uniqueQueries) {
      try {
        const results = await searchAthleteResults(query);
        allResults = [...allResults, ...results];
      } catch (e) {
        console.log(`Search failed for "${query}":`, e);
      }
    }
    
    // 去重结果（按URL）
    const seenUrls = new Set<string>();
    const uniqueResults = allResults.filter(r => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });
    
    res.json({
      success: true,
      data: uniqueResults,
      triedQueries: uniqueQueries // 返回尝试了哪些查询，方便调试
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
