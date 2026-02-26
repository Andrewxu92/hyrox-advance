// server/index.ts
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

// server/routes/analysis.ts
import { Router } from "express";

// server/lib/openai.ts
import OpenAI from "openai";

// server/lib/hyrox-data.ts
var STATION_DISPLAY_NAMES = {
  skiErg: "SkiErg",
  sledPush: "Sled Push",
  burpeeBroadJump: "Burpee Broad Jump",
  rowing: "Rowing",
  farmersCarry: "Farmer's Carry",
  sandbagLunges: "Sandbag Lunges",
  wallBalls: "Wall Balls"
};
var MALE_BENCHMARKS = {
  elite: {
    totalTime: { min: 55 * 60, max: 60 * 60 },
    stations: {
      skiErg: { min: 3 * 60, max: 3 * 60 + 30 },
      sledPush: { min: 2 * 60 + 30, max: 3 * 60 },
      burpeeBroadJump: { min: 2 * 60 + 30, max: 3 * 60 },
      rowing: { min: 3 * 60, max: 3 * 60 + 30 },
      farmersCarry: { min: 2 * 60 + 30, max: 3 * 60 },
      sandbagLunges: { min: 3 * 60, max: 3 * 60 + 30 },
      wallBalls: { min: 3 * 60, max: 3 * 60 + 30 }
    }
  },
  intermediate: {
    totalTime: { min: 75 * 60, max: 85 * 60 },
    stations: {
      skiErg: { min: 4 * 60, max: 5 * 60 },
      sledPush: { min: 3 * 60, max: 4 * 60 },
      burpeeBroadJump: { min: 3 * 60, max: 4 * 60 },
      rowing: { min: 4 * 60, max: 5 * 60 },
      farmersCarry: { min: 3 * 60, max: 4 * 60 },
      sandbagLunges: { min: 4 * 60, max: 5 * 60 },
      wallBalls: { min: 4 * 60, max: 5 * 60 }
    }
  },
  beginner: {
    totalTime: { min: 90 * 60, max: 110 * 60 },
    stations: {
      skiErg: { min: 5 * 60, max: 6 * 60 },
      sledPush: { min: 4 * 60, max: 5 * 60 + 30 },
      burpeeBroadJump: { min: 4 * 60, max: 5 * 60 + 30 },
      rowing: { min: 5 * 60, max: 6 * 60 },
      farmersCarry: { min: 4 * 60, max: 5 * 60 + 30 },
      sandbagLunges: { min: 5 * 60, max: 6 * 60 + 30 },
      wallBalls: { min: 5 * 60, max: 6 * 60 + 30 }
    }
  }
};
var FEMALE_BENCHMARKS = {
  elite: {
    totalTime: { min: 60 * 60, max: 65 * 60 },
    stations: {
      skiErg: { min: 3 * 60 + 15, max: 3 * 60 + 45 },
      sledPush: { min: 2 * 60 + 45, max: 3 * 60 + 15 },
      burpeeBroadJump: { min: 2 * 60 + 45, max: 3 * 60 + 15 },
      rowing: { min: 3 * 60 + 15, max: 3 * 60 + 45 },
      farmersCarry: { min: 2 * 60 + 45, max: 3 * 60 + 15 },
      sandbagLunges: { min: 3 * 60 + 15, max: 3 * 60 + 45 },
      wallBalls: { min: 3 * 60 + 15, max: 3 * 60 + 45 }
    }
  },
  intermediate: {
    totalTime: { min: 80 * 60, max: 95 * 60 },
    stations: {
      skiErg: { min: 4 * 60 + 30, max: 5 * 60 + 30 },
      sledPush: { min: 3 * 60 + 30, max: 4 * 60 + 30 },
      burpeeBroadJump: { min: 3 * 60 + 30, max: 4 * 60 + 30 },
      rowing: { min: 4 * 60 + 30, max: 5 * 60 + 30 },
      farmersCarry: { min: 3 * 60 + 30, max: 4 * 60 + 30 },
      sandbagLunges: { min: 4 * 60 + 30, max: 5 * 60 + 30 },
      wallBalls: { min: 4 * 60 + 30, max: 5 * 60 + 30 }
    }
  },
  beginner: {
    totalTime: { min: 100 * 60, max: 120 * 60 },
    stations: {
      skiErg: { min: 6 * 60, max: 7 * 60 },
      sledPush: { min: 5 * 60, max: 6 * 60 + 30 },
      burpeeBroadJump: { min: 5 * 60, max: 6 * 60 + 30 },
      rowing: { min: 6 * 60, max: 7 * 60 },
      farmersCarry: { min: 5 * 60, max: 6 * 60 + 30 },
      sandbagLunges: { min: 6 * 60, max: 7 * 60 + 30 },
      wallBalls: { min: 6 * 60, max: 7 * 60 + 30 }
    }
  }
};
var RUN_BENCHMARKS = {
  elite: { min: 3 * 60 + 30, max: 4 * 60 },
  intermediate: { min: 4 * 60 + 30, max: 5 * 60 },
  beginner: { min: 5 * 60 + 30, max: 7 * 60 }
};
function getBenchmarks(gender) {
  return gender === "male" ? MALE_BENCHMARKS : FEMALE_BENCHMARKS;
}
function determineLevel(totalTime, gender) {
  const benchmarks = getBenchmarks(gender);
  if (totalTime <= benchmarks.elite.totalTime.max) {
    return "elite";
  } else if (totalTime <= benchmarks.intermediate.totalTime.max) {
    return "intermediate";
  } else {
    return "beginner";
  }
}
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
function calculateTotalTime(splits) {
  let total = 0;
  for (const key in splits) {
    total += splits[key] || 0;
  }
  return total;
}

