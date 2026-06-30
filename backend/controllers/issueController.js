const Issue = require('../models/Issue');
const Verification = require('../models/Verification');
const Notification = require('../models/Notification');
const Reward = require('../models/Reward');
const User = require('../models/User');
const { classifyIssue } = require('../ai/classifyIssue');
const { detectDuplicate } = require('../ai/duplicateDetector');
const { calculatePriorityScore } = require('../ai/priorityEngine');
const { verifyResolution } = require('../ai/verifyIssue');
const { awardBadges } = require('../ai/badgeEngine');
const { routeIssue } = require('../ai/routeIssue');
const path = require('path');

// @desc    Create a new issue (with AI analysis)
// @route   POST /api/issues
const createIssue = async (req, res) => {
  const { lat, lng, address, area, manualCategory } = req.body;

  if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
  if (!lat || !lng) return res.status(400).json({ success: false, message: 'Location is required' });

  const imagePath = req.file.path;

  // ===== AI Agent 1: Classify the image =====
  const { analysis } = await classifyIssue(imagePath);
  const category = manualCategory || analysis.category;

  // ===== AI Agent 2: Duplicate Detection (Full Gemini Vision Pipeline) =====
  const dupResult = await detectDuplicate(
    parseFloat(lat), parseFloat(lng),
    category, analysis.description,
    imagePath,  // pass image for Gemini vision comparison
    50          // 50 meter radius
  );

  // ===================================================
  // 🔥 DUPLICATE BRANCH: Add citizen as SUPPORTER
  // ===================================================
  if (dupResult.isDuplicate && dupResult.existingIssue) {
    const existingId = dupResult.existingIssue.id;
    const existingIssue = await Issue.findById(existingId);

    if (!existingIssue) {
      return res.status(404).json({ success: false, message: 'Existing issue not found' });
    }

    // Check if user is already a supporter or creator
    const alreadySupporting = existingIssue.supporters.some(
      s => s.userId.toString() === req.user._id.toString()
    );
    const isCreator = existingIssue.createdBy.toString() === req.user._id.toString();

    if (alreadySupporting || isCreator) {
      return res.status(200).json({
        success: true,
        isDuplicateCase: true,
        alreadySupporting: true,
        existingIssue: dupResult.existingIssue,
        aiConfidence: dupResult.confidence,
        aiReason: dupResult.reason,
        message: 'You are already supporting this issue!',
      });
    }

    // Add as supporter
    existingIssue.supporters.push({
      userId: req.user._id,
      addedAt: new Date(),
      confidence: `${dupResult.confidence}%`,
      reason: dupResult.reason,
    });

    // Bump verification and recalculate priority
    existingIssue.verificationCount += 1;
    if (existingIssue.status === 'Pending' && existingIssue.verificationCount >= 3) {
      existingIssue.status = 'Verified';
    }
    const { score } = calculatePriorityScore(existingIssue);
    existingIssue.priorityScore = score;
    await existingIssue.save();

    // Award supporter points (+15 — more than upvote, less than new report)
    await Reward.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: { totalPoints: 15 },
        $push: {
          history: {
            action: 'support',
            points: 15,
            description: `Supported duplicate issue: ${existingIssue.title}`,
            issueId: existingIssue._id,
          }
        }
      },
      { upsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 15 } });

    // Notify original reporter
    await Notification.create({
      userId: existingIssue.createdBy,
      type: 'new_supporter',
      title: '🙌 Someone confirmed your report!',
      message: `Another citizen reported the same ${category} issue. AI confirmed it's the same problem (${dupResult.confidence}% confidence). Supporter added to your report!`,
      issueId: existingIssue._id,
    });

    // 🔌 Real-time: notify reporter and area
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${existingIssue.createdBy}`).emit('new-supporter', {
        issueId: existingIssue._id,
        title: existingIssue.title,
        supporterCount: existingIssue.supporters.length,
        confidence: dupResult.confidence,
      });
    }

    return res.status(200).json({
      success: true,
      isDuplicateCase: true,
      alreadySupporting: false,
      newSupporterCount: existingIssue.supporters.length,
      existingIssue: {
        ...dupResult.existingIssue,
        supporterCount: existingIssue.supporters.length,
        verificationCount: existingIssue.verificationCount,
        status: existingIssue.status,
        priorityScore: existingIssue.priorityScore,
      },
      aiConfidence: dupResult.confidence,
      aiReason: dupResult.reason,
      matchFactors: dupResult.matchFactors,
      distanceMeters: dupResult.distanceMeters,
      pointsEarned: 15,
      message: `Duplicate detected! You've been added as a supporter (AI: ${dupResult.confidence}% match).`,
    });
  }

  // ===================================================
  // ✅ UNIQUE BRANCH: Create new issue
  // ===================================================
  const issue = await Issue.create({
    title: analysis.title,
    description: analysis.description,
    category,
    severity: analysis.severity,
    location: { lat: parseFloat(lat), lng: parseFloat(lng), address, area },
    images: [imagePath.replace(/\\/g, '/')],
    assignedDept: analysis.department,
    createdBy: req.user._id,
    supporters: [],
    aiAnalysis: {
      ...analysis,
      department: analysis.department,
      isDuplicate: false,
    },
  });

  // ===== AI Agent 4: Smart Routing (always runs Gemini) =====
  const routing = await routeIssue(category, analysis.description, analysis.severity, analysis.title);

  // Calculate priority score
  const { score, label } = calculatePriorityScore(issue);
  issue.priorityScore = score;
  issue.assignedDept = routing.department; // may override classifyIssue's dept
  await issue.save();

  // Award points to reporter
  await Reward.findOneAndUpdate(
    { userId: req.user._id },
    { $inc: { totalPoints: 25 }, $push: { history: { action: 'report', points: 25, description: `Reported: ${issue.title}`, issueId: issue._id } } },
    { upsert: true }
  );
  await User.findByIdAndUpdate(req.user._id, { $inc: { points: 25, reportsCount: 1 } });
  // Check for new badges after report
  const newBadges = await awardBadges(req.user._id);
  if (newBadges.length > 0) {
    const io = req.app.get('io');
    if (io) io.to(`user-${req.user._id}`).emit('badge-earned', { badges: newBadges });
  }

  // 🔌 Emit real-time event to area room
  const io = req.app.get('io');
  if (io) {
    const areaRoom = `area-${Math.round(parseFloat(lat) * 100)}-${Math.round(parseFloat(lng) * 100)}`;
    io.to(areaRoom).emit('new-issue', {
      id: issue._id,
      title: issue.title,
      severity: issue.severity,
      category: issue.category,
      location: issue.location,
    });
  }

  res.status(201).json({
    success: true,
    isDuplicateCase: false,
    issue,
    aiAnalysis: {
      ...analysis,
      department: routing.department,
      routingReason: routing.reason,
      routingConfidence: routing.routingConfidence,
      suggestedActions: routing.suggestedActions,
      escalationNeeded: routing.escalationNeeded,
      escalationReason: routing.escalationReason,
    },
    priorityLabel: label,
    pointsEarned: 25,
  });
};


