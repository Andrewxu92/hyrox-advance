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
    run1: number;
    run2: number;
    run3: number;
    run4: number;
    run5: number;
    run6: number;
    run7: number;
    run8: number;
    skiErg: number;
    sledPush: number;
    burpeeBroadJump: number;
    rowing: number;
    farmersCarry: number;
    sandbagLunges: number;
    wallBalls: number;
  };
}

/**
 * 从hyresult.com抓取选手成绩
 */
export async function scrapeHyresult(athleteName: string, raceLocation?: string): Promise<ScrapedResult | null> {
  console.log(`Searching for athlete: ${athleteName}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // 1. 搜索选手
    const searchUrl = `https://www.hyresult.com/rankings?search=${encodeURIComponent(athleteName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待搜索结果加载 - 使用 waitForFunction 替代 waitForTimeout
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // 查找选手链接
    const athleteLinks: { name: string; url: string; location: string }[] = [];
    
    $('a[href*="/result/"]').each((_, elem) => {
      const href = $(elem).attr('href');
      const name = $(elem).text().trim();
      const location = $(elem).closest('tr, div').find('.location, [class*="location"]').text().trim();
      
      if (href && name && name.includes(athleteName)) {
        athleteLinks.push({
          name,
          url: href.startsWith('http') ? href : `https://www.hyresult.com${href}`,
          location
        });
      }
    });
    
    if (athleteLinks.length === 0) {
      console.log('No athletes found');
      return null;
    }
    
    let selectedAthlete = athleteLinks[0];
    if (raceLocation && athleteLinks.length > 1) {
      const locationMatch = athleteLinks.find(a => 
        a.location.toLowerCase().includes(raceLocation.toLowerCase())
      );
      if (locationMatch) selectedAthlete = locationMatch;
    }
    
    console.log(`Found athlete: ${selectedAthlete.name}`);
    
    // 2. 进入详情页
    await page.goto(selectedAthlete.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      await page.waitForSelector('[class*="time"], [class*="split"], table', { timeout: 10000 });
    } catch (e) {
      console.log('Timeout waiting for data');
    }
    
    const detailContent = await page.content();
    const $detail = cheerio.load(detailContent);
    
    const raceName = $detail('h1, .race-name, [class*="race-title"]').first().text().trim();
    const raceDate = $detail('[class*="date"], time').first().text().trim();
    const location = $detail('[class*="location"]').first().text().trim() || selectedAthlete.location;
    
    const totalTimeText = $detail('[class*="total-time"], [class*="finish-time"]').first().text().trim();
    const totalTime = parseTimeString(totalTimeText);
    
    const splits = extractSplits($detail);
    const gender = inferGender(selectedAthlete.name, $detail);
    
    return {
      athleteName: selectedAthlete.name,
      gender,
      raceName: raceName || 'HYROX Race',
      raceDate: raceDate || new Date().toISOString().split('T')[0],
      raceLocation: location || 'Unknown',
      totalTime: totalTime || 0,
      splits
    };
    
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  } finally {
    await browser.close();
  }
}

function extractSplits($: cheerio.CheerioAPI): ScrapedResult['splits'] {
  const splits: any = {
    run1: 0, run2: 0, run3: 0, run4: 0,
    run5: 0, run6: 0, run7: 0, run8: 0,
    skiErg: 0, sledPush: 0, burpeeBroadJump: 0, rowing: 0,
    farmersCarry: 0, sandbagLunges: 0, wallBalls: 0
  };
  
  const stationMap: Record<string, string> = {
    'ski': 'skiErg', 'sled push': 'sledPush', 'burpee': 'burpeeBroadJump',
    'row': 'rowing', 'farmer': 'farmersCarry', 'sandbag': 'sandbagLunges',
    'wall ball': 'wallBalls', 'run 1': 'run1', 'run 2': 'run2',
    'run 3': 'run3', 'run 4': 'run4', 'run 5': 'run5',
    'run 6': 'run6', 'run 7': 'run7', 'run 8': 'run8',
  };
  
  $('table tr, [class*="split"], [class*="time"]').each((_, elem) => {
    const text = $(elem).text().toLowerCase();
    const timeText = $(elem).find('td:last-child, span:last-child, div:last-child').text().trim();
    
    for (const [keyword, key] of Object.entries(stationMap)) {
      if (text.includes(keyword)) {
        const seconds = parseTimeString(timeText);
        if (seconds > 0) splits[key] = seconds;
      }
    }
  });
  
  return splits;
}

function parseTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  const num = parseFloat(timeStr);
  return isNaN(num) ? 0 : num;
}

function inferGender(name: string, $: cheerio.CheerioAPI): 'male' | 'female' {
  const pageText = $('body').text().toLowerCase();
  if (pageText.includes('women') || pageText.includes('female')) return 'female';
  if (pageText.includes('men') || pageText.includes('male')) return 'male';
  
  const femaleIndicators = ['娴', '婷', '娜', '丽', '芳', '敏', '静', '秀', '玲', '燕', '梅', '兰', '霞', '娟', '红', '艳', '妮', '媛', '琳', '洁', '萍', '雪', '颖', '慧', '雯', '茜', '萱', '怡', '欣', '悦'];
  
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  return 'male';
}

export async function searchAthleteResults(athleteName: string): Promise<{ name: string; url: string; location: string; date: string }[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const searchUrl = `https://www.hyresult.com/rankings?search=${encodeURIComponent(athleteName)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const results: { name: string; url: string; location: string; date: string }[] = [];
    
    $('a[href*="/result/"]').each((_, elem) => {
      const href = $(elem).attr('href');
      const name = $(elem).text().trim();
      const row = $(elem).closest('tr, div, [class*="row"]');
      const location = row.find('[class*="location"]').text().trim();
      const date = row.find('[class*="date"], time').text().trim();
      
      if (href && name) {
        results.push({
          name,
          url: href.startsWith('http') ? href : `https://www.hyresult.com${href}`,
          location,
          date
        });
      }
    });
    
    return results;
  } finally {
    await browser.close();
  }
}
