import OpenAI from 'openai';
import { formatTime, getBenchmarks, STATION_DISPLAY_NAMES, determineLevel, calculateTotalTime } from './hyrox-data.js';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});
export async function generateAnalysis(splits, athleteInfo) {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set, using mock analysis');
        return generateMockAnalysis(splits, athleteInfo);
    }
    const totalTime = calculateTotalTime(splits);
    const level = determineLevel(totalTime, athleteInfo.gender);
    const benchmarks = getBenchmarks(athleteInfo.gender);
    // Calculate weaknesses and strengths
    const stationAnalysis = [];
    for (const [key, time] of Object.entries(splits)) {
        if (key.startsWith('run'))
            continue;
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
    // Sort by gap (positive = slower than benchmark = weakness)
    stationAnalysis.sort((a, b) => b.gap - a.gap);
    const weaknesses = stationAnalysis
        .filter(s => s.gap > 0)
        .slice(0, 3)
        .map(s => ({
        ...s,
        formattedTime: formatTime(s.time),
        gapPercent: Math.round((s.gap / s.time) * 100)
    }));
    const strengths = stationAnalysis
        .filter(s => s.gap <= 0)
        .slice(0, 2)
        .map(s => ({
        ...s,
        formattedTime: formatTime(s.time),
        advantage: Math.abs(s.gap)
    }));
    // Analyze run pacing
    const runTimes = [
        splits.run1, splits.run2, splits.run3, splits.run4,
        splits.run5, splits.run6, splits.run7, splits.run8
    ];
    const pacingAnalysis = analyzePacing(runTimes);
    // Build prompt for AI
    const prompt = buildAnalysisPrompt(splits, athleteInfo, totalTime, level, weaknesses, strengths, pacingAnalysis);
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert HYROX coach with deep knowledge of fitness training, race strategy, and performance analysis. Provide detailed, actionable advice.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        const aiContent = response.choices[0]?.message?.content || '';
        // Parse AI response
        let aiData = {};
        try {
            // Try to extract JSON from the response
            const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) ||
                aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
        }
        catch (e) {
            console.log('Could not parse AI JSON response, using text extraction');
        }
        // Calculate overall score (0-100)
        const levelScore = level === 'elite' ? 90 : level === 'intermediate' ? 70 : 50;
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
            predictedImprovement: aiData.predictedImprovement || '5-10% improvement possible with consistent training'
        };
    }
    catch (error) {
        console.error('OpenAI API error:', error);
        return generateMockAnalysis(splits, athleteInfo);
    }
}
function buildAnalysisPrompt(splits, athleteInfo, totalTime, level, weaknesses, strengths, pacingAnalysis) {
    return `You are a HYROX coach analyzing an athlete's race data.

Athlete Info:
- Gender: ${athleteInfo.gender}
- Age: ${athleteInfo.age || 'Not specified'}
- Weight: ${athleteInfo.weight ? athleteInfo.weight + 'kg' : 'Not specified'}
- Experience: ${athleteInfo.experience || 'Not specified'}

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
${weaknesses.map((w, i) => `${i + 1}. ${w.displayName}: ${w.formattedTime} (+${formatTime(w.gap)} vs benchmark)`).join('\n')}

Strengths Identified:
${strengths.map((s, i) => `${i + 1}. ${s.displayName}: ${s.formattedTime} (${formatTime(s.advantage)} faster)`).join('\n')}

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
        let trend = 'steady';
        if (index > 0) {
            if (time < runTimes[index - 1]) {
                trend = 'fast';
            }
            else if (time > runTimes[index - 1] + 15) {
                trend = 'slowing';
            }
        }
        return { time, vsFirst, trend };
    });
    // Determine overall pacing strategy
    let summary = '';
    const degradation = lastRun - firstRun;
    const maxVariation = Math.max(...runTimes) - Math.min(...runTimes);
    if (degradation > 60) {
        summary = `Significant fade - ${formatTime(degradation)} slower on final run vs first. Focus on endurance training.`;
    }
    else if (degradation > 30) {
        summary = `Moderate fade of ${formatTime(degradation)}. Good pacing but could improve stamina for late race.`;
    }
    else if (maxVariation < 30) {
        summary = 'Excellent pacing consistency! Very even splits throughout the race.';
    }
    else {
        summary = 'Generally steady pacing with some variation. Solid race execution.';
    }
    return { runs, summary, degradation, maxVariation };
}
function calculateConsistencyBonus(runTimes) {
    const avg = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
    const variance = runTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / runTimes.length;
    const stdDev = Math.sqrt(variance);
    // Lower standard deviation = more consistent = higher bonus
    if (stdDev < 15)
        return 10;
    if (stdDev < 30)
        return 5;
    if (stdDev < 45)
        return 0;
    return -5;
}
function generateSummary(level, weaknesses, pacingAnalysis) {
    const levelText = level === 'elite' ? 'elite-level athlete' : level === 'intermediate' ? 'solid intermediate performer' : 'beginner with good potential';
    const weaknessText = weaknesses.length > 0 ? `Focus on ${weaknesses[0].displayName} as primary weakness.` : 'Good overall balance across stations.';
    return `You are a ${levelText}. ${weaknessText} ${pacingAnalysis.summary}`;
}
function generateDefaultRecommendations(weaknesses) {
    const recommendations = [
        {
            priority: 1,
            area: 'Technique',
            suggestion: 'Focus on efficient movement patterns and transitions',
            expectedImprovement: '2-3 minutes'
        },
        {
            priority: 2,
            area: 'Strength',
            suggestion: 'Build functional strength for key stations',
            expectedImprovement: '3-5 minutes'
        },
        {
            priority: 3,
            area: 'Endurance',
            suggestion: 'Improve cardiovascular capacity for consistent pacing',
            expectedImprovement: '2-4 minutes'
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
                station: 'sledPush',
                displayName: 'Sled Push',
                time: splits.sledPush,
                formattedTime: formatTime(splits.sledPush),
                gap: 45,
                gapPercent: 18
            },
            {
                station: 'wallBalls',
                displayName: 'Wall Balls',
                time: splits.wallBalls,
                formattedTime: formatTime(splits.wallBalls),
                gap: 38,
                gapPercent: 14
            }
        ],
        strengths: [
            {
                station: 'rowing',
                displayName: 'Rowing',
                time: splits.rowing,
                formattedTime: formatTime(splits.rowing),
                advantage: 25
            }
        ],
        pacingAnalysis: {
            runs: [
                { runNumber: 1, time: splits.run1, formattedTime: formatTime(splits.run1), vsFirstRun: 0, trend: 'steady' },
                { runNumber: 2, time: splits.run2, formattedTime: formatTime(splits.run2), vsFirstRun: 10, trend: 'steady' },
                { runNumber: 3, time: splits.run3, formattedTime: formatTime(splits.run3), vsFirstRun: 25, trend: 'slowing' },
                { runNumber: 4, time: splits.run4, formattedTime: formatTime(splits.run4), vsFirstRun: 35, trend: 'slowing' },
                { runNumber: 5, time: splits.run5, formattedTime: formatTime(splits.run5), vsFirstRun: 45, trend: 'slowing' },
                { runNumber: 6, time: splits.run6, formattedTime: formatTime(splits.run6), vsFirstRun: 55, trend: 'slowing' },
                { runNumber: 7, time: splits.run7, formattedTime: formatTime(splits.run7), vsFirstRun: 70, trend: 'slowing' },
                { runNumber: 8, time: splits.run8, formattedTime: formatTime(splits.run8), vsFirstRun: 85, trend: 'slowing' }
            ],
            summary: 'Started strong but faded significantly in the second half. Focus on endurance training.'
        },
        recommendations: generateDefaultRecommendations([]),
        aiSummary: 'Based on your performance, you are an intermediate-level HYROX athlete with good overall fitness. Your primary weakness appears to be strength-based stations, while your rowing is a strength. Work on pacing to avoid early fatigue.',
        predictedImprovement: 'With focused training on your weaknesses, you could improve by 8-12 minutes in the next 3-4 months.'
    };
}
//# sourceMappingURL=openai.js.map