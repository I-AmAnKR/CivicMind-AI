const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Agent 5: Resolution Verification Agent (Enhanced)
 * Compares before/after images and returns structured verdict.
 *
 * Verdicts:
 *  "Resolved"        → Issue completely fixed
 *  "Partial Fix"     → Some improvement but not complete
 *  "Not Resolved"    → No real fix (fake or unchanged)
 */
const verifyResolution = async (beforeImagePath, afterImagePath, issueCategory, issueDescription = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Load both images
    if (!fs.existsSync(beforeImagePath)) throw new Error(`Before image not found: ${beforeImagePath}`);
    if (!fs.existsSync(afterImagePath)) throw new Error(`After image not found: ${afterImagePath}`);

    const beforeData = fs.readFileSync(beforeImagePath).toString('base64');
    const afterData  = fs.readFileSync(afterImagePath).toString('base64');
    const getMime = (p) => p.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `You are a strict civic infrastructure inspector AI.

Your job is to determine if a government authority has genuinely fixed a reported civic issue.

ISSUE DETAILS:
- Category: ${issueCategory}
- Description: "${issueDescription || issueCategory + ' problem reported by citizen'}"

You will receive TWO images:
1. BEFORE image (first image) — the original problem reported by a citizen
2. AFTER image (second image) — the claimed resolution submitted by the authority

INSPECT carefully:
- Is the exact same problem area visible?
- Has the specific issue actually been fixed?
- Is the after image possibly a different location (fake photo)?
- Is there partial improvement vs complete resolution?

VERDICT OPTIONS:
- "Resolved"     → Issue is completely and genuinely fixed. No trace of the original problem.
- "Partial Fix"  → Improvement visible but original issue not fully resolved.
- "Not Resolved" → No fix detected. Image may be unrelated, or problem persists unchanged.

Return ONLY valid JSON, nothing else:
{
  "verdict": "Resolved" | "Partial Fix" | "Not Resolved",
  "confidence": <integer 0-100>,
  "summary": "<1-2 sentence plain English verdict explanation>",
  "improvements": ["<visible improvement 1>", "<visible improvement 2>"],
  "concerns": ["<remaining issue 1>", "<remaining issue 2>"],
  "isFakePhoto": <true if after-image appears to be a different location or stock photo>,
  "inspectorNote": "<one crisp sentence an inspector would write in a report>"
}`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: beforeData, mimeType: getMime(beforeImagePath) } },
      { text: '--- ABOVE = BEFORE (original problem) | BELOW = AFTER (claimed fix) ---' },
      { inlineData: { data: afterData, mimeType: getMime(afterImagePath) } },
    ]);

    const text = result.response.text();
    console.log('\n🔍 AI Resolution Inspector response:', text.substring(0, 200));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalise verdict casing
    const verdictMap = {
      'resolved': 'Resolved',
      'partial fix': 'Partial Fix',
      'partially resolved': 'Partial Fix',
      'not resolved': 'Not Resolved',
      'fake fix': 'Not Resolved',
      'unresolved': 'Not Resolved',
    };
    const normalised = verdictMap[parsed.verdict?.toLowerCase()] || parsed.verdict || 'Partial Fix';

    return {
      success: true,
      verification: {
        verdict: normalised,
        confidence: Math.min(100, Math.max(0, parseInt(parsed.confidence) || 70)),
        summary: parsed.summary || 'AI inspection complete.',
        improvements: parsed.improvements || [],
        concerns: parsed.concerns || [],
        isFakePhoto: !!parsed.isFakePhoto,
        inspectorNote: parsed.inspectorNote || '',
      },
    };
  } catch (error) {
    console.error('✗ Resolution Verification Error:', error.message);
    return {
      success: false,
      verification: {
        verdict: 'Partial Fix',
        confidence: 0,
        summary: 'AI inspection unavailable. Manual review required by a supervisor.',
        improvements: [],
        concerns: ['Automated verification failed — please verify manually'],
        isFakePhoto: false,
        inspectorNote: 'System error during AI inspection.',
      },
      error: error.message,
    };
  }
};

module.exports = { verifyResolution };
