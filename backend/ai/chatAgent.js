const { GoogleGenerativeAI } = require('@google/generative-ai');
const Issue = require('../models/Issue');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Smart fallback: answers from real DB data without needing Gemini
 */
const smartFallback = async (userMessage) => {
  const msg = userMessage.toLowerCase();

  const totalIssues = await Issue.countDocuments();
  const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
  const pendingIssues = await Issue.countDocuments({ status: { $in: ['Pending', 'Verified', 'In Progress'] } });
  const criticalIssues = await Issue.countDocuments({ severity: 'Critical' });

  const categoryStats = await Issue.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }, { $limit: 5 }
  ]);

  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
  const topCategory = categoryStats[0]?._id || 'Road Damage';
  const topCount = categoryStats[0]?.count || 0;

  if (msg.includes('total') || msg.includes('how many') || msg.includes('count') || msg.includes('stat')) {
    return `📊 **Platform Statistics**\n\n• Total Issues: **${totalIssues}**\n• Resolved: **${resolvedIssues}** (${resolutionRate}%)\n• Pending: **${pendingIssues}**\n• Critical: **${criticalIssues}**\n\nTop categories: ${categoryStats.map(c => `${c._id} (${c.count})`).join(', ')}`;
  }
  if (msg.includes('critical')) {
    return `🚨 There are currently **${criticalIssues} critical issues** that need urgent attention.\n\nCritical issues are auto-prioritized with the highest score and routed immediately to relevant departments.`;
  }
  if (msg.includes('resolv')) {
    return `✅ **${resolvedIssues} out of ${totalIssues}** issues have been resolved — a **${resolutionRate}% resolution rate**.\n\nAuthorities use AI verification to confirm genuine fixes before marking issues resolved.`;
  }
  if (msg.includes('report') || msg.includes('how to')) {
    return `📸 **How to Report an Issue**\n\n1. Go to **Report Issue** in the sidebar\n2. Upload a photo of the problem\n3. Click **Next** to set your location on the map\n4. Press **Submit & Analyze with AI**\n\nAI will automatically classify the category, severity, check for duplicates, and route it to the correct department — no form filling needed!`;
  }
  if (msg.includes('point') || msg.includes('reward') || msg.includes('earn') || msg.includes('badge')) {
    return `🏆 **Earning Points**\n\n• Report an issue: **+20 pts**\n• Upload genuine proof: **+30 pts**\n• Verify community issue: **+10 pts**\n• Authority confirms your report: **+50 pts**\n• Weekly top contributor: **+100 pts**\n\n**Levels:** Bronze → Silver (100pts) → Gold (200pts) → Platinum (500pts) → Diamond (1000pts)`;
  }
  if (msg.includes('category') || msg.includes('type') || msg.includes('most') || msg.includes('common')) {
    return `📋 **Most Reported Categories**\n\n${categoryStats.map((c, i) => `${i + 1}. **${c._id}** — ${c.count} reports`).join('\n')}\n\n**${topCategory}** is currently the #1 issue with ${topCount} reports.`;
  }
  if (msg.includes('duplicate') || msg.includes('same issue')) {
    return `🔄 **Duplicate Detection AI**\n\nWhen you submit a report, AI scans a 50m radius for existing issues. If a match is found:\n• Your report is merged with the existing one\n• Upvote count increases (showing more people are affected)\n• Department gets notified of higher urgency\n\nThis keeps the database clean and prevents government confusion.`;
  }
  if (msg.includes('priority') || msg.includes('score') || msg.includes('urgent')) {
    return `⚡ **Priority Engine**\n\nEach issue gets a priority score (0–100) based on:\n• Severity classification\n• Number of community verifications\n• GPS location risk factor\n• Historical data for that area\n• Weather/seasonal factors\n\nHigher score = faster government response.`;
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `👋 Hello! I'm **CivicMind AI**, your civic assistant.\n\nI currently have access to:\n📊 **${totalIssues}** total issues | ✅ **${resolvedIssues}** resolved | 🚨 **${criticalIssues}** critical\n\nAsk me about:\n• Issue statistics & trends\n• How to report a problem\n• Earning points & badges\n• How AI features work`;
  }
  if (msg.includes('area') || msg.includes('hotspot') || msg.includes('location') || msg.includes('where')) {
    return `🗺️ **Hotspot Analysis**\n\nCheck the **Predictive Hotspots** page for:\n• AI-predicted risk zones on the map\n• Top complaint areas by category\n• Monthly trend charts\n• Department performance analytics\n\nCurrently tracking **${totalIssues}** geo-tagged issues across the city.`;
  }
  if (msg.includes('authority') || msg.includes('government') || msg.includes('department') || msg.includes('official')) {
    return `🏛️ **Authority Features**\n\nAuthority accounts can:\n• View AI-prioritized issue queue\n• Update issue status (In Progress / Resolved)\n• Upload proof of resolution\n• AI verifies their fix is genuine\n• Access predictive analytics dashboard\n\nAuthority portal: Login with your government email.`;
  }

  // Generic fallback with stats
  return `🤖 I'm CivicMind AI! Here's what I know right now:\n\n📊 **${totalIssues}** total issues tracked\n✅ **${resolvedIssues}** resolved (${resolutionRate}%)\n🚨 **${criticalIssues}** critical\n🔝 Top issue: **${topCategory}**\n\nYou can ask me about:\n• Issue statistics • How to report\n• Earning rewards • AI features\n• Hotspot locations • Resolution status`;
};

/**
 * AI Agent 6: Civic Chat Assistant
 */
const chatWithCivicAI = async (userMessage, userId) => {
  try {
    // First try Gemini
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const pendingIssues = await Issue.countDocuments({ status: { $in: ['Pending', 'Verified', 'In Progress'] } });
    const criticalIssues = await Issue.countDocuments({ severity: 'Critical' });
    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 }
    ]);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemContext = `You are CivicMind AI, an intelligent civic issue management assistant.

Current Platform Statistics:
- Total Issues Reported: ${totalIssues}
- Resolved Issues: ${resolvedIssues}
- Pending Issues: ${pendingIssues}
- Critical Issues: ${criticalIssues}
- Top Categories: ${categoryStats.map(c => `${c._id} (${c.count})`).join(', ')}

You can answer questions about:
- Issue statistics and trends
- How to report issues
- Status of different areas
- Platform features
- Civic improvement suggestions

Be helpful, concise, and encouraging. Use emojis sparingly for friendliness.`;

    const result = await model.generateContent(`${systemContext}\n\nUser: ${userMessage}\n\nAssistant:`);
    const response = await result.response;

    return {
      success: true,
      message: response.text(),
      stats: { totalIssues, resolvedIssues, pendingIssues, criticalIssues }
    };
  } catch (error) {
    console.error('Chat Agent Error (using smart fallback):', error.message?.substring(0, 100));
    // Use smart DB-powered fallback instead of showing error
    try {
      const fallbackMsg = await smartFallback(userMessage);
      return { success: true, message: fallbackMsg };
    } catch (fallbackError) {
      return {
        success: true,
        message: "👋 I'm CivicMind AI! I'm currently running in offline mode. Ask me about how to report issues, earn points, or platform features!"
      };
    }
  }
};

module.exports = { chatWithCivicAI };
