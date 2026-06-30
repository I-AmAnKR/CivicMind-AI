const { GoogleGenerativeAI } = require('@google/generative-ai');
const Issue = require('../models/Issue');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Agent 8: Proactive Action Recommendation Agent
 * Analyzes all active complaints and proactively suggests systemic actions
 * instead of just reacting to individual reports.
 * 
 * This transforms CivicMind from a complaint system → AI decision support platform.
 */
const generateRecommendations = async () => {
  try {
    // ── Pull real pattern data from DB ─────────────────────────
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Category clusters: areas with 3+ same-category issues
    const clusters = await Issue.aggregate([
      { $match: { createdAt: { $gte: oneMonthAgo }, status: { $nin: ['Resolved', 'Rejected'] } } },
      { $group: {
        _id: {
          lat: { $round: ['$location.lat', 2] },
          lng: { $round: ['$location.lng', 2] },
          category: '$category',
        },
        count: { $sum: 1 },
        avgPriority: { $avg: '$priorityScore' },
        area: { $first: '$location.area' },
        address: { $first: '$location.address' },
        severities: { $push: '$severity' },
      }},
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Recurring day patterns: complaints on same day of week
    const dayPatterns = await Issue.aggregate([
      { $match: { createdAt: { $gte: oneMonthAgo } } },
      { $group: {
        _id: { dayOfWeek: { $dayOfWeek: '$createdAt' }, category: '$category' },
        count: { $sum: 1 },
      }},
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Slowest categories: avg resolution > 48h
    const slowCategories = await Issue.aggregate([
      { $match: { status: 'Resolved', resolvedAt: { $exists: true } } },
      { $project: {
        category: 1,
        hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
      }},
      { $group: {
        _id: '$category',
        avgHours: { $avg: '$hours' },
        count: { $sum: 1 },
      }},
      { $match: { avgHours: { $gt: 48 }, count: { $gte: 2 } } },
      { $sort: { avgHours: -1 } },
      { $limit: 4 },
    ]);

    // Repeated same-area issues → systemic problem signal
    const sameAreaRepeats = await Issue.aggregate([
      { $match: { createdAt: { $gte: oneMonthAgo } } },
      { $group: {
        _id: { lat: { $round: ['$location.lat', 2] }, lng: { $round: ['$location.lng', 2] } },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' },
        area: { $first: '$location.area' },
      }},
      { $match: { count: { $gte: 5 } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);

    if (clusters.length === 0 && dayPatterns.length === 0) {
      return {
        success: true,
        recommendations: [
          {
            type: 'insight',
            priority: 'Low',
            title: 'Insufficient data for recommendations',
            description: 'More reported issues needed to identify systemic patterns.',
            action: 'Encourage community members to report issues via the platform.',
            impact: 'Increases AI recommendation accuracy',
            icon: '📊',
          },
        ],
        generatedAt: new Date(),
      };
    }

    // ── Build Gemini prompt ────────────────────────────────────
    const DAY_NAMES = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const clusterSummary = clusters.slice(0, 5).map(c =>
      `• ${c.count}x ${c._id.category} in area "${c.area || c._id.lat + ',' + c._id.lng}" (avg priority: ${c.avgPriority?.toFixed(0)})`
    ).join('\n');

    const daySummary = dayPatterns.slice(0, 4).map(d =>
      `• ${d.count}x ${d._id.category} complaints every ${DAY_NAMES[d._id.dayOfWeek]}`
    ).join('\n');

    const slowSummary = slowCategories.map(s =>
      `• ${s._id}: avg ${s.avgHours?.toFixed(0)}h to resolve (${s.count} cases)`
    ).join('\n');

    const areaSummary = sameAreaRepeats.slice(0, 3).map(a =>
      `• Area "${a.area || 'Unknown'}" has ${a.count} complaints across: ${a.categories.join(', ')}`
    ).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are an AI civic infrastructure advisor. Based on REAL complaint data from the past month, generate proactive systemic recommendations for the city government.

PATTERN DATA:
Repeated location clusters (3+ same issues):
${clusterSummary || 'None'}

Recurring day-of-week patterns:
${daySummary || 'None'}

Slow-resolving categories:
${slowSummary || 'None'}

High-complaint areas (multi-category):
${areaSummary || 'None'}

Generate EXACTLY 4-6 specific, actionable recommendations. Each must be a SYSTEMIC action (not a one-time fix).

Return ONLY this JSON array (no markdown):
[
  {
    "type": "preventive" | "operational" | "infrastructure" | "policy",
    "priority": "Low" | "Medium" | "High" | "Critical",
    "title": "<concise title>",
    "description": "<what pattern triggered this recommendation, 1-2 sentences>",
    "action": "<specific government action to take>",
    "impact": "<expected improvement>",
    "icon": "<one relevant emoji>",
    "affectedCategory": "<category name>",
    "timeframe": "Immediate" | "This Week" | "This Month" | "This Quarter"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) throw new Error('No JSON array in response');

    const recommendations = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      recommendations,
      patternsFound: {
        clusters: clusters.length,
        dayPatterns: dayPatterns.length,
        slowCategories: slowCategories.length,
        hotAreas: sameAreaRepeats.length,
      },
      generatedAt: new Date(),
    };

  } catch (error) {
    console.error('Recommendation Agent Error:', error.message);
    return {
      success: false,
      recommendations: [
        {
          type: 'infrastructure',
          priority: 'High',
          title: 'Schedule Preventive Road Maintenance',
          description: 'Areas with repeated road damage reports signal underlying infrastructure issues.',
          action: 'Conduct full road survey and schedule resurfacing for high-complaint roads.',
          impact: 'Reduce pothole complaints by 60-70%',
          icon: '🛣️',
          affectedCategory: 'Road Damage',
          timeframe: 'This Month',
        },
      ],
      error: error.message,
      generatedAt: new Date(),
    };
  }
};

module.exports = { generateRecommendations };