// @desc    Get all issues (with filters)
// @route   GET /api/issues
const getIssues = async (req, res) => {
  const { category, status, severity, page = 1, limit = 20, lat, lng, radius } = req.query;

  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (severity) query.severity = severity;

  if (lat && lng && radius) {
    const r = parseFloat(radius) / 111000; // approx degrees
    query['location.lat'] = { $gte: parseFloat(lat) - r, $lte: parseFloat(lat) + r };
    query['location.lng'] = { $gte: parseFloat(lng) - r, $lte: parseFloat(lng) + r };
  }

  const total = await Issue.countDocuments(query);
  const issues = await Issue.find(query)
    .populate('createdBy', 'name avatar points')
    .populate('assignedTo', 'name department')
    .sort({ priorityScore: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  res.json({ success: true, issues, total, page: parseInt(page), pages: Math.ceil(total / limit) });
};

// @desc    Get single issue
// @route   GET /api/issues/:id
const getIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate('createdBy', 'name avatar points badges')
    .populate('assignedTo', 'name department');

  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const verifications = await Verification.find({ issueId: issue._id })
    .populate('userId', 'name avatar');

  res.json({ success: true, issue, verifications });
};

// @desc    Verify an issue (community)
// @route   POST /api/issues/:id/verify
const verifyIssue = async (req, res) => {
  const { vote, comment } = req.body;

  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const existing = await Verification.findOne({ issueId: issue._id, userId: req.user._id });
  if (existing) return res.status(400).json({ success: false, message: 'Already verified this issue' });

  await Verification.create({ issueId: issue._id, userId: req.user._id, vote, comment });

  issue.verificationCount += 1;
  if (issue.status === 'Pending' && issue.verificationCount >= 3) issue.status = 'Verified';

  const { score } = calculatePriorityScore(issue);
  issue.priorityScore = score;
  await issue.save();

  // Award points
  await Reward.findOneAndUpdate(
    { userId: req.user._id },
    { $inc: { totalPoints: 10 }, $push: { history: { action: 'verify', points: 10, description: `Verified: ${issue.title}`, issueId: issue._id } } },
    { upsert: true }
  );
  await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10, verificationsCount: 1 } });

  // 🔌 Emit to issue creator
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${issue.createdBy}`).emit('issue-verified', {
      issueId: issue._id,
      title: issue.title,
      count: issue.verificationCount,
      status: issue.status,
    });
  }

  res.json({ success: true, message: 'Verification recorded', issue });
};

// @desc    Upvote an issue
// @route   POST /api/issues/:id/upvote
const upvoteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const idx = issue.upvotes.indexOf(req.user._id);
  if (idx > -1) {
    issue.upvotes.splice(idx, 1);
  } else {
    issue.upvotes.push(req.user._id);
    await Reward.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalPoints: 5 } },
      { upsert: true }
    );
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });
  }

  const { score } = calculatePriorityScore(issue);
  issue.priorityScore = score;
  await issue.save();

  res.json({ success: true, upvotes: issue.upvotes.length, upvoted: idx === -1 });
};

// @desc    Authority resolves issue with after-image → AI inspects before/after
// @route   PUT /api/issues/:id/resolve
const resolveIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id).populate('createdBy', 'name');
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Resolution proof image required' });

  const afterImagePath  = req.file.path;
  const beforeImagePath = issue.images?.[0];

  if (!beforeImagePath) {
    return res.status(400).json({ success: false, message: 'Original issue image not found for comparison' });
  }

  // Save the after-image path
  issue.afterImage = afterImagePath.replace(/\\/g, '/');

  // ===== AI Agent 5: Resolution Verification =====
  console.log(`\n🔬 AI Inspector: comparing before/after for "${issue.title}"`);
  const { verification } = await verifyResolution(
    beforeImagePath,
    afterImagePath,
    issue.category,
    issue.description
  );

  // Save full AI verdict
  issue.resolutionVerification = {
    verdict:       verification.verdict,
    confidence:    verification.confidence,
    summary:       verification.summary,
    improvements:  verification.improvements,
    concerns:      verification.concerns,
    isFakePhoto:   verification.isFakePhoto,
    inspectorNote: verification.inspectorNote,
    verifiedAt:    new Date(),
  };

  // ── Status routing based on verdict ──────────────────
  let newStatus;
  let notifTitle;
  let notifMessage;

  if (verification.verdict === 'Resolved') {
    newStatus     = 'Resolved';
    issue.resolvedAt = new Date();
    notifTitle   = '🎉 Your issue has been RESOLVED!';
    notifMessage = `AI Verdict (${verification.confidence}% confidence): ${verification.summary}`;
  } else if (verification.verdict === 'Partial Fix') {
    newStatus     = 'In Progress';
    notifTitle   = '🔧 Partial fix detected';
    notifMessage = `AI says: ${verification.summary}. Still in progress.`;
  } else {
    // "Not Resolved" — could be fake photo
    newStatus     = 'Needs Further Action';
    notifTitle   = verification.isFakePhoto
      ? '⚠️ Possible fake fix submitted!'
      : '❌ AI says issue NOT resolved';
    notifMessage = `${verification.summary} Community verification requested.`;
  }

  issue.status = newStatus;
  const { score } = calculatePriorityScore(issue);
  issue.priorityScore = score;
  await issue.save();

  const io = req.app.get('io');

  // ── Notify original reporter ──────────────────────────
  await Notification.create({
    userId:  issue.createdBy._id,
    type:    'issue_resolved',
    title:   notifTitle,
    message: notifMessage,
    issueId: issue._id,
  });

  // ── Notify ALL supporters ─────────────────────────────
  if (issue.supporters?.length > 0) {
    const supporterNotifs = issue.supporters.map(s => ({
      userId:  s.userId,
      type:    'issue_resolved',
      title:   `Issue you supported: ${notifTitle}`,
      message: notifMessage,
      issueId: issue._id,
    }));
    await Notification.insertMany(supporterNotifs);
  }

  // ── If NOT Resolved → ask nearby citizens to confirm ──
  if (newStatus === 'Needs Further Action') {
    // Find citizens who verified this issue — they're most likely nearby
    const verifiers = await Verification.find({ issueId: issue._id }).select('userId').limit(20);
    const targetUserIds = [
      issue.createdBy._id,
      ...issue.supporters.map(s => s.userId),
      ...verifiers.map(v => v.userId),
    ];

    const uniqueIds = [...new Set(targetUserIds.map(id => id.toString()))];
    const communityNotifs = uniqueIds.map(uid => ({
      userId:  uid,
      type:    'community_confirm_requested',
      title:   '🔎 Your vote needed!',
      message: `AI flagged "${issue.title}" as NOT fully resolved. Do you confirm it's fixed? Visit Community Feed to vote.`,
      issueId: issue._id,
    }));
    await Notification.insertMany(communityNotifs);

    // Socket: broadcast community confirm request
    if (io) {
      uniqueIds.forEach(uid => {
        io.to(`user-${uid}`).emit('community-confirm-requested', {
          issueId: issue._id,
          title:   issue.title,
          verdict: verification.verdict,
          summary: verification.summary,
          isFakePhoto: verification.isFakePhoto,
        });
      });
    }
  }

  // ── Real-time socket to reporter & area ──────────────
  if (io) {
    io.to(`user-${issue.createdBy._id}`).emit('issue-resolved', {
      issueId:  issue._id,
      title:    issue.title,
      verdict:  verification.verdict,
      status:   newStatus,
      comment:  verification.summary,
      confidence: verification.confidence,
    });

    const areaRoom = `area-${Math.round(issue.location.lat * 100)}-${Math.round(issue.location.lng * 100)}`;
    io.to(areaRoom).emit('priority-updated', { issueId: issue._id, score: issue.priorityScore, status: newStatus });
  }

  res.json({
    success: true,
    issue,
    verification,
    newStatus,
    message: `AI Inspector verdict: ${verification.verdict} (${verification.confidence}% confidence)`,
  });
};

