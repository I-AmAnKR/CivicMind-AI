const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEPARTMENT_MAP = {
  'Road Damage': 'PWD (Public Works Department)',
  'Streetlight': 'Electricity Department',
  'Garbage': 'Municipal Corporation',
  'Water Supply': 'Water Supply Department',
  'Sewage': 'Sewage & Sanitation Department',
  'Park': 'Parks & Recreation Department',
  'Building': 'Urban Development Authority',
  'Traffic': 'Traffic Police / Municipal',
  'Other': 'Municipal Corporation',
};

/**
 * AI Agent 1: Smart Issue Detection
 * Analyzes image and returns category, severity, description, department
 */
const classifyIssue = async (imagePath) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `You are a civic issue detection AI. Analyze this image and identify any civic/infrastructure problems.

Return ONLY a valid JSON object with these exact fields:
{
  "category": "one of: Road Damage, Streetlight, Garbage, Water Supply, Sewage, Park, Building, Traffic, Other",
  "severity": "one of: Low, Medium, High, Critical",
  "risk": "brief risk description in 10 words or less",
  "confidence": "percentage like 95%",
  "title": "short issue title in 5-7 words",
  "description": "detailed description of the issue in 2-3 sentences",
  "isCivicIssue": true or false
}

If no civic issue is detected, set isCivicIssue to false and use "Other" for category.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const analysis = JSON.parse(jsonMatch[0]);
    analysis.department = DEPARTMENT_MAP[analysis.category] || DEPARTMENT_MAP['Other'];

    return { success: true, analysis };
  } catch (error) {
    console.error('Classify Issue Error:', error.message);
    return {
      success: false,
      analysis: {
        category: 'Other',
        severity: 'Medium',
        risk: 'Unknown',
        confidence: '0%',
        title: 'Civic Issue Reported',
        description: 'Issue submitted for review.',
        department: 'Municipal Corporation',
        isCivicIssue: true,
      },
      error: error.message,
    };
  }
};

module.exports = { classifyIssue, DEPARTMENT_MAP };
