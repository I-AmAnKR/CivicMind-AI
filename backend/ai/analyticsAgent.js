const Issue = require('../models/Issue');

/**
 * AI Agent 7 (Enhanced): Predictive Analytics Agent
 * Generates comprehensive stats for both analytics and prediction.
 */
const generateAnalytics = async () => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // ── 1. Category breakdown ────────────────────────────────
    const categoryTrends = await Issue.aggregate([
      { $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgSeverity: { $avg: {
          $switch: {
            branches: [
              { case: { $eq: ['$severity', 'Critical'] }, then: 4 },
              { case: { $eq: ['$severity', 'High'] },     then: 3 },
              { case: { $eq: ['$severity', 'Medium'] },   then: 2 },
            ],
            default: 1,
          }
        }},
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
      }},
      { $sort: { count: -1 } },
    ]);

    // ── 2. Monthly trend (last 6 months) ─────────────────────
    const monthlyTrends = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── 3. Geographic hotspots (active issues only) ──────────
    const hotspots = await Issue.aggregate([
      { $match: { status: { $nin: ['Resolved', 'Rejected'] } } },
      { $group: {
        _id: { lat: { $round: ['$location.lat', 2] }, lng: { $round: ['$location.lng', 2] } },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' },
        avgPriority: { $avg: '$priorityScore' },
        severities: { $push: '$severity' },
        area: { $first: '$location.area' },
        address: { $first: '$location.address' },
      }},
      { $match: { count: { $gte: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // ── 4. Status breakdown ───────────────────────────────────
    const statusBreakdown = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // ── 5. Resolution time ────────────────────────────────────
    const resolutionStats = await Issue.aggregate([
      { $match: { status: 'Resolved', resolvedAt: { $exists: true } } },
      { $project: { resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] } } },
      { $group: {
        _id: null,
        avgResolutionHours: { $avg: { $divide: ['$resolutionTime', 3600000] } },
        minHours: { $min: { $divide: ['$resolutionTime', 3600000] } },
        maxHours: { $max: { $divide: ['$resolutionTime', 3600000] } },
      }},
    ]);

    // ── 6. Department performance ─────────────────────────────
    const deptPerformance = await Issue.aggregate([
      { $group: {
        _id: '$assignedDept',
        total: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        avgPriority: { $avg: '$priorityScore' },
      }},
      { $project: {
        dept: '$_id',
        total: 1,
        resolved: 1,
        avgPriority: 1,
        resolutionRate: { $multiply: [{ $divide: ['$resolved', { $max: ['$total', 1] }] }, 100] },
      }},
      { $sort: { resolutionRate: -1 } },
    ]);

    // ── 7. Weekly pattern (which day of week gets most reports) ──
    const weekdayPattern = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { dayOfWeek: { $dayOfWeek: '$createdAt' }, category: '$category' },
        count: { $sum: 1 },
      }},
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    // ── 8. High-risk area prediction data ─────────────────────
    // Areas with repeated issues of same category = predictable hotspot
    const riskAreas = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: {
          lat: { $round: ['$location.lat', 2] },
          lng: { $round: ['$location.lng', 2] },
          category: '$category',
        },
        count: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] } },
        highCount: { $sum: { $cond: [{ $eq: ['$severity', 'High'] }, 1, 0] } },
        unresolvedCount: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
        latestDate: { $max: '$createdAt' },
        area: { $first: '$location.area' },
        address: { $first: '$location.address' },
      }},
      { $match: { count: { $gte: 2 } } },
      // Calculate a risk score: repeated + unresolved + severity = high risk
      { $addFields: {
        riskScore: {
          $add: [
            { $multiply: ['$count', 5] },
            { $multiply: ['$criticalCount', 15] },
            { $multiply: ['$highCount', 8] },
            { $multiply: ['$unresolvedCount', 10] },
          ],
        },
      }},
      { $sort: { riskScore: -1 } },
      { $limit: 15 },
    ]);

    // ── 9. Seasonal / monthly pattern per category ────────────
    const seasonalPattern = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: {
          month: { $month: '$createdAt' },
          category: '$category',
        },
        count: { $sum: 1 },
      }},
      { $sort: { count: -1 } },
      { $limit: 60 },
    ]);

    // ── 10. Fastest vs slowest resolving categories ───────────
    const categoryResolutionTime = await Issue.aggregate([
      { $match: { status: 'Resolved', resolvedAt: { $exists: true } } },
      { $project: {
        category: 1,
        resolutionHours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
      }},
      { $group: {
        _id: '$category',
        avgHours: { $avg: '$resolutionHours' },
        count: { $sum: 1 },
      }},
      { $sort: { avgHours: 1 } },
    ]);

    return {
      success: true,
      analytics: {
        categoryTrends,
        monthlyTrends,
        hotspots,
        statusBreakdown,
        avgResolutionHours: resolutionStats[0]?.avgResolutionHours?.toFixed(1) || 0,
        resolutionStats: resolutionStats[0] || {},
        deptPerformance,
        weekdayPattern,
        riskAreas,
        seasonalPattern,
        categoryResolutionTime,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('Analytics Agent Error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { generateAnalytics };
