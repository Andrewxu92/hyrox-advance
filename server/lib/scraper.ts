import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

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
      // 等待表格或结果列表出现
      await page.waitForSelector('table tbody tr, .results-list, [data-testid="results"]', { 
        timeout: 5000 
      });
    } catch (e) {
      console.log('[Search] Selector timeout, proceeding anyway...');
    }
    
    // 额外等待确保JS渲染完成
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // 调试：保存页面内容
    console.log(`[Search] Page loaded, content length: ${content.length}`);
    
    const results: { name: string; url: string; location: string; date: string; exactMatch: boolean }[] = [];
    
    // 尝试多种选择器查找结果
    // 选择器1: 表格行
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
    
    // 选择器2: 直接查找所有结果链接
    if (results.length === 0) {
      $('a[href*="/result/"]').each((_, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const name = $elem.text().trim();
        
        if (!href || !name || name.length < 2) return;
        
        // 过滤掉非选手链接（如导航链接）
        if (name.length > 50 || name.includes('HYROX') || name.includes('Privacy')) return;
        
        const parent = $elem.parent().parent();
        const location = parent.find('td:eq(1), td:eq(2), .location').text().trim();
        const date = parent.find('td:eq(2), td:eq(3), .date').text().trim();
        
        const normalizedSearch = athleteName.toLowerCase().replace(/\s+/g, '');
        const normalizedName = name.toLowerCase().replace(/\s+/g, '');
        const exactMatch = normalizedName.includes(normalizedSearch) || 
                           normalizedSearch.includes(normalizedName);
        
        // 去重
        if (!results.find(r => r.url === href)) {
          results.push({
            name,
            url: href.startsWith('http') ? href : `https://www.hyresult.com${href}`,
            location: location || 'Unknown',
            date: date || '',
            exactMatch
          });
        }
      });
    }
    
    console.log(`[Search] Found ${results.length} results`);
    
    // 排序：精确匹配优先
    results.sort((a, b) => (b.exactMatch ? 1 : 0) - (a.exactMatch ? 1 : 0));
    
    return results;
    
  } finally {
    await page.close();
  }
}

/**
 * 从比赛链接/ID抓取数据
 * 支持格式:
 * - https://www.hyresult.com/result/LR3MS4JI44D0BD
 * - https://hyresult.com/result/LR3MS4JI44D0BD
 * - LR3MS4JI44D0BD (纯ID)
 */