// @desc    Citizen confirms or denies a resolution (when AI says "Not Resolved")
// @route   POST /api/issues/:id/community-confirm
const communityConfirmResolution = async (req, res) => {
  const { vote } = req.body; // 'yes' or 'no'
  if (!['yes', 'no'].includes(vote)) {
    return res.status(400).json({ success: false, message: 'Vote must be "yes" or "no"' });
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  if (issue.status !== 'Needs Further Action') {
    return res.status(400).json({ success: false, message: 'This issue is not awaiting community confirmation' });
  }

  // Check if user already voted
  const alreadyVoted = issue.communityConfirms?.some(c => c.userId.toString() === req.user._id.toString());
  if (alreadyVoted) {
    return res.status(400).json({ success: false, message: 'You have already voted on this resolution' });
  }

  // Record vote
  issue.communityConfirms.push({ userId: req.user._id, vote, votedAt: new Date() });
  await issue.save();

  // Award points for participating in civic oversight
  await Reward.findOneAndUpdate(
    { userId: req.user._id },
    { $inc: { totalPoints: 8 }, $push: { history: { action: 'community_confirm', points: 8, description: `Resolution vote on: ${issue.title}`, issueId: issue._id } } },
    { upsert: true }
  );
  await User.findByIdAndUpdate(req.user._id, { $inc: { points: 8 } });

  // Tally votes
  const yesVotes = issue.communityConfirms.filter(c => c.vote === 'yes').length;
  const noVotes  = issue.communityConfirms.filter(c => c.vote === 'no').length;
  const total    = issue.communityConfirms.length;

  let autoResolved = false;
  let newStatus    = issue.status;

  // Auto-resolve after 3 "yes" → community agrees it's fixed
  if (yesVotes >= 3) {
    issue.status    = 'Resolved';
    issue.resolvedAt = new Date();
    newStatus       = 'Resolved';
    autoResolved    = true;
    await issue.save();

    // Notify reporter
    await Notification.create({
      userId:  issue.createdBy,
      type:    'issue_resolved',
      title:   '🎉 Community confirmed your issue is RESOLVED!',
      message: `${yesVotes} citizens voted that the fix is genuine. Issue closed!`,
      issueId: issue._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${issue.createdBy}`).emit('issue-resolved', {
        issueId: issue._id,
        title:   issue.title,
        verdict: 'Community Confirmed',
        status:  'Resolved',
        comment: `${yesVotes}/${total} citizens confirmed the fix.`,
      });
    }
  }

  // If 3 "no" → confirm as still unresolved
  if (noVotes >= 3 && !autoResolved) {
    issue.status = 'Needs Further Action';
    await issue.save();

    await Notification.create({
      userId:  issue.createdBy,
      type:    'issue_flagged',
      title:   '❌ Community says issue NOT fixed',
      message: `${noVotes} citizens confirmed the fix is inadequate. Authority action required.`,
      issueId: issue._id,
    });
  }

  res.json({
    success: true,
    vote,
    yesVotes,
    noVotes,
    totalVotes: total,
    autoResolved,
    newStatus,
    pointsEarned: 8,
    message: autoResolved
      ? `Community confirmed resolution! Issue marked Resolved.`
      : `Vote recorded. (${yesVotes} yes / ${noVotes} no so far)`,
  });
};

// @desc    Get issues for authority dashboard
// @route   GET /api/issues/authority
const getAuthorityIssues = async (req, res) => {
  const { department } = req.user;
  const query = department ? { assignedDept: department } : {};

  const issues = await Issue.find(query)
    .populate('createdBy', 'name avatar')
    .sort({ priorityScore: -1, createdAt: -1 })
    .limit(50);

  const stats = {
    total: await Issue.countDocuments(query),
    pending: await Issue.countDocuments({ ...query, status: 'Pending' }),
    inProgress: await Issue.countDocuments({ ...query, status: 'In Progress' }),
    resolved: await Issue.countDocuments({ ...query, status: 'Resolved' }),
    critical: await Issue.countDocuments({ ...query, severity: 'Critical' }),
  };

  res.json({ success: true, issues, stats });
};

module.exports = { createIssue, getIssues, getIssue, verifyIssue, upvoteIssue, resolveIssue, getAuthorityIssues, communityConfirmResolution };
