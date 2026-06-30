/**
 * Seed script - populates MongoDB with demo data for CivicMind AI
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Issue = require('./models/Issue');
const Verification = require('./models/Verification');
const Reward = require('./models/Reward');
const Notification = require('./models/Notification');

const DEMO_USERS = [
  { name: 'Arvind Kumar', email: 'arvind@civicmind.com', password: 'demo123', role: 'citizen', points: 325, reportsCount: 8, verificationsCount: 15 },
  { name: 'Priya Sharma', email: 'priya@civicmind.com', password: 'demo123', role: 'citizen', points: 580, reportsCount: 14, verificationsCount: 32 },
  { name: 'Rahul Singh', email: 'rahul@civicmind.com', password: 'demo123', role: 'citizen', points: 210, reportsCount: 5, verificationsCount: 8 },
  { name: 'Sneha Patel', email: 'sneha@civicmind.com', password: 'demo123', role: 'citizen', points: 890, reportsCount: 22, verificationsCount: 45 },
  { name: 'PWD Authority', email: 'pwd@civicmind.gov', password: 'auth123', role: 'authority', department: 'PWD (Public Works Department)', points: 0 },
  { name: 'Municipal Corp', email: 'municipal@civicmind.gov', password: 'auth123', role: 'authority', department: 'Municipal Corporation', points: 0 },
  { name: 'Electricity Dept', email: 'electricity@civicmind.gov', password: 'auth123', role: 'authority', department: 'Electricity Department', points: 0 },
];

const DEMO_ISSUES = [
  {
    title: 'Large Pothole Near Bus Stop Causing Accidents',
    description: 'A massive pothole approximately 3 feet wide and 8 inches deep has formed near the main bus stop on MG Road. Multiple vehicles have been damaged and two minor accidents reported this week.',
    category: 'Road Damage',
    severity: 'Critical',
    status: 'Verified',
    location: { lat: 12.9716, lng: 77.5946, address: 'MG Road, near Garuda Mall Bus Stop', area: 'MG Road, Bengaluru' },
    priorityScore: 187,
    verificationCount: 12,
    assignedDept: 'PWD (Public Works Department)',
    aiAnalysis: { category: 'Road Damage', severity: 'Critical', risk: 'Accident Risk - High', confidence: '96%', description: 'Large pothole detected on main road creating significant vehicle and pedestrian hazard.', department: 'PWD (Public Works Department)', isDuplicate: false },
  },
  {
    title: 'Broken Streetlight Creating Dark Spots on Main Road',
    description: 'Three consecutive streetlights on Koramangala 5th Block main road are broken, creating a 200-meter dark stretch that is unsafe for pedestrians and cyclists at night.',
    category: 'Streetlight',
    severity: 'High',
    status: 'In Progress',
    location: { lat: 12.9352, lng: 77.6245, address: '5th Block, Koramangala', area: 'Koramangala, Bengaluru' },
    priorityScore: 134,
    verificationCount: 8,
    assignedDept: 'Electricity Department',
    aiAnalysis: { category: 'Streetlight', severity: 'High', risk: 'Night Safety Risk', confidence: '94%', description: 'Multiple non-functional streetlights creating safety hazard for pedestrians.', department: 'Electricity Department', isDuplicate: false },
  },
  {
    title: 'Garbage Overflowing Near Residential Colony',
    description: 'The garbage collection point near Indiranagar 12th Main has not been cleared for 5 days. Waste is overflowing onto the road, causing a foul smell and health hazard for residents.',
    category: 'Garbage',
    severity: 'High',
    status: 'Pending',
    location: { lat: 12.9784, lng: 77.6408, address: '12th Main Road, Indiranagar', area: 'Indiranagar, Bengaluru' },
    priorityScore: 98,
    verificationCount: 6,
    assignedDept: 'Municipal Corporation',
    aiAnalysis: { category: 'Garbage', severity: 'High', risk: 'Health Hazard', confidence: '98%', description: 'Overflowing garbage creating public health risk and environmental hazard.', department: 'Municipal Corporation', isDuplicate: false },
  },
  {
    title: 'Water Pipeline Leaking on Main Street',
    description: 'A major water pipeline has burst on HSR Layout Sector 2, wasting hundreds of liters of water per hour and causing waterlogging that blocks traffic.',
    category: 'Water Supply',
    severity: 'Critical',
    status: 'Resolved',
    location: { lat: 12.9121, lng: 77.6446, address: 'Sector 2, HSR Layout', area: 'HSR Layout, Bengaluru' },
    priorityScore: 220,
    verificationCount: 18,
    assignedDept: 'Water Supply Department',
    aiAnalysis: { category: 'Water Supply', severity: 'Critical', risk: 'Water Wastage + Traffic Block', confidence: '97%', description: 'Burst water main causing significant water loss and traffic disruption.', department: 'Water Supply Department', isDuplicate: false },
    resolutionVerification: { status: 'Fixed', aiComment: 'Pipeline has been repaired. No signs of water leakage visible. Road surface dry and traffic flowing normally.', verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  },
  {
    title: 'Sewage Overflow Blocking Footpath',
    description: 'A sewage drain has overflowed on Whitefield Main Road, flooding the footpath with sewage water. The stench is unbearable and it is a serious health hazard.',
    category: 'Sewage',
    severity: 'Critical',
    status: 'In Progress',
    location: { lat: 12.9698, lng: 77.7499, address: 'Whitefield Main Road, near ITPL Gate', area: 'Whitefield, Bengaluru' },
    priorityScore: 195,
    verificationCount: 14,
    assignedDept: 'Sewage & Sanitation Department',
    aiAnalysis: { category: 'Sewage', severity: 'Critical', risk: 'Severe Health Hazard', confidence: '99%', description: 'Sewage overflow creating major health risk and blocking pedestrian access.', department: 'Sewage & Sanitation Department', isDuplicate: false },
  },
  {
    title: 'Park Benches Damaged and Unusable',
    description: 'Multiple park benches in Cubbon Park near the south entrance are broken and have sharp metal edges that pose injury risk to children and elderly visitors.',
    category: 'Park',
    severity: 'Medium',
    status: 'Pending',
    location: { lat: 12.9767, lng: 77.5929, address: 'Cubbon Park, South Entrance', area: 'Cubbon Park, Bengaluru' },
    priorityScore: 45,
    verificationCount: 3,
    assignedDept: 'Parks & Recreation Department',
    aiAnalysis: { category: 'Park', severity: 'Medium', risk: 'Injury Risk for Visitors', confidence: '91%', description: 'Damaged park benches with sharp edges posing safety risk.', department: 'Parks & Recreation Department', isDuplicate: false },
  },
  {
    title: 'Traffic Signal Not Working at Busy Intersection',
    description: 'The traffic signal at the Silk Board junction flyover has been non-functional since morning causing massive traffic jams and near-miss accidents.',
    category: 'Traffic',
    severity: 'Critical',
    status: 'Resolved',
    location: { lat: 12.9174, lng: 77.6220, address: 'Silk Board Junction Flyover', area: 'Silk Board, Bengaluru' },
    priorityScore: 210,
    verificationCount: 22,
    assignedDept: 'Traffic Police / Municipal',
    aiAnalysis: { category: 'Traffic', severity: 'Critical', risk: 'Accident Risk - Very High', confidence: '95%', description: 'Non-functional traffic signal at high-traffic intersection causing accidents.', department: 'Traffic Police / Municipal', isDuplicate: false },
    resolutionVerification: { status: 'Fixed', aiComment: 'Traffic signal is now operational. Signal timing appears correctly set. Traffic flow normalized.', verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  },
  {
    title: 'Dangerous Pothole Near School Zone',
    description: 'A deep pothole has formed directly in front of the school gate on Jayanagar 4th Block. With hundreds of children crossing daily, this is an urgent safety risk.',
    category: 'Road Damage',
    severity: 'High',
    status: 'Verified',
    location: { lat: 12.9256, lng: 77.5934, address: 'Jayanagar 4th Block, near School Gate', area: 'Jayanagar, Bengaluru' },
    priorityScore: 156,
    verificationCount: 9,
    assignedDept: 'PWD (Public Works Department)',
    aiAnalysis: { category: 'Road Damage', severity: 'High', risk: 'Child Safety Risk', confidence: '93%', description: 'Pothole near school creating hazard for children and vehicles.', department: 'PWD (Public Works Department)', isDuplicate: false },
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Issue.deleteMany({}),
      Verification.deleteMany({}),
      Reward.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const u of DEMO_USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = await User.create({ ...u, password: hashed });
      await Reward.create({
        userId: user._id,
        totalPoints: u.points,
        level: u.points >= 500 ? 'Gold' : u.points >= 200 ? 'Silver' : 'Bronze',
        history: [{ action: 'signup', points: 50, description: 'Welcome bonus!' }]
      });
      createdUsers.push(user);
    }
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create issues
    const citizens = createdUsers.filter(u => u.role === 'citizen');
    const createdIssues = [];

    for (let i = 0; i < DEMO_ISSUES.length; i++) {
      const issueData = DEMO_ISSUES[i];
      const creator = citizens[i % citizens.length];
      const resolvedAt = issueData.status === 'Resolved' ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) : undefined;

      const issue = await Issue.create({
        ...issueData,
        createdBy: creator._id,
        upvotes: citizens.slice(0, Math.floor(Math.random() * 4)).map(u => u._id),
        resolvedAt,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
      createdIssues.push(issue);
    }
    console.log(`📋 Created ${createdIssues.length} issues`);

    // Create verifications
    for (const issue of createdIssues) {
      const verifiers = citizens.slice(0, Math.min(issue.verificationCount, citizens.length));
      for (const verifier of verifiers) {
        try {
          await Verification.create({
            issueId: issue._id,
            userId: verifier._id,
            vote: 'confirm',
            comment: 'I can confirm this issue exists in the area.',
          });
        } catch {}
      }
    }
    console.log('✅ Created verifications');

    // Create notifications
    for (const user of citizens) {
      await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Welcome to CivicMind AI! 🎉',
        message: 'Start reporting civic issues and earn reward points. You got 50 welcome points!',
        isRead: false,
      });
    }
    console.log('🔔 Created notifications');

    console.log('\n🚀 SEEDING COMPLETE!\n');
    console.log('Demo Login Credentials:');
    console.log('  Citizen:   arvind@civicmind.com / demo123');
    console.log('  Citizen:   priya@civicmind.com / demo123');
    console.log('  Authority: pwd@civicmind.gov / auth123');
    console.log('  Authority: municipal@civicmind.gov / auth123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seed();
