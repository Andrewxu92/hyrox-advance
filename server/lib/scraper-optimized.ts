// Optimized Scraper with Cache and Retry
// 优化版本：集成缓存和重试机制

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { getCachedData, setCachedData, scrapeWithCache } from './cache';
import { withRetry, scrapeWithTimeoutAndRetry, isRetryableError } from './retry';

export interface ScrapedResult {
  athleteName: string;
  gender: 'male' | 'female';
  raceName: string;
  raceDate: string;
  raceLocation: string;
  totalTime: number;
  splits: {
    run1: number; run2: number; run3: number; run4: number;
    run5: number; run6: number; run7: number; run8: number;
    skiErg: number; sledPush: number; sledPull: number; burpeeBroadJump: number; rowing: number;
    farmersCarry: number; sandbagLunges: number; wallBalls: number;
  };
}

// 浏览器实例（复用）
let browserInstance: puppeteer.Browser | null = null;

async function getBrowser(): Promise<puppeteer.Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browserInstance;
}

/**
 * 智能搜索 - 尝试多种姓名格式
 */
export async function searchAthleteResults(athleteName: string): Promise<{ 
  name: string; 
  url: string; 
  location: string; 
  date: string;
  exactMatch: boolean;
}[]> {
  console.log(`[Search] Starting search for: "${athleteName}"`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    // 访问搜索页面
    const searchUrl = `https://www.hyresult.com/rankings?search=${encodeURIComponent(athleteName)}`;
    console.log(`[Search] Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待搜索结果加载 - 尝试多种可能的选择器
    console.log('[Search] Waiting for results to load...');
    try {
      await page.waitForSelector('table tbody tr, .results-list, [data-testid="results"]', { 
        timeout: 5000 
      });
    } catch (e) {
      console.log('[Search] Selector timeout, proceeding anyway...');
    }
    
    // 额外等待确保 JS 渲染完成
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log(`[Search] Page loaded, content length: ${content.length}`);
    
    const results: { name: string; url: string; location: string; date: string; exactMatch: boolean }[] = [];
    
    // 尝试多种选择器查找结果
    $('table tbody tr, .result-row, [class*="result"]').each((_, row) => {
      const $row = $(row);
      
      // 查找姓名链接
      const $link = $row.find('a[href*="/result/"]').first();
      if (!$link.length) return;
      
      const href = $link.attr('href');
      const name = $link.text().trim();
      
      if (!href || !name) return;
      
      // 查找位置和日期
      const location = $row.find('td:nth-child(2), .location, [class*="location"]').text().trim();
      const date = $row.find('td:nth-child(3), .date, [class*="date"]').text().trim();
      
      // 检查是否是精确匹配
      const normalizedSearch = athleteName.toLowerCase().replace(/\s+/g, '');
      const normalizedName = name.toLowerCase().replace(/\s+/g, '');
      const exactMatch = normalizedName.includes(normalizedSearch) || 
                         normalizedSearch.includes(normalizedName);
      
      results.push({
        name,
        url: href.startsWith('http') ? href : `https://www.hyresult.com${href}`,
        location: location || 'Unknown',
        date: date || '',
        exactMatch
      });
    });
    
    console.log(`[Search] Found ${results.length} results`);
    
    // 排序：精确匹配优先
    results.sort((a, b) => (b.exactMatch ? 1 : 0) - (a.exactMatch ? 1 : 0));
    
    return results;
    
  } finally {
    await page.close();
  }
}

/**
 * 实际抓取逻辑（内部函数）
 */
