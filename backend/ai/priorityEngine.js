/**
 * AI Agent 3 (Enhanced): Priority Scoring Engine
 * Formula: Severity + Votes + Time + Category Risk + Location Context + Weather Proxy
 */

// Context multipliers based on what's nearby (proxy via category + keywords)
const VULNERABILITY_KEYWORDS = {
  school:      ['school', 'vidyalaya', 'college', 'university', 'students'],
  hospital:    ['hospital', 'clinic', 'medical', 'health centre', 'dispensary'],
  market:      ['market', 'bazaar', 'mandi', 'shopping'],
  highway:     ['highway', 'expressway', 'national highway', 'nh-', 'sh-'],
  residential: ['residential', 'colony', 'apartments', 'society', 'housing'],
  children:    ['children', 'child', 'kids', 'playground', 'nursery'],
};

// Water-related categories get spike during monsoon (June-Sept)
const MONSOON_CATEGORIES = ['Sewage', 'Water Supply', 'Road Damage'];
const MONSOON_MONTHS = [6, 7, 8, 9];

const getContextMultiplier = (description = '', title = '') => {
  const text = `${description} ${title}`.toLowerCase();
  let multiplier = 1.0;

  // Vulnerability: children or hospital nearby → critical boost
  if (VULNERABILITY_KEYWORDS.hospital.some(k => text.includes(k))) multiplier += 0.5;
  if (VULNERABILITY_KEYWORDS.school.some(k => text.includes(k)))   multiplier += 0.45;
  if (VULNERABILITY_KEYWORDS.children.some(k => text.includes(k))) multiplier += 0.3;
  if (VULNERABILITY_KEYWORDS.highway.some(k => text.includes(k)))  multiplier += 0.35;
  if (VULNERABILITY_KEYWORDS.market.some(k => text.includes(k)))   multiplier += 0.2;

  return Math.min(multiplier, 2.0); // cap at 2x
};

const getSeasonalBoost = (category) => {
  const currentMonth = new Date().getMonth() + 1;
  if (MONSOON_MONTHS.includes(currentMonth) && MONSOON_CATEGORIES.includes(category)) {
    return 25; // monsoon urgency boost
  }
  return 0;
};

const calculatePriorityScore = (issue) => {
  let score = 0;

  // ── 1. Severity base score ──────────────────────────────────
  const severityScores = { Low: 10, Medium: 30, High: 60, Critical: 100 };
  score += severityScores[issue.severity] || 30;

  // ── 2. Community engagement ─────────────────────────────────
  score += (issue.verificationCount || 0) * 5;
  score += (issue.upvotes?.length || 0) * 3;
  score += (issue.supporters?.length || 0) * 4; // supporters = confirmed duplicate = real issue

  // ── 3. Time decay (older unresolved issues get priority) ────
  const hoursOpen = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60);
  if      (hoursOpen > 168) score += 60; // > 1 week
  else if (hoursOpen > 72)  score += 40; // > 3 days
  else if (hoursOpen > 24)  score += 20; // > 1 day
  else if (hoursOpen > 12)  score += 10;

  // ── 4. Category risk multiplier ─────────────────────────────
  const categoryRisk = {
    'Road Damage':  1.3,
    'Sewage':       1.4,
    'Water Supply': 1.5,
    'Streetlight':  1.1,
    'Garbage':      1.0,
    'Building':     1.2,
    'Traffic':      1.35,
    'Park':         0.9,
    'Other':        1.0,
  };
  score *= categoryRisk[issue.category] || 1.0;

  // ── 5. Location vulnerability context ───────────────────────
  const contextMult = getContextMultiplier(issue.description, issue.title);
  score *= contextMult;

  // ── 6. Seasonal / weather boost ─────────────────────────────
  score += getSeasonalBoost(issue.category);

  // ── 7. Re-opened / not resolved penalty ─────────────────────
  if (issue.status === 'Needs Further Action') score += 30;

  score = Math.round(score);

  // ── 8. Convert score to label ────────────────────────────────
  let label;
  if      (score >= 200) label = 'Critical';
  else if (score >= 100) label = 'High';
  else if (score >= 50)  label = 'Medium';
  else                   label = 'Low';

  return { score, label };
};

// For frontend display — explains why this score was assigned
const explainPriorityScore = (issue) => {
  const reasons = [];
  const currentMonth = new Date().getMonth() + 1;
  const severityScores = { Low: 10, Medium: 30, High: 60, Critical: 100 };

  reasons.push(`Severity: ${issue.severity} (+${severityScores[issue.severity] || 30})`);

  if (issue.verificationCount > 0) reasons.push(`${issue.verificationCount} verifications (+${issue.verificationCount * 5})`);
  if (issue.upvotes?.length > 0)   reasons.push(`${issue.upvotes.length} upvotes (+${issue.upvotes.length * 3})`);
  if (issue.supporters?.length > 0) reasons.push(`${issue.supporters.length} supporters confirming`);

  const hoursOpen = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursOpen > 72) reasons.push('Open >72h (+40 urgency)');

  const contextMult = getContextMultiplier(issue.description, issue.title);
  if (contextMult > 1.2) reasons.push('Near school/hospital/highway (×' + contextMult.toFixed(1) + ')');

  if (MONSOON_MONTHS.includes(currentMonth) && MONSOON_CATEGORIES.includes(issue.category)) {
    reasons.push('Monsoon season boost (+25)');
  }

  if (issue.status === 'Needs Further Action') reasons.push('Not resolved after authority attempt (+30)');

  return reasons;
};

module.exports = { calculatePriorityScore, explainPriorityScore };
