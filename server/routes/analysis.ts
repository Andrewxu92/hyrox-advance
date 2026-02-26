import { Router } from 'express';
import { generateAnalysis, AthleteInfo, HyroxSplits } from '../lib/openai.js';
import { calculateTotalTime, formatTime, determineLevel, getBenchmarks, STATION_DISPLAY_NAMES } from '../lib/hyrox-data.js';

const router = Router();

// POST /api/analysis - Generate AI analysis
router.post('/', async (req, res) => {
  try {
    const { splits, athleteInfo } = req.body;
    
    // Validate input
    if (!splits || !athleteInfo) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required data: splits and athleteInfo are required' 
      });
    }

    // Validate splits has all required fields
    const requiredSplits = [
      'run1', 'skiErg', 'run2', 'sledPush',
      'run3', 'burpeeBroadJump', 'run4', 'rowing',
      'run5', 'farmersCarry', 'run6', 'sandbagLunges',
      'run7', 'wallBalls', 'run8'
    ];
    
    const missingSplits = requiredSplits.filter(key => !(key in splits) || splits[key] == null);
    if (missingSplits.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing splits: ${missingSplits.join(', ')}`
      });
    }

    // Validate athleteInfo
    if (!athleteInfo.gender || !['male', 'female'].includes(athleteInfo.gender)) {
      return res.status(400).json({
        success: false,
        error: 'athleteInfo.gender must be "male" or "female"'
      });
    }

    // Generate analysis
    const analysis = await generateAnalysis(splits as HyroxSplits, athleteInfo as AthleteInfo);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analysis route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/analysis/quick - Quick analysis without AI (for instant feedback)
router.post('/quick', async (req, res) => {
  try {
    const { splits, athleteInfo } = req.body;
    
    if (!splits || !athleteInfo?.gender) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data'
      });
    }

    const totalTime = calculateTotalTime(splits);
    const level = determineLevel(totalTime, athleteInfo.gender);
    const benchmarks = getBenchmarks(athleteInfo.gender);

    // Calculate station performance vs benchmarks
    const stationAnalysis = [];
    for (const [key, time] of Object.entries(splits)) {
      if (key.startsWith('run')) continue;
      
      const stationBenchmark = benchmarks[level].stations[key];
      if (stationBenchmark) {
        const avgBenchmark = (stationBenchmark.min + stationBenchmark.max) / 2;
        stationAnalysis.push({
          station: key,
          displayName: STATION_DISPLAY_NAMES[key] || key,
          time: time as number,
          formattedTime: formatTime(time as number),
          benchmark: avgBenchmark,
          gap: (time as number) - avgBenchmark
        });
      }
    }

    // Sort by performance (fastest first)
    stationAnalysis.sort((a, b) => a.time - b.time);

    // Analyze run pacing
    const runTimes = [
      splits.run1, splits.run2, splits.run3, splits.run4,
      splits.run5, splits.run6, splits.run7, splits.run8
    ];
    const firstRun = runTimes[0];
    const lastRun = runTimes[runTimes.length - 1];
    const avgRun = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;

    res.json({
      success: true,
      data: {
        totalTime,
        formattedTotalTime: formatTime(totalTime),
        level,
        stations: stationAnalysis,
        runAnalysis: {
          runs: runTimes.map((time, i) => ({
            runNumber: i + 1,
            time,
            formattedTime: formatTime(time),
            vsFirstRun: time - firstRun
          })),
          firstRun,
          lastRun,
          degradation: lastRun - firstRun,
          average: avgRun
        }
      }
    });
  } catch (error) {
    console.error('Quick analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quick analysis'
    });
  }
});

// GET /api/analysis/benchmarks - Get benchmark data
router.get('/benchmarks', (req, res) => {
  const { gender = 'male' } = req.query;
  
  if (!['male', 'female'].includes(gender as string)) {
    return res.status(400).json({
      success: false,
      error: 'gender must be "male" or "female"'
    });
  }

  const benchmarks = getBenchmarks(gender as 'male' | 'female');
  
  res.json({
    success: true,
    data: benchmarks
  });
});

export default router;