// server/lib/openai.ts
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});
async function generateAnalysis(splits, athleteInfo) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, using mock analysis");
    return generateMockAnalysis(splits, athleteInfo);
  }
  const totalTime = calculateTotalTime(splits);
  const level = determineLevel(totalTime, athleteInfo.gender);
  const benchmarks = getBenchmarks(athleteInfo.gender);
  const stationAnalysis = [];
  for (const [key, time] of Object.entries(splits)) {
    if (key.startsWith("run")) continue;
    const stationBenchmark = benchmarks[level].stations[key];
    if (stationBenchmark) {
      const avgBenchmark = (stationBenchmark.min + stationBenchmark.max) / 2;
      stationAnalysis.push({
        station: key,
        displayName: STATION_DISPLAY_NAMES[key] || key,
        time,
        gap: time - avgBenchmark
      });
    }
  }
  stationAnalysis.sort((a, b) => b.gap - a.gap);
  const weaknesses = stationAnalysis.filter((s) => s.gap > 0).slice(0, 3).map((s) => ({
    ...s,
    formattedTime: formatTime(s.time),
    gapPercent: Math.round(s.gap / s.time * 100)
  }));
  const strengths = stationAnalysis.filter((s) => s.gap <= 0).slice(0, 2).map((s) => ({
    ...s,
    formattedTime: formatTime(s.time),
    advantage: Math.abs(s.gap)
  }));
  const runTimes = [
    splits.run1,
    splits.run2,
    splits.run3,
    splits.run4,
    splits.run5,
    splits.run6,
    splits.run7,
    splits.run8
  ];
  const pacingAnalysis = analyzePacing(runTimes);
  const prompt = buildAnalysisPrompt(splits, athleteInfo, totalTime, level, weaknesses, strengths, pacingAnalysis);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert HYROX coach with deep knowledge of fitness training, race strategy, and performance analysis. Provide detailed, actionable advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2e3
    });
    const aiContent = response.choices[0]?.message?.content || "";
    let aiData = {};
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (e) {
      console.log("Could not parse AI JSON response, using text extraction");
    }
    const levelScore = level === "elite" ? 90 : level === "intermediate" ? 70 : 50;
    const consistencyBonus = calculateConsistencyBonus(runTimes);
    const overallScore = Math.min(100, Math.max(0, levelScore + consistencyBonus));
    return {
      level,
      overallScore: Math.round(overallScore),
      totalTime,
      formattedTotalTime: formatTime(totalTime),
      weaknesses,
      strengths,
      pacingAnalysis: {
        runs: pacingAnalysis.runs.map((r, i) => ({
          runNumber: i + 1,
          time: r.time,
          formattedTime: formatTime(r.time),
          vsFirstRun: r.vsFirst,
          trend: r.trend
        })),
        summary: pacingAnalysis.summary
      },
      recommendations: aiData.recommendations || generateDefaultRecommendations(weaknesses),
      aiSummary: aiData.summary || aiContent.slice(0, 500) || generateSummary(level, weaknesses, pacingAnalysis),
      predictedImprovement: aiData.predictedImprovement || "5-10% improvement possible with consistent training"
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return generateMockAnalysis(splits, athleteInfo);
  }
}
function buildAnalysisPrompt(splits, athleteInfo, totalTime, level, weaknesses, strengths, pacingAnalysis) {
  return `You are a HYROX coach analyzing an athlete's race data.

Athlete Info:
- Gender: ${athleteInfo.gender}
- Age: ${athleteInfo.age || "Not specified"}
- Weight: ${athleteInfo.weight ? athleteInfo.weight + "kg" : "Not specified"}
- Experience: ${athleteInfo.experience || "Not specified"}

Race Data:
- Total Time: ${formatTime(totalTime)} (${level} level)

Splits:
- Run 1: ${formatTime(splits.run1)}
- Station 1 (SkiErg): ${formatTime(splits.skiErg)}
- Run 2: ${formatTime(splits.run2)}
- Station 2 (Sled Push): ${formatTime(splits.sledPush)}
- Run 3: ${formatTime(splits.run3)}
- Station 3 (Burpee Broad Jump): ${formatTime(splits.burpeeBroadJump)}
- Run 4: ${formatTime(splits.run4)}
- Station 4 (Rowing): ${formatTime(splits.rowing)}
- Run 5: ${formatTime(splits.run5)}
- Station 5 (Farmer's Carry): ${formatTime(splits.farmersCarry)}
- Run 6: ${formatTime(splits.run6)}
- Station 6 (Sandbag Lunges): ${formatTime(splits.sandbagLunges)}
- Run 7: ${formatTime(splits.run7)}
- Station 7 (Wall Balls): ${formatTime(splits.wallBalls)}
- Run 8: ${formatTime(splits.run8)}

Weaknesses Identified:
${weaknesses.map((w, i) => `${i + 1}. ${w.displayName}: ${w.formattedTime} (+${formatTime(w.gap)} vs benchmark)`).join("\n")}

Strengths Identified:
${strengths.map((s, i) => `${i + 1}. ${s.displayName}: ${s.formattedTime} (${formatTime(s.advantage)} faster)`).join("\n")}

Pacing Analysis:
${pacingAnalysis.summary}

Analyze and provide:
1. Overall performance level assessment
2. Top 3 weaknesses with specific time gaps vs benchmarks
3. Top 2 strengths  
4. Pacing analysis - did they start too fast? fade at end?
5. 3 specific, actionable training recommendations
6. Predicted time improvement if they follow recommendations

Format as JSON with fields: level, weaknesses[], strengths[], pacingAnalysis, recommendations[], predictedImprovement, summary`;
}
function analyzePacing(runTimes) {
  const firstRun = runTimes[0];
  const lastRun = runTimes[runTimes.length - 1];
  const avgRun = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
  const runs = runTimes.map((time, index) => {
    const vsFirst = time - firstRun;
    let trend = "steady";
    if (index > 0) {
      if (time < runTimes[index - 1]) {
        trend = "fast";
      } else if (time > runTimes[index - 1] + 15) {
        trend = "slowing";
      }
    }
    return { time, vsFirst, trend };
  });
  let summary = "";
  const degradation = lastRun - firstRun;
  const maxVariation = Math.max(...runTimes) - Math.min(...runTimes);
  if (degradation > 60) {
    summary = `Significant fade - ${formatTime(degradation)} slower on final run vs first. Focus on endurance training.`;
  } else if (degradation > 30) {
    summary = `Moderate fade of ${formatTime(degradation)}. Good pacing but could improve stamina for late race.`;
  } else if (maxVariation < 30) {
    summary = "Excellent pacing consistency! Very even splits throughout the race.";
  } else {
    summary = "Generally steady pacing with some variation. Solid race execution.";
  }
  return { runs, summary, degradation, maxVariation };
}
function calculateConsistencyBonus(runTimes) {
  const avg = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
  const variance = runTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / runTimes.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev < 15) return 10;
  if (stdDev < 30) return 5;
  if (stdDev < 45) return 0;
  return -5;
}
function generateSummary(level, weaknesses, pacingAnalysis) {
  const levelText = level === "elite" ? "elite-level athlete" : level === "intermediate" ? "solid intermediate performer" : "beginner with good potential";
  const weaknessText = weaknesses.length > 0 ? `Focus on ${weaknesses[0].displayName} as primary weakness.` : "Good overall balance across stations.";
  return `You are a ${levelText}. ${weaknessText} ${pacingAnalysis.summary}`;
}
function generateDefaultRecommendations(weaknesses) {
  const recommendations = [
    {
      priority: 1,
      area: "Technique",
      suggestion: "Focus on efficient movement patterns and transitions",
      expectedImprovement: "2-3 minutes"
    },
    {
      priority: 2,
      area: "Strength",
      suggestion: "Build functional strength for key stations",
      expectedImprovement: "3-5 minutes"
    },
    {
      priority: 3,
      area: "Endurance",
      suggestion: "Improve cardiovascular capacity for consistent pacing",
      expectedImprovement: "2-4 minutes"
    }
  ];
  if (weaknesses.length > 0) {
    recommendations[0].area = weaknesses[0].displayName;
    recommendations[0].suggestion = `Prioritize ${weaknesses[0].displayName} training with dedicated sessions 2x per week`;
  }
  return recommendations;
}
function generateMockAnalysis(splits, athleteInfo) {
  const totalTime = calculateTotalTime(splits);
  const level = determineLevel(totalTime, athleteInfo.gender);
  return {
    level,
    overallScore: 70,
    totalTime,
    formattedTotalTime: formatTime(totalTime),
    weaknesses: [
      {
        station: "sledPush",
        displayName: "Sled Push",
        time: splits.sledPush,
        formattedTime: formatTime(splits.sledPush),
        gap: 45,
        gapPercent: 18
      },
      {
        station: "wallBalls",
        displayName: "Wall Balls",
        time: splits.wallBalls,
        formattedTime: formatTime(splits.wallBalls),
        gap: 38,
        gapPercent: 14
      }
    ],
    strengths: [
      {
        station: "rowing",
        displayName: "Rowing",
        time: splits.rowing,
        formattedTime: formatTime(splits.rowing),
        advantage: 25
      }
    ],
    pacingAnalysis: {
      runs: [
        { runNumber: 1, time: splits.run1, formattedTime: formatTime(splits.run1), vsFirstRun: 0, trend: "steady" },
        { runNumber: 2, time: splits.run2, formattedTime: formatTime(splits.run2), vsFirstRun: 10, trend: "steady" },
        { runNumber: 3, time: splits.run3, formattedTime: formatTime(splits.run3), vsFirstRun: 25, trend: "slowing" },
        { runNumber: 4, time: splits.run4, formattedTime: formatTime(splits.run4), vsFirstRun: 35, trend: "slowing" },
        { runNumber: 5, time: splits.run5, formattedTime: formatTime(splits.run5), vsFirstRun: 45, trend: "slowing" },
        { runNumber: 6, time: splits.run6, formattedTime: formatTime(splits.run6), vsFirstRun: 55, trend: "slowing" },
        { runNumber: 7, time: splits.run7, formattedTime: formatTime(splits.run7), vsFirstRun: 70, trend: "slowing" },
        { runNumber: 8, time: splits.run8, formattedTime: formatTime(splits.run8), vsFirstRun: 85, trend: "slowing" }
      ],
      summary: "Started strong but faded significantly in the second half. Focus on endurance training."
    },
    recommendations: generateDefaultRecommendations([]),
    aiSummary: "Based on your performance, you are an intermediate-level HYROX athlete with good overall fitness. Your primary weakness appears to be strength-based stations, while your rowing is a strength. Work on pacing to avoid early fatigue.",
    predictedImprovement: "With focused training on your weaknesses, you could improve by 8-12 minutes in the next 3-4 months."
  };
}