async function scrapeFromResultUrlInternal(resultUrl: string): Promise<ScrapedResult | null> {
  console.log(`[ScrapeURL] Starting scrape from URL: "${resultUrl}"`);
  
  // 提取比赛 ID
  let resultId = resultUrl.trim();
  
  // 从完整 URL 中提取 ID
  const match = resultUrl.match(/\/result\/([A-Z0-9]+)/i);
  if (match) {
    resultId = match[1].toUpperCase();
  }
  
  // 验证 ID 格式（通常是大写字母 + 数字）
  if (!/^[A-Z0-9]{10,20}$/i.test(resultId)) {
    console.error(`[ScrapeURL] Invalid result ID format: ${resultId}`);
    return null;
  }
  
  resultId = resultId.toUpperCase();
  const fullUrl = `https://www.hyresult.com/result/${resultId}`;
  console.log(`[ScrapeURL] Fetching: ${fullUrl}`);
  
  return scrapeWithTimeoutAndRetry(
    async () => {
      const browser = await getBrowser();
      const page = await browser.newPage();
      
      try {
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // 等待页面内容加载
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const content = await page.content();
        const $ = cheerio.load(content);
        
        // 检查是否 404 或无效页面
        const pageTitle = $('title').text().toLowerCase();
        const h1Text = $('h1').first().text().trim();
        
        if (pageTitle.includes('404') || 
            pageTitle.includes('not found') || 
            h1Text.toLowerCase() === 'not found' ||
            h1Text.toLowerCase() === 'page not found' ||
            content.includes('Page not found') && h1Text.length < 20) {
          console.error('[ScrapeURL] Page not found');
          return null;
        }
        
        // 提取选手姓名
        const athleteName = h1Text;
        if (!athleteName || athleteName.length < 2) {
          console.error('[ScrapeURL] Could not find athlete name');
          return null;
        }
        
        console.log(`[ScrapeURL] Found athlete: ${athleteName}`);
        
        // 提取比赛信息
        const breadcrumb = $('nav[aria-label="breadcrumb"], .breadcrumb').text();
        const raceMatch = breadcrumb.match(/([^\/]+)\s+20\d\d/) || breadcrumb.match(/([^\/]+)\s+\d{4}/);
        const raceName = raceMatch ? raceMatch[0].trim() : 'HYROX Race';
        
        // 提取时间信息
        const totalTimeText = $('h1 + div, h1 + p, .total-time').first().text().match(/\d+:\d{2}:\d{2}|\d+:\d{2}/)?.[0] || '';
        const totalTime = parseTimeString(totalTimeText);
        
        // 提取分段数据
        const splits = await extractSplitsFromPage(page, $);
        const gender = inferGender(athleteName, $);
        
        console.log(`[ScrapeURL] Successfully scraped data for ${athleteName}`);
        
        return {
          athleteName,
          gender,
          raceName,
          raceDate: new Date().toISOString().split('T')[0],
          raceLocation: raceName,
          totalTime: totalTime || splits.run1 + splits.run2 + splits.run3 + splits.run4 + 
                      splits.run5 + splits.run6 + splits.run7 + splits.run8 +
                      splits.skiErg + splits.sledPush + splits.sledPull + splits.burpeeBroadJump + 
                      splits.rowing + splits.farmersCarry + splits.sandbagLunges + splits.wallBalls,
          splits
        };
      } finally {
        await page.close();
      }
    },
    { timeout: 60000, maxRetries: 3 }
  );
}

/**
 * 从比赛链接/ID 抓取数据（带缓存和重试）
 */
export async function scrapeFromResultUrl(resultUrl: string): Promise<ScrapedResult | null> {
  // 提取比赛 ID 作为缓存键
  let resultId = resultUrl.trim();
  const match = resultUrl.match(/\/result\/([A-Z0-9]+)/i);
  if (match) {
    resultId = match[1].toUpperCase();
  }
  
  const cacheKey = `hyresult:${resultId.toUpperCase()}`;
  
  // 使用缓存包装抓取函数
  return scrapeWithCache(
    cacheKey,
    () => scrapeFromResultUrlInternal(resultUrl),
    false // 不强制刷新
  );
}

/**
 * 从页面提取分段数据
 */