export async function scrapeFromResultUrl(resultUrl: string): Promise<ScrapedResult | null> {
  console.log(`[ScrapeURL] Starting scrape from URL: "${resultUrl}"`);
  
  // 提取比赛ID
  let resultId = resultUrl.trim();
  
  // 从完整URL中提取ID
  const match = resultUrl.match(/\/result\/([A-Z0-9]+)/i);
  if (match) {
    resultId = match[1].toUpperCase();
  }
  
  // 验证ID格式（通常是大写字母+数字）
  if (!/^[A-Z0-9]{10,20}$/i.test(resultId)) {
    console.error(`[ScrapeURL] Invalid result ID format: ${resultId}`);
    return null;
  }
  
  resultId = resultId.toUpperCase();
  const fullUrl = `https://www.hyresult.com/result/${resultId}`;
  console.log(`[ScrapeURL] Fetching: ${fullUrl}`);
  
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
    
    // 检查是否404或无效页面（更精确的判断）
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
    
    // 提取选手姓名（h1标题）
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
    
  } catch (error) {
    console.error('[ScrapeURL] Error:', error);
    return null;
  } finally {
    await page.close();
  }
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
    // 尝试点击"Splits"标签（使用evaluate查找）
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
    
    // 从Splits表格提取数据
    // 查找包含"SkiErg In/Out", "Sled Push In/Out"等关键字的行
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
        if (splitName.includes('SkiErg')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['skiErg'] = { ...stationTimes['skiErg'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['skiErg'] = { ...stationTimes['skiErg'], in: time };
            }
          }
        }
        
        if (splitName.includes('Sled Push')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['sledPush'] = { ...stationTimes['sledPush'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['sledPush'] = { ...stationTimes['sledPush'], in: time };
            }
          }
        }
        
        if (splitName.includes('Sled Pull')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['sledPull'] = { ...stationTimes['sledPull'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['sledPull'] = { ...stationTimes['sledPull'], in: time };
            }
          }
        }
        
        if (splitName.includes('Burpee')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['burpee'] = { ...stationTimes['burpee'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['burpee'] = { ...stationTimes['burpee'], in: time };
            }
          }
        }
        
        if (splitName.includes('Row')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['row'] = { ...stationTimes['row'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['row'] = { ...stationTimes['row'], in: time };
            }
          }
        }
        
        if (splitName.includes('Farmers')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['farmers'] = { ...stationTimes['farmers'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['farmers'] = { ...stationTimes['farmers'], in: time };
            }
          }
        }
        
        if (splitName.includes('Sandbag') || splitName.includes('Lunges')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['sandbag'] = { ...stationTimes['sandbag'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['sandbag'] = { ...stationTimes['sandbag'], in: time };
            }
          }
        }
        
        if (splitName.includes('Wall Ball')) {
          const time = parseTimeString(timeText);
          if (time > 0) {
            if (splitName.includes('Out')) {
              stationTimes['wallBalls'] = { ...stationTimes['wallBalls'], out: time };
            } else if (splitName.includes('In')) {
              stationTimes['wallBalls'] = { ...stationTimes['wallBalls'], in: time };
            }
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
    
    // 提取跑步时间（从Running标签）
    try {
      // 点击 Running 标签
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="tab"], a'));
        const runningTab = buttons.find(el => el.textContent?.includes('Running'));
        if (runningTab) (runningTab as HTMLElement).click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 方法4: 直接从页面innerText中提取
      const runningTimes = await page.evaluate(() => {
        const times: Record<string, string> = {};
        const bodyText = document.body.innerText;
        
        // 匹配 "Running X\n02:53" 或 "Running X 02:53" 格式
        for (let i = 1; i <= 8; i++) {
          // 尝试多种可能的格式
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
      
      // 将提取的时间转换为秒
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

/**
 * 抓取选手详情
 */
export async function scrapeHyresult(athleteName: string, raceLocation?: string): Promise<ScrapedResult | null> {
  console.log(`[Scrape] Starting scrape for: "${athleteName}"`);
  
  // 1. 先搜索
  const searchResults = await searchAthleteResults(athleteName);
  
  if (searchResults.length === 0) {
    console.log('[Scrape] No search results found');
    return null;
  }
  
  console.log(`[Scrape] Found ${searchResults.length} search results`);
  
  // 2. 选择最佳匹配
  let selectedResult = searchResults[0];
  
  // 如果有位置信息，尝试匹配
  if (raceLocation && searchResults.length > 1) {
    const locationMatch = searchResults.find(r => 
      r.location.toLowerCase().includes(raceLocation.toLowerCase())
    );
    if (locationMatch) {
      selectedResult = locationMatch;
      console.log(`[Scrape] Matched by location: ${selectedResult.location}`);
    }
  }
  
  // 优先选择精确匹配
  const exactMatch = searchResults.find(r => r.exactMatch);
  if (exactMatch) {
    selectedResult = exactMatch;
    console.log(`[Scrape] Using exact match: ${selectedResult.name}`);
  }
  
  console.log(`[Scrape] Selected: ${selectedResult.name} at ${selectedResult.url}`);
  
  // 3. 抓取详情页
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.goto(selectedResult.url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待数据加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // 提取数据
    const raceName = $('h1').first().text().trim() || 
                     $('.race-name').first().text().trim() || 
                     'HYROX Race';
    
    const raceDate = $('.date, time').first().text().trim() || selectedResult.date;
    const location = $('.location').first().text().trim() || selectedResult.location;
    
    const totalTimeText = $('.total-time, .finish-time, [class*="time"]').first().text().trim();
    const totalTime = parseTimeString(totalTimeText);
    
    const splits = extractSplits($);
    const gender = inferGender(selectedResult.name, $);
    
    console.log(`[Scrape] Successfully scraped data for ${selectedResult.name}`);
    
    return {
      athleteName: selectedResult.name,
      gender,
      raceName,
      raceDate: raceDate || new Date().toISOString().split('T')[0],
      raceLocation: location || 'Unknown',
      totalTime: totalTime || 0,
      splits
    };
    
  } catch (error) {
    console.error('[Scrape] Error:', error);
    return null;
  } finally {
    await page.close();
  }
}

function extractSplits($: cheerio.CheerioAPI): ScrapedResult['splits'] {
  const splits: any = {
    run1: 0, run2: 0, run3: 0, run4: 0,
    run5: 0, run6: 0, run7: 0, run8: 0,
    skiErg: 0, sledPush: 0, sledPull: 0, burpeeBroadJump: 0, rowing: 0,
    farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
  };
  
  const stationMap: Record<string, string> = {
    'ski': 'skiErg', 'ski erg': 'skiErg', 'skierg': 'skiErg',
    'sled push': 'sledPush', 'sled': 'sledPush',
    'burpee': 'burpeeBroadJump', 'burpee broad jump': 'burpeeBroadJump',
    'row': 'rowing', 'rowing': 'rowing',
    'farmer': 'farmersCarry', "farmer's carry": 'farmersCarry',
    'sandbag': 'sandbagLunges', 'lunges': 'sandbagLunges',
    'wall ball': 'wallBalls', 'wall balls': 'wallBalls',
  };
  
  // 查找所有包含时间数据的行
  $('table tr, .split-row, [class*="split"]').each((_, elem) => {
    const $row = $(elem);
    const text = $row.text().toLowerCase();
    
    // 查找跑步时间
    for (let i = 1; i <= 8; i++) {
      if (text.includes(`run ${i}`) || text.includes(`run${i}`) || text.includes(`跑步 ${i}`)) {
        const timeText = $row.find('td:last-child, .time, span:last-child').text().trim();
        const seconds = parseTimeString(timeText);
        if (seconds > 0) splits[`run${i}`] = seconds;
      }
    }
    
    // 查找Station时间
    for (const [keyword, key] of Object.entries(stationMap)) {
      if (text.includes(keyword)) {
        const timeText = $row.find('td:last-child, .time, span:last-child').text().trim();
        const seconds = parseTimeString(timeText);
        if (seconds > 0 && splits[key] === 0) {
          splits[key] = seconds;
        }
      }
    }
  });
  
  return splits;
}

function parseTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  timeStr = timeStr.trim();
  
  // 格式: HH:MM:SS 或 MM:SS 或 M:SS
  const match = timeStr.match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  // 纯数字（秒）
  const num = parseFloat(timeStr);
  if (!isNaN(num) && num > 0) return num;
  
  return 0;
}

function inferGender(name: string, $: cheerio.CheerioAPI): 'male' | 'female' {
  const pageText = $('body').text().toLowerCase();
  
  // 从页面内容判断
  if (pageText.includes('women') || pageText.includes('female') || pageText.includes('womens')) return 'female';
  if (pageText.includes('men') || pageText.includes('male') || pageText.includes('mens')) return 'male';
  
  // 从名字判断（常见女性名字特征）
  const femaleIndicators = ['娴', '婷', '娜', '丽', '芳', '敏', '静', '秀', '玲', '燕', '梅', '兰', '霞', '娟', '红', '艳', '妮', '媛', '琳', '洁', '萍', '雪', '颖', '慧', '雯', '茜', '萱', '怡', '欣', '悦', '娇', '娥', '婉', '妮'];
  
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  
  return 'male';
}

// 清理浏览器（可选）
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}