// server/routes/analysis.ts
var router = Router();
router.post("/", async (req, res) => {
  try {
    const { splits, athleteInfo } = req.body;
    if (!splits || !athleteInfo) {
      return res.status(400).json({
        success: false,
        error: "Missing required data: splits and athleteInfo are required"
      });
    }
    const requiredSplits = [
      "run1",
      "skiErg",
      "run2",
      "sledPush",
      "run3",
      "burpeeBroadJump",
      "run4",
      "rowing",
      "run5",
      "farmersCarry",
      "run6",
      "sandbagLunges",
      "run7",
      "wallBalls",
      "run8"
    ];
    const missingSplits = requiredSplits.filter((key) => !(key in splits) || splits[key] == null);
    if (missingSplits.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing splits: ${missingSplits.join(", ")}`
      });
    }
    if (!athleteInfo.gender || !["male", "female"].includes(athleteInfo.gender)) {
      return res.status(400).json({
        success: false,
        error: 'athleteInfo.gender must be "male" or "female"'
      });
    }
    const analysis = await generateAnalysis(splits, athleteInfo);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error("Analysis route error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate analysis",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router.post("/quick", async (req, res) => {
  try {
    const { splits, athleteInfo } = req.body;
    if (!splits || !athleteInfo?.gender) {
      return res.status(400).json({
        success: false,
        error: "Missing required data"
      });
    }
    const totalTime = calculateTotalTime(splits);
    const level = determineLevel(totalTime, athleteInfo.gender);
    const benchmarks = getBenchmarks(athleteInfo.gender);
    const stationAnalysis = [];
    for (const [key, time] of Object.entries(splits)) {
      if (key.startsWith("run")) continue;
      const stationBenchmark = benchmarks[level].stations[key];
      if (stationBenchmark) {
        const avgBenchmark = (stationBenchmark.min + stationBenchmark.max) / 2;
        stationAnalysis.push({
          station: key,
          displayName: STATION_DISPLAY_NAMES[key] || key,
          time,
          formattedTime: formatTime(time),
          benchmark: avgBenchmark,
          gap: time - avgBenchmark
        });
      }
    }
    stationAnalysis.sort((a, b) => a.time - b.time);
    const runTimes = [
      splits.run1,
      splits.run2,
      splits.run3,
      splits.run4,
      splits.run5,
      splits.run6,
      splits.run7,
      splits.run8
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
    console.error("Quick analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate quick analysis"
    });
  }
});
router.get("/benchmarks", (req, res) => {
  const { gender = "male" } = req.query;
  if (!["male", "female"].includes(gender)) {
    return res.status(400).json({
      success: false,
      error: 'gender must be "male" or "female"'
    });
  }
  const benchmarks = getBenchmarks(gender);
  res.json({
    success: true,
    data: benchmarks
  });
});
var analysis_default = router;

// server/routes/training.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.post("/", async (req, res) => {
  try {
    const { level, weaknesses, strengths, weeks = 8, focusAreas } = req.body;
    if (!level || !weaknesses) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: level and weaknesses"
      });
    }
    const plan = generateTrainingPlan(level, weaknesses, strengths || [], weeks, focusAreas || []);
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error("Training plan error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate training plan"
    });
  }
});
router2.get("/templates", (req, res) => {
  const templates = [
    {
      id: "beginner-foundation",
      name: "Beginner Foundation (8 weeks)",
      description: "Build base fitness and learn proper technique for all stations",
      duration: 8,
      level: "beginner",
      focus: "Technique, Endurance, Basic Strength"
    },
    {
      id: "intermediate-improvement",
      name: "Intermediate Improvement (8 weeks)",
      description: "Address weaknesses and build race-specific fitness",
      duration: 8,
      level: "intermediate",
      focus: "Weakness Targeting, Pacing, Combined Work"
    },
    {
      id: "advanced-peak",
      name: "Advanced Peak (8 weeks)",
      description: "Maximize performance for competition",
      duration: 8,
      level: "advanced",
      focus: "High Intensity, Race Simulation, Recovery"
    }
  ];
  res.json({
    success: true,
    data: templates
  });
});
function generateTrainingPlan(level, weaknesses, strengths, weeks, focusAreas) {
  const planWeeks = [];
  const daysPerWeek = level === "beginner" ? 4 : level === "intermediate" ? 5 : 6;
  for (let weekNum = 1; weekNum <= weeks; weekNum++) {
    const week = generateWeek(
      weekNum,
      weeks,
      level,
      daysPerWeek,
      weaknesses,
      strengths,
      focusAreas
    );
    planWeeks.push(week);
  }
  const primaryWeakness = weaknesses.length > 0 ? STATION_DISPLAY_NAMES[weaknesses[0]] || weaknesses[0] : "General Fitness";
  return {
    id: `plan-${Date.now()}`,
    name: `${weeks}-Week ${level.charAt(0).toUpperCase() + level.slice(1)} Plan`,
    duration: weeks,
    level,
    goal: `Improve ${primaryWeakness} and build overall HYROX fitness`,
    weeks: planWeeks,
    createdAt: /* @__PURE__ */ new Date()
  };
}
function generateWeek(weekNum, totalWeeks, level, daysPerWeek, weaknesses, strengths, focusAreas) {
  let phase;
  let focus;
  const progress = weekNum / totalWeeks;
  if (progress < 0.25) {
    phase = "foundation";
    focus = "Building base fitness and technique";
  } else if (progress < 0.5) {
    phase = "build";
    focus = weaknesses.length > 0 ? `Targeting ${STATION_DISPLAY_NAMES[weaknesses[0]] || weaknesses[0]}` : "Building strength and endurance";
  } else if (progress < 0.75) {
    phase = "intensify";
    focus = "Combining stations and improving transitions";
  } else if (progress < 0.9) {
    phase = "peak";
    focus = "Race-specific training and pacing";
  } else {
    phase = "taper";
    focus = "Recovery and race preparation";
  }
  const days = [];
  for (let dayNum = 1; dayNum <= daysPerWeek; dayNum++) {
    const day = generateDay(
      dayNum,
      daysPerWeek,
      weekNum,
      phase,
      level,
      weaknesses,
      strengths
    );
    days.push(day);
  }
  while (days.length < 7) {
    days.push({
      dayNumber: days.length + 1,
      type: "rest",
      title: "Rest Day",
      description: "Active recovery or complete rest",
      exercises: [],
      duration: 0,
      intensity: "low"
    });
  }
  return {
    weekNumber: weekNum,
    focus,
    days
  };
}
function generateDay(dayNum, totalDays, weekNum, phase, level, weaknesses, strengths) {
  const dayTypes = [
    "endurance",
    "strength",
    "skill",
    "combined",
    "endurance",
    "mock"
  ];
  const type = dayTypes[(dayNum - 1) % dayTypes.length];
  switch (type) {
    case "endurance":
      return generateEnduranceDay(dayNum, weekNum, phase, level);
    case "strength":
      return generateStrengthDay(dayNum, weekNum, phase, level, weaknesses);
    case "skill":
      return generateSkillDay(dayNum, weekNum, phase, level, weaknesses);
    case "combined":
      return generateCombinedDay(dayNum, weekNum, phase, level);
    case "mock":
      return generateMockDay(dayNum, weekNum, phase, level);
    default:
      return generateEnduranceDay(dayNum, weekNum, phase, level);
  }
}
function generateEnduranceDay(dayNum, weekNum, phase, level) {
  const baseDuration = level === "beginner" ? 20 : level === "intermediate" ? 30 : 40;
  const duration = baseDuration + weekNum * 2;
  const intensity = phase === "peak" ? "high" : "medium";
  return {
    dayNumber: dayNum,
    type: "endurance",
    title: "Cardio Endurance",
    description: "Build aerobic base with sustained effort",
    exercises: [
      {
        name: "Warm-up jog",
        duration: 600,
        notes: "Easy pace"
      },
      {
        name: "Main run",
        duration: duration * 60,
        notes: `${intensity === "high" ? "Race pace" : "Comfortable but steady"} pace`
      },
      {
        name: "Cool down",
        duration: 300,
        notes: "Walk and stretch"
      }
    ],
    duration: Math.round(duration + 15),
    intensity
  };
}
function generateStrengthDay(dayNum, weekNum, phase, level, weaknesses) {
  const sets = level === "beginner" ? 3 : level === "intermediate" ? 4 : 5;
  const intensity = phase === "peak" ? "high" : "medium";
  const weaknessFocus = weaknesses.length > 0 ? weaknesses[0] : null;
  const exercises = [
    { name: "Warm-up", duration: 600, notes: "Dynamic stretching and light cardio" }
  ];
  if (weaknessFocus === "sledPush" || !weaknessFocus) {
    exercises.push({
      name: "Sled Push Practice",
      sets,
      reps: 4,
      rest: 120,
      notes: "Focus on low body position, powerful strides"
    });
  }
  if (weaknessFocus === "wallBalls" || !weaknessFocus) {
    exercises.push({
      name: "Wall Balls",
      sets,
      reps: 15,
      rest: 90,
      notes: "Full hip extension, catch high"
    });
  }
  exercises.push(
    { name: "Goblet Squats", sets, reps: 12, rest: 90 },
    { name: "Kettlebell Swings", sets, reps: 15, rest: 90 },
    { name: "Farmers Carry", sets: 3, duration: 60, rest: 120 }
  );
  exercises.push({ name: "Cool down", duration: 300, notes: "Stretching" });
  return {
    dayNumber: dayNum,
    type: "strength",
    title: weaknessFocus ? `${STATION_DISPLAY_NAMES[weaknessFocus] || weaknessFocus} Strength` : "Functional Strength",
    description: weaknessFocus ? `Build strength for ${STATION_DISPLAY_NAMES[weaknessFocus] || weaknessFocus} and overall power` : "Build full-body functional strength for all stations",
    exercises,
    duration: 60,
    intensity
  };
}
function generateSkillDay(dayNum, weekNum, phase, level, weaknesses) {
  const intensity = "medium";
  const focusStation = weaknesses.length > 0 ? weaknesses[0] : "general";
  const exercises = [
    { name: "Warm-up", duration: 600, notes: "Mobility work" }
  ];
  const stations = focusStation === "general" ? ["skiErg", "sledPush", "burpeeBroadJump", "rowing", "farmersCarry", "sandbagLunges", "wallBalls"] : [focusStation];
  stations.forEach((station) => {
    exercises.push({
      name: `${STATION_DISPLAY_NAMES[station]} Technique`,
      sets: 3,
      reps: 10,
      rest: 60,
      notes: "Focus on efficiency and form, not speed"
    });
  });
  exercises.push(
    { name: "Burpee Practice", sets: 3, reps: 10, rest: 60, notes: "Smooth, efficient movement" },
    { name: "Transition Practice", sets: 5, duration: 60, rest: 120, notes: "Run to station and back" }
  );
  exercises.push({ name: "Cool down", duration: 300 });
  return {
    dayNumber: dayNum,
    type: "skill",
    title: "Technique & Skill",
    description: "Refine movement patterns and improve efficiency",
    exercises,
    duration: 50,
    intensity
  };
}
function generateCombinedDay(dayNum, weekNum, phase, level) {
  const rounds = level === "beginner" ? 3 : level === "intermediate" ? 4 : 5;
  const intensity = phase === "peak" ? "high" : "medium";
  return {
    dayNumber: dayNum,
    type: "combined",
    title: "HYROX Simulation",
    description: "Combine running with station work to simulate race conditions",
    exercises: [
      { name: "Warm-up", duration: 600, notes: "Prepare for intensity" },
      {
        name: "Main workout",
        sets: rounds,
        notes: "Run 400m + 2 stations. Rest 3 min between rounds."
      },
      { name: "Round 1", duration: 600, notes: "SkiErg + Sled Push" },
      { name: "Rest", duration: 180 },
      { name: "Round 2", duration: 600, notes: "Burpees + Rowing" },
      { name: "Rest", duration: 180 },
      { name: "Round 3", duration: 600, notes: "Farmers Carry + Lunges" },
      { name: "Rest", duration: 180 },
      { name: "Round 4", duration: 600, notes: level === "beginner" ? "Wall Balls + Run 400m (Skip if needed)" : "Wall Balls + Run 400m" },
      { name: "Cool down", duration: 600, notes: "Walk and stretch" }
    ],
    duration: 55,
    intensity
  };
}
function generateMockDay(dayNum, weekNum, phase, level) {
  const intensity = phase === "taper" ? "low" : "high";
  return {
    dayNumber: dayNum,
    type: "mock",
    title: phase === "taper" ? "Light Practice" : "Mock Race",
    description: phase === "taper" ? "Light practice of race transitions and movements" : "Full or partial HYROX simulation to test fitness",
    exercises: [
      { name: "Warm-up", duration: 900, notes: "Thorough preparation" },
      {
        name: phase === "taper" ? "Practice Session" : "Mock Race",
        duration: phase === "taper" ? 1800 : 5400,
        notes: phase === "taper" ? "Practice 2-3 stations with transitions" : level === "beginner" ? "Complete 4 stations + runs" : level === "intermediate" ? "Complete 6 stations + runs" : "Full HYROX simulation"
      },
      { name: "Cool down", duration: 600, notes: "Stretch and recover" }
    ],
    duration: phase === "taper" ? 45 : 90,
    intensity
  };
}
var training_default = router2;

// server/index.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var app = express();
var PORT = process.env.PORT || 5e3;
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "HYROX Advance API"
  });
});
app.use("/api/analysis", analysis_default);
app.use("/api/training", training_default);
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});
app.listen(PORT, () => {
  console.log(`\u{1F3C3} HYROX Advance server running on port ${PORT}`);
  console.log(`\u{1F4CA} Health check: http://localhost:${PORT}/api/health`);
});