async function extractSplitsFromPage(page: puppeteer.Page, $: cheerio.CheerioAPI): Promise<ScrapedResult['splits']> {
  const splits: ScrapedResult['splits'] = {
    run1: 0, run2: 0, run3: 0, run4: 0,
    run5: 0, run6: 0, run7: 0, run8: 0,
    skiErg: 0, sledPush: 0, sledPull: 0, burpeeBroadJump: 0, rowing: 0,
    farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
  };
  
  try {
    // 尝试点击"Splits"标签
    const splitsTabHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="tab"], a'));
      return buttons.find(el => el.textContent?.includes('Splits'));
    });
    
    if (splitsTabHandle) {
      const element = splitsTabHandle.asElement();
      if (element) {
        await element.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 重新获取内容
    const content = await page.content();
    $ = cheerio.load(content);
    
    // 从 Splits 表格提取数据
    const rows = $('table tr, [role="row"]');
    const stationTimes: Record<string, { in: number; out: number }> = {};
    
    rows.each((_, row) => {
      const $row = $(row);
      const text = $row.text();
      const cells = $row.find('td, [role="cell"]');
      
      if (cells.length >= 4) {
        const splitName = cells.eq(0).text().trim();
        const timeText = cells.eq(2).text().trim();
        
        // 识别各站点
        const stationMapping: Record<string, string> = {
          'SkiErg': 'skiErg',
          'Sled Push': 'sledPush',
          'Sled Pull': 'sledPull',
          'Burpee': 'burpeeBroadJump',
          'Row': 'rowing',
          'Farmers': 'farmersCarry',
          'Sandbag': 'sandbagLunges',
          'Wall Ball': 'wallBalls'
        };
        
        for (const [keyword, station] of Object.entries(stationMapping)) {
          if (splitName.includes(keyword)) {
            const time = parseTimeString(timeText);
            if (time > 0) {
              if (splitName.includes('Out')) {
                stationTimes[station] = { ...stationTimes[station], out: time };
              } else if (splitName.includes('In')) {
                stationTimes[station] = { ...stationTimes[station], in: time };
              }
            }
            break;
          }
        }
      }
    });
    
    // 计算各站点耗时 (Out - In)
    if (stationTimes['skiErg']?.in && stationTimes['skiErg']?.out) {
      splits.skiErg = stationTimes['skiErg'].out - stationTimes['skiErg'].in;
    }
    if (stationTimes['sledPush']?.in && stationTimes['sledPush']?.out) {
      splits.sledPush = stationTimes['sledPush'].out - stationTimes['sledPush'].in;
    }
    if (stationTimes['sledPull']?.in && stationTimes['sledPull']?.out) {
      splits.sledPull = stationTimes['sledPull'].out - stationTimes['sledPull'].in;
    }
    if (stationTimes['burpee']?.in && stationTimes['burpee']?.out) {
      splits.burpeeBroadJump = stationTimes['burpee'].out - stationTimes['burpee'].in;
    }
    if (stationTimes['row']?.in && stationTimes['row']?.out) {
      splits.rowing = stationTimes['row'].out - stationTimes['row'].in;
    }
    if (stationTimes['farmers']?.in && stationTimes['farmers']?.out) {
      splits.farmersCarry = stationTimes['farmers'].out - stationTimes['farmers'].in;
    }
    if (stationTimes['sandbag']?.in && stationTimes['sandbag']?.out) {
      splits.sandbagLunges = stationTimes['sandbag'].out - stationTimes['sandbag'].in;
    }
    if (stationTimes['wallBalls']?.in && stationTimes['wallBalls']?.out) {
      splits.wallBalls = stationTimes['wallBalls'].out - stationTimes['wallBalls'].in;
    }
    
    // 提取跑步时间
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="tab"], a'));
        const runningTab = buttons.find(el => el.textContent?.includes('Running'));
        if (runningTab) (runningTab as HTMLElement).click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const runningTimes = await page.evaluate(() => {
        const times: Record<string, string> = {};
        const bodyText = document.body.innerText;
        
        for (let i = 1; i <= 8; i++) {
          const patterns = [
            new RegExp(`Running ${i}[\\s\\n]+(\\d{1,2}:\\d{2})`),
            new RegExp(`Running ${i}[^\\d]*?(\\d{1,2}:\\d{2})`),
          ];
          
          for (const pattern of patterns) {
            const match = bodyText.match(pattern);
            if (match) {
              times[`run${i}`] = match[1];
              break;
            }
          }
        }
        
        return times;
      });
      
      for (let i = 1; i <= 8; i++) {
        const timeStr = runningTimes[`run${i}`];
        if (timeStr) {
          (splits as any)[`run${i}`] = parseTimeString(timeStr);
        }
      }
      
      console.log('[ScrapeURL] Running times extracted:', runningTimes);
    } catch (e) {
      console.log('[ScrapeURL] Error extracting running times:', e);
    }
    
  } catch (error) {
    console.error('[extractSplits] Error:', error);
  }
  
  return splits;
}

function parseTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  timeStr = timeStr.trim();
  
  const match = timeStr.match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  const num = parseFloat(timeStr);
  if (!isNaN(num) && num > 0) return num;
  
  return 0;
}

function inferGender(name: string, $: cheerio.CheerioAPI): 'male' | 'female' {
  const pageText = $('body').text().toLowerCase();
  
  if (pageText.includes('women') || pageText.includes('female') || pageText.includes('womens')) return 'female';
  if (pageText.includes('men') || pageText.includes('male') || pageText.includes('mens')) return 'male';
  
  const femaleIndicators = ['娴', '婷', '娜', '丽', '芳', '敏', '静', '秀', '玲', '燕', '梅', '兰', '霞', '娟', '红', '艳', '妮', '媛', '琳', '洁', '萍', '雪', '颖', '慧', '雯', '茜', '萱', '怡', '欣', '悦', '娇', '娥', '婉'];
  
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  
  return 'male';
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// 导出内部函数用于测试
export { scrapeFromResultUrlInternal, parseTimeString };
