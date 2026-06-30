const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Agent 8: Predictive Hotspot Agent
 * Feeds real analytics data into Gemini to generate:
 *   - Specific area risk predictions with probability %
 *   - Seasonal warnings ("monsoon + Road Damage = spike incoming")
 *   - Department performance insights
 *   - Actionable government recommendations
 */
const generatePredictions = async (analyticsData) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const {
      categoryTrends = [],
      riskAreas = [],
      weekdayPattern = [],
      seasonalPattern = [],
      deptPerformance = [],
      categoryResolutionTime = [],
      monthlyTrends = [],
    } = analyticsData;

    // Build a concise summary of data for Gemini
    const topCategories = categoryTrends.slice(0, 5).map(c => `${c._id}: ${c.count} reports`).join(', ');
    const topRiskAreas  = riskAreas.slice(0, 5).map(r =>
      `[${r._id.lat.toFixed(3)},${r._id.lng.toFixed(3)}] ${r._id.category}: ${r.count} reports, riskScore=${r.riskScore}, area="${r.area || 'Unknown'}" unresolved=${r.unresolvedCount}`
    ).join('\n    ');
    const slowDepts = deptPerformance.slice(-3).map(d => `${d._id}: ${d.resolutionRate?.toFixed(0)}% resolve rate`).join(', ');
    const fastDepts = deptPerformance.slice(0, 2).map(d => `${d._id}: ${d.resolutionRate?.toFixed(0)}%`).join(', ');

    // Find weekday spikes
    const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdaySummary = weekdayPattern.slice(0, 5).map(w =>
      `${dayNames[w._id.dayOfWeek]} ${w._id.category}: ${w.count} reports`
    ).join(', ');

    const currentMonth = new Date().getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const prompt = `You are an AI urban infrastructure analyst for a smart city platform in India.

Analyze this REAL civic complaint data from the past 6 months and generate actionable predictive insights.

DATA:
Top complaint categories: ${topCategories}

High-risk location clusters (lat/lng, category, count, score):
    ${topRiskAreas || 'No significant clusters yet'}

Weekday patterns: ${weekdaySummary || 'Insufficient data'}

Department resolution rates:
- Best performing: ${fastDepts || 'No data'}
- Worst performing: ${slowDepts || 'No data'}

Current month: ${monthNames[currentMonth]}, Next month: ${monthNames[nextMonth]}

Generate EXACTLY this JSON structure (no markdown, no explanation outside JSON):
{
  "overallRiskLevel": "Low" | "Medium" | "High" | "Critical",
  "summary": "<2-sentence executive summary of the city's civic health>",
  "hotspotPredictions": [
    {
      "lat": <number>,
      "lng": <number>,
      "category": "<category>",
      "riskProbability": <integer 50-99>,
      "riskLevel": "Medium" | "High" | "Critical",
      "area": "<area name or Unknown>",
      "reason": "<1 sentence why this is high risk>",
      "recommendation": "<specific action for government>"
    }
  ],
  "seasonalWarnings": [
    {
      "category": "<category>",
      "warning": "<specific seasonal prediction>",
      "peakMonth": "<month name>",
      "severity": "Medium" | "High" | "Critical",
      "action": "<preventive action>"
    }
  ],
  "departmentInsights": [
    {
      "department": "<dept name>",
      "status": "Performing Well" | "Needs Attention" | "Critical Underperformer",
      "insight": "<specific insight>",
      "recommendation": "<action>"
    }
  ],
  "cityHealthScore": <integer 0-100>,
  "topRecommendations": [
    "<Specific actionable recommendation 1>",
    "<Specific actionable recommendation 2>",
    "<Specific actionable recommendation 3>"
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini predictions response');

    const predictions = JSON.parse(jsonMatch[0]);

    // Merge actual coordinates from riskAreas into predictions where possible
    const enriched = {
      ...predictions,
      hotspotPredictions: (predictions.hotspotPredictions || []).map((p, i) => {
        const real = riskAreas[i];
        return {
          ...p,
          lat: real ? real._id.lat : p.lat,
          lng: real ? real._id.lng : p.lng,
          actualCount: real?.count || 0,
          actualRiskScore: real?.riskScore || 0,
          unresolvedCount: real?.unresolvedCount || 0,
          area: p.area !== 'Unknown' ? p.area : (real?.area || 'Unknown'),
        };
      }),
    };

    return { success: true, predictions: enriched };

  } catch (error) {
    console.error('Predictive Agent Error:', error.message);
    // Return structured fallback so frontend never crashes
    return {
      success: false,
      predictions: {
        overallRiskLevel: 'Medium',
        summary: 'AI prediction unavailable. Showing raw data analytics.',
        cityHealthScore: 50,
        hotspotPredictions: [],
        seasonalWarnings: [],
        departmentInsights: [],
        topRecommendations: ['Increase road maintenance frequency', 'Improve garbage collection scheduling', 'Deploy more streetlight inspection teams'],
      },
      error: error.message,
    };
  }
};

module.exports = { generatePredictions };
