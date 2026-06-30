const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEPARTMENT_MAP = {
  'Road Damage':  'PWD (Public Works Department)',
  'Streetlight':  'Electricity Department',
  'Garbage':      'Municipal Corporation',
  'Water Supply': 'Delhi Jal Board / Water Supply Department',
  'Sewage':       'Sewage & Sanitation Department',
  'Park':         'Parks & Recreation Department',
  'Building':     'Urban Development Authority',
  'Traffic':      'Traffic Police / Municipal Corporation',
  'Other':        'Municipal Corporation',
};

/**
 * AI Agent 4 (Enhanced): Smart Routing Agent
 * Always uses Gemini to reason about the routing — even for known categories.
 * Returns: { department, priority, reason, routingConfidence, suggestedActions }
 */
const routeIssue = async (category, description = '', severity = 'Medium', title = '') => {
  try {
    const defaultDept = DEPARTMENT_MAP[category] || 'Municipal Corporation';
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a Smart Routing AI for a civic issue management platform in India.

An issue has been reported:
- Title: "${title || 'Civic Issue'}"
- Category: ${category}
- Severity: ${severity}
- Description: "${description || 'No description provided'}"
- Default Department (based on category): ${defaultDept}

Your job:
1. Confirm or override the department based on description specifics
2. Determine the actual priority
3. Suggest immediate actions the department should take

Return ONLY this JSON (no markdown):
{
  "department": "<correct government department name>",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "reason": "<1-sentence routing justification>",
  "routingConfidence": <integer 70-99>,
  "suggestedActions": [
    "<Immediate action 1>",
    "<Immediate action 2>",
    "<Preventive action>"
  ],
  "escalationNeeded": <boolean>,
  "escalationReason": "<why this needs escalation, or empty string>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        department: parsed.department || defaultDept,
        priority: parsed.priority || severity,
        reason: parsed.reason || `${category} issues are handled by ${defaultDept}`,
        routingConfidence: parsed.routingConfidence || 85,
        suggestedActions: parsed.suggestedActions || [],
        escalationNeeded: parsed.escalationNeeded || false,
        escalationReason: parsed.escalationReason || '',
      };
    }

    return {
      department: defaultDept,
      priority: severity,
      reason: `${category} issues are handled by ${defaultDept}`,
      routingConfidence: 80,
      suggestedActions: [],
      escalationNeeded: false,
      escalationReason: '',
    };
  } catch (error) {
    console.error('Route Issue Error:', error.message);
    return {
      department: DEPARTMENT_MAP[category] || 'Municipal Corporation',
      priority: severity,
      reason: 'Default routing applied (AI unavailable)',
      routingConfidence: 70,
      suggestedActions: [],
      escalationNeeded: false,
      escalationReason: '',
    };
  }
};

module.exports = { routeIssue, DEPARTMENT_MAP };
