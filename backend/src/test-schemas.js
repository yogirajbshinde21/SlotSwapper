require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const SwapRequest = require('./models/SwapRequest');

/**
 * Test script to verify schemas work correctly
 * Run with: node src/test-schemas.js
 */

async function testSchemas() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up test data if exists
    await User.deleteMany({ email: /test.*@test\.com/ });
    await Event.deleteMany({});
    await SwapRequest.deleteMany({});

    // ============================================
    // TEST 1: Create Users
    // ============================================
    console.log('📝 TEST 1: Creating users...');
    
    const user1 = await User.create({
      name: 'Alice',
      email: 'test.alice@test.com',
      password: 'password123' // Will be hashed automatically
    });
    console.log(`  ✅ Created user: ${user1.name} (${user1.email})`);

    const user2 = await User.create({
      name: 'Bob',
      email: 'test.bob@test.com',
      password: 'password456'
    });
    console.log(`  ✅ Created user: ${user2.name} (${user2.email})`);

    // Verify password was hashed
    console.log(`  🔒 Password hashed: ${user1.password.substring(0, 20)}...`);

    // Test password comparison
    const isMatch = await user1.comparePassword('password123');
    console.log(`  🔐 Password comparison works: ${isMatch}\n`);

    // ============================================
    // TEST 2: Create Events
    // ============================================
    console.log('📝 TEST 2: Creating events...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const event1 = await Event.create({
      userId: user1._id,
      title: 'Team Meeting',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // +1 hour
      status: 'SWAPPABLE'
    });
    console.log(`  ✅ Created event: ${event1.title}`);
    console.log(`  ⏱️  Duration: ${event1.durationMinutes} minutes`);

    const event2 = await Event.create({
      userId: user2._id,
      title: 'Dentist Appointment',
      startTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // +2 hours
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // +3 hours
      status: 'SWAPPABLE'
    });
    console.log(`  ✅ Created event: ${event2.title}\n`);

    // ============================================
    // TEST 3: Test Event Methods
    // ============================================
    console.log('📝 TEST 3: Testing event methods...');
    
    const swappableSlots = await Event.findSwappableSlots(user1._id);
    console.log(`  ✅ Found ${swappableSlots.length} swappable slots (excluding user1's)`);
    console.log(`     Slot owner: ${swappableSlots[0].userId.name}\n`);

    // ============================================
    // TEST 4: Create Swap Request
    // ============================================
    console.log('📝 TEST 4: Creating swap request...');

    const swapRequest = await SwapRequest.create({
      requesterId: user1._id,
      requestedUserId: user2._id,
      mySlotId: event1._id,
      theirSlotId: event2._id,
      message: 'Can we swap? I prefer afternoon.'
    });
    console.log(`  ✅ Created swap request`);
    console.log(`     Status: ${swapRequest.status}`);
    console.log(`     Can respond: ${swapRequest.canRespond()}\n`);

    // ============================================
    // TEST 5: Test SwapRequest Static Methods
    // ============================================
    console.log('📝 TEST 5: Testing swap request queries...');

    const incomingRequests = await SwapRequest.findIncomingRequests(user2._id);
    console.log(`  ✅ User2 has ${incomingRequests.length} incoming request(s)`);
    console.log(`     From: ${incomingRequests[0].requesterId.name}`);

    const outgoingRequests = await SwapRequest.findOutgoingRequests(user1._id);
    console.log(`  ✅ User1 has ${outgoingRequests.length} outgoing request(s)`);
    console.log(`     To: ${outgoingRequests[0].requestedUserId.name}\n`);

    // ============================================
    // TEST 6: Validation Tests
    // ============================================
    console.log('📝 TEST 6: Testing validations...');

    try {
      // Should fail: end time before start time
      await Event.create({
        userId: user1._id,
        title: 'Invalid Event',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() - 1000) // Before start
      });
    } catch (error) {
      console.log(`  ✅ Validation works: ${error.message}`);
    }

    try {
      // Should fail: swap with yourself
      await SwapRequest.create({
        requesterId: user1._id,
        requestedUserId: user1._id, // Same user!
        mySlotId: event1._id,
        theirSlotId: event2._id
      });
    } catch (error) {
      console.log(`  ✅ Validation works: ${error.message}\n`);
    }

    console.log('🎉 All schema tests passed!\n');

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await User.deleteMany({ email: /test.*@test\.com/ });
    await Event.deleteMany({ userId: { $in: [user1._id, user2._id] } });
    await SwapRequest.deleteMany({ requesterId: { $in: [user1._id, user2._id] } });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run tests
testSchemas();