const User = require('../models/User');

/**
 * Badge Definitions
 * Each badge has: id, name, icon, description, category, condition checker
 */
const BADGE_DEFS = [
  // Reporter badges
  { id: 'first_report',    name: 'First Report',     icon: '📸', category: 'Reporter',  desc: 'Submitted your first civic issue',          check: (u) => u.reportsCount >= 1 },
  { id: 'local_reporter',  name: 'Local Reporter',   icon: '🥉', category: 'Reporter',  desc: 'Reported 10 issues',                         check: (u) => u.reportsCount >= 10 },
  { id: 'community_hero',  name: 'Community Hero',   icon: '🥈', category: 'Reporter',  desc: 'Reported 50 issues',                         check: (u) => u.reportsCount >= 50 },
  { id: 'city_guardian',   name: 'City Guardian',    icon: '🥇', category: 'Reporter',  desc: 'Reported 200 issues — legend!',              check: (u) => u.reportsCount >= 200 },

  // Verifier badges
  { id: 'first_verify',    name: 'First Verify',     icon: '✅', category: 'Verifier', desc: 'Verified your first community issue',        check: (u) => u.verificationsCount >= 1 },
  { id: 'ai_verifier',     name: 'AI Verifier',      icon: '🕵️', category: 'Verifier', desc: '100 successful verifications',               check: (u) => u.verificationsCount >= 100 },
  { id: 'eagle_eye',       name: 'Eagle Eye',        icon: '🦅', category: 'Verifier', desc: 'Spotted and verified 25 critical issues',    check: (u) => u.verificationsCount >= 25 },

  // Specialist badges
  { id: 'road_warrior',    name: 'Road Warrior',     icon: '🏆', category: 'Specialist', desc: '50 road damage reports',                   check: (u) => (u.categoryCount?.['Road Damage'] || 0) >= 50 },
  { id: 'water_guardian',  name: 'Water Guardian',   icon: '💧', category: 'Specialist', desc: '20 water supply/sewage reports',           check: (u) => ((u.categoryCount?.['Water Supply'] || 0) + (u.categoryCount?.['Sewage'] || 0)) >= 20 },
  { id: 'light_keeper',    name: 'Light Keeper',     icon: '💡', category: 'Specialist', desc: '15 streetlight issue reports',             check: (u) => (u.categoryCount?.['Streetlight'] || 0) >= 15 },

  // Points-based badges
  { id: 'point_100',       name: 'Rising Star',      icon: '⭐', category: 'Points',    desc: 'Earned 100+ civic points',                 check: (u) => u.points >= 100 },
  { id: 'point_500',       name: 'Platinum Civic',   icon: '⚡', category: 'Points',    desc: 'Earned 500+ civic points',                 check: (u) => u.points >= 500 },
  { id: 'point_1000',      name: 'Diamond Legend',   icon: '💎', category: 'Points',    desc: 'Earned 1000+ civic points — elite status', check: (u) => u.points >= 1000 },

  // Community badges
  { id: 'community_pillar',name: 'Community Pillar', icon: '🏛️', category: 'Community', desc: '100+ verifications',                       check: (u) => u.verificationsCount >= 100 },
  { id: 'civic_hero',      name: 'Civic Hero',       icon: '🦸', category: 'Community', desc: 'Resolved issues confirmed by AI',           check: (u) => u.resolvedCount >= 5 },
];

/**
 * Check & award new badges for a user.
 * Returns array of newly earned badge names.
 */
const awardBadges = async (userId, categoryCount = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const existingIds = new Set((user.badges || []).map(b => b.id || b.name));
    const newBadges = [];

    // Build user stat object for checking
    const userStats = {
      reportsCount: user.reportsCount || 0,
      verificationsCount: user.verificationsCount || 0,
      resolvedCount: user.resolvedCount || 0,
      points: user.points || 0,
      categoryCount,
    };

    for (const badge of BADGE_DEFS) {
      if (!existingIds.has(badge.id) && badge.check(userStats)) {
        user.badges.push({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          earnedAt: new Date(),
        });
        newBadges.push({ name: badge.name, icon: badge.icon, desc: badge.desc });
      }
    }

    if (newBadges.length > 0) {
      await user.save();
    }

    return newBadges;
  } catch (err) {
    console.error('Badge award error:', err.message);
    return [];
  }
};

/**
 * Monthly challenges — rotate by current month
 */
const MONTHLY_CHALLENGES = [
  { id: 'clean_city',      title: 'Clean City Week',    icon: '🏙️', desc: 'Top 10 garbage reporters this month get +100 bonus points', target: 'Garbage',      goal: 5 },
  { id: 'road_safety',     title: 'Road Safety Drive',  icon: '🛣️', desc: 'Report 3+ road issues to earn the Road Warrior badge faster', target: 'Road Damage',  goal: 3 },
  { id: 'water_watch',     title: 'Water Watch',        icon: '💧', desc: 'Every water supply report earns double points this month', target: 'Water Supply',  goal: 3 },
  { id: 'verify_blitz',    title: 'Verification Blitz', icon: '✅', desc: 'Verify 10 community issues to unlock Eagle Eye badge progress', target: 'verify',       goal: 10 },
  { id: 'light_it_up',     title: 'Light It Up',        icon: '💡', desc: 'Report 5+ streetlight issues — keep your city safe at night', target: 'Streetlight',  goal: 5 },
  { id: 'community_surge', title: 'Community Surge',    icon: '👥', desc: 'Get 5 community confirmations on your reports this month', target: 'support',       goal: 5 },
];

const getCurrentChallenge = () => {
  const month = new Date().getMonth(); // 0-11
  return MONTHLY_CHALLENGES[month % MONTHLY_CHALLENGES.length];
};

const getAllBadges = () => BADGE_DEFS.map(b => ({ id: b.id, name: b.name, icon: b.icon, desc: b.desc, category: b.category }));

module.exports = { BADGE_DEFS, awardBadges, getCurrentChallenge, getAllBadges };
