const { GoogleGenerativeAI } = require('@google/generative-ai');
const Issue = require('../models/Issue');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Calculate distance in meters between two GPS coordinates (Haversine formula)
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Step 1: Fast GPS bounding box search
 * 50 meters ≈ 0.00045 degrees latitude
 */
const searchNearby = async (lat, lng, category, radiusMeters = 50) => {
  const radiusDeg = radiusMeters / 111000; // 1 degree ≈ 111km

  const candidates = await Issue.find({
    category,
    status: { $nin: ['Resolved', 'Rejected'] },
    'location.lat': { $gte: lat - radiusDeg * 3, $lte: lat + radiusDeg * 3 },
    'location.lng': { $gte: lng - radiusDeg * 3, $lte: lng + radiusDeg * 3 },
  })
    .populate('createdBy', 'name')
    .limit(5);

  // Precise Haversine filter
  return candidates.filter(issue => {
    const dist = haversineDistance(lat, lng, issue.location.lat, issue.location.lng);
    return dist <= radiusMeters;
  });
};

/**
 * Step 2: Gemini Vision Comparison
 * Compares new image against existing issue image + descriptions
 */
const compareWithGemini = async (newImagePath, existingIssue, newDescription) => {
  try {
    // Load new image
    if (!fs.existsSync(newImagePath)) throw new Error('New image not found');
    const newImageData = fs.readFileSync(newImagePath).toString('base64');
    const newMime = newImagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Try image-to-image if existing image is available
    const existingImagePath = existingIssue.images?.[0];
    let parts = [];

    if (existingImagePath && fs.existsSync(existingImagePath)) {
      // BEST: Compare two images directly
      const existingImageData = fs.readFileSync(existingImagePath).toString('base64');
      const existingMime = existingImagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      parts = [
        {
          text: `You are a civic issue duplicate detection AI. Compare these two reports carefully.

REPORT A (existing issue #${existingIssue._id}):
- Category: ${existingIssue.category}
- Description: "${existingIssue.description}"
- Reported: ${new Date(existingIssue.createdAt).toLocaleDateString()}
- Location: ${existingIssue.location.lat?.toFixed(4)}, ${existingIssue.location.lng?.toFixed(4)}

REPORT B (new submission):
- Category: ${existingIssue.category}
- Description: "${newDescription}"

Look at both images carefully. Determine if they show the SAME physical problem at the SAME location.

Return ONLY valid JSON:
{
  "areSame": true or false,
  "confidence": number between 0 and 100,
  "reason": "One clear sentence explaining your decision",
  "matchFactors": {
    "visualSimilarity": "High/Medium/Low",
    "locationLikely": "Yes/No",
    "descriptionMatch": "Strong/Weak/None"
  }
}`
        },
        { inlineData: { data: existingImageData, mimeType: existingMime } },
        { text: '--- ABOVE IS REPORT A (existing), BELOW IS REPORT B (new) ---' },
        { inlineData: { data: newImageData, mimeType: newMime } },
      ];
    } else {
      // Fallback: text + new image only
      parts = [
        {
          text: `You are a civic issue duplicate detection AI.

Existing issue in database:
- Category: ${existingIssue.category}
- Description: "${existingIssue.description}"
- Location: ${existingIssue.location.lat?.toFixed(4)}, ${existingIssue.location.lng?.toFixed(4)}

New report (image attached):
- Category: ${existingIssue.category}
- Description: "${newDescription}"
- Location is within 50 meters of the existing issue

Does this new image show the SAME issue as the existing report?

Return ONLY valid JSON:
{
  "areSame": true or false,
  "confidence": number between 0 and 100,
  "reason": "One clear sentence",
  "matchFactors": {
    "visualSimilarity": "High/Medium/Low",
    "locationLikely": "Yes/No",
    "descriptionMatch": "Strong/Weak/None"
  }
}`
        },
        { inlineData: { data: newImageData, mimeType: newMime } },
      ];
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini comparison error:', err.message);
    // Safe fallback — don't assume duplicate on error
    return { areSame: false, confidence: 0, reason: 'AI comparison unavailable', matchFactors: {} };
  }
};

/**
 * 🔥 MAIN: AI Duplicate Detection Agent
 * Full agentic pipeline: GPS → Gemini Vision → Decision
 *
 * Returns:
 *  { isDuplicate: false }
 *  { isDuplicate: true, confidence, reason, existingIssue, matchFactors }
 */
const detectDuplicate = async (lat, lng, category, description, newImagePath, radiusMeters = 50) => {
  try {
    console.log(`\n🔍 Duplicate Check: [${lat}, ${lng}] ${category} within ${radiusMeters}m`);

    // Step 1: Find nearby issues in database
    const nearbyIssues = await searchNearby(lat, lng, category, radiusMeters);
    console.log(`   📍 Found ${nearbyIssues.length} nearby ${category} issue(s)`);

    if (nearbyIssues.length === 0) {
      return { isDuplicate: false, existingIssue: null };
    }

    // Step 2: For each nearby issue, ask Gemini to compare
    // Compare against the closest one first (most likely match)
    const sortedByDistance = nearbyIssues.sort((a, b) => {
      return haversineDistance(lat, lng, a.location.lat, a.location.lng)
           - haversineDistance(lat, lng, b.location.lat, b.location.lng);
    });

    for (const existingIssue of sortedByDistance) {
      const distMeters = Math.round(haversineDistance(lat, lng, existingIssue.location.lat, existingIssue.location.lng));
      console.log(`   🤖 Comparing with Issue #${existingIssue._id} (${distMeters}m away)...`);

      const geminiResult = await compareWithGemini(newImagePath, existingIssue, description);
      console.log(`   ✅ Gemini says: ${geminiResult.areSame ? 'SAME' : 'DIFFERENT'} (${geminiResult.confidence}% confidence)`);

      // Threshold: 75% confidence = duplicate
      if (geminiResult.areSame && geminiResult.confidence >= 75) {
        return {
          isDuplicate: true,
          confidence: geminiResult.confidence,
          reason: geminiResult.reason,
          matchFactors: geminiResult.matchFactors,
          distanceMeters: distMeters,
          existingIssue: {
            id: existingIssue._id,
            title: existingIssue.title,
            description: existingIssue.description,
            status: existingIssue.status,
            severity: existingIssue.severity,
            category: existingIssue.category,
            createdAt: existingIssue.createdAt,
            reportedBy: existingIssue.createdBy?.name || 'Anonymous',
            supporterCount: existingIssue.supporters?.length || 0,
            verificationCount: existingIssue.verificationCount || 0,
            upvoteCount: existingIssue.upvotes?.length || 0,
            location: existingIssue.location,
          },
        };
      }
    }

    // All nearby issues compared — none matched
    return { isDuplicate: false, existingIssue: null };

  } catch (error) {
    console.error('Duplicate Detection Error:', error.message);
    return { isDuplicate: false, existingIssue: null };
  }
};

module.exports = { detectDuplicate, haversineDistance };
