const axios = require("axios");

const BASE_URL = "http://localhost:3001";

let createdUserId = null;
let createdUser2Id = null;
let createdPostId = null;

function pass(label, data) {
  console.log(`✅ ${label}:`, JSON.stringify(data).slice(0, 120));
}

function fail(label, err) {
  console.error(`❌ ${label}:`, err.response?.data || err.message);
}

// ─── USERS ───────────────────────────────────────────────────────────────────

async function testCreateUser() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users`, {
      account: "duck123",
      username: "Mihir",
      age: 19,
      gender: "male",
      university: "Stevens Institute of Technology",
    });
    pass("Create User 1", res.data);
  } catch (e) {
    fail("Create User 1", e);
  }
}

async function testCreateUser2() {
  try {
    const res = await axios.post(`${BASE_URL}/api/users`, {
      account: "jane456",
      username: "Jane",
      age: 22,
      gender: "female",
      university: "Stevens Institute of Technology",
    });
    pass("Create User 2", res.data);
  } catch (e) {
    fail("Create User 2", e);
  }
}

async function testGetUsers() {
  // Fetch the two most recently created users so we have their IDs
  try {
    const res = await axios.get(`${BASE_URL}/api/users/lookup?limit=2`);
    pass("Lookup Users", res.data);
  } catch {
    // If lookup doesn't exist, just log a note — we'll grab IDs via Snowflake
    console.log("ℹ️  No /lookup route — get user IDs from Snowflake:");
    console.log("   SELECT ID, USERNAME FROM USERS ORDER BY CREATED_AT DESC LIMIT 5;");
  }
}

async function testGetUserById() {
  if (!createdUserId) {
    console.log("⚠️  Skipping Get User By ID — no userId available (set createdUserId manually)");
    return;
  }
  try {
    const res = await axios.get(`${BASE_URL}/api/users/${createdUserId}`);
    pass("Get User By ID", res.data);
  } catch (e) {
    fail("Get User By ID", e);
  }
}

async function testUpdateUser() {
  if (!createdUserId) {
    console.log("⚠️  Skipping Update User — no userId available");
    return;
  }
  try {
    const res = await axios.put(`${BASE_URL}/api/users/${createdUserId}`, {
      username: "MihirUpdated",
      age: 20,
    });
    pass("Update User", res.data);
  } catch (e) {
    fail("Update User", e);
  }
}

async function testUpdateUserStatus() {
  if (!createdUserId) {
    console.log("⚠️  Skipping Update Status — no userId available");
    return;
  }
  try {
    const res = await axios.put(`${BASE_URL}/api/users/${createdUserId}/status`, {
      isOnline: true,
    });
    pass("Update User Status", res.data);
  } catch (e) {
    fail("Update User Status", e);
  }
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

async function testCreatePost() {
  if (!createdUserId) {
    console.log("⚠️  Skipping Create Post — no userId available");
    return;
  }
  try {
    const res = await axios.post(`${BASE_URL}/api/posts`, {
      userId: createdUserId,
      startLat: 40.7448,
      startLng: -74.0248,
      endLat: 40.7580,
      endLng: -73.9855,
      destination: "Hoboken Terminal",
      mode: "walking",
    });
    pass("Create Post", res.data);
  } catch (e) {
    fail("Create Post", e);
  }
}

async function testGetPosts() {
  try {
    const res = await axios.get(`${BASE_URL}/api/posts`, {
      params: {
        sortBy: "earliest",
        userLat: 40.7448,
        userLng: -74.0248,
      },
    });
    pass(`Get Posts (earliest) — ${res.data.length} result(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Posts", e);
  }
}

async function testGetPostsSortedByAge() {
  try {
    const res = await axios.get(`${BASE_URL}/api/posts`, {
      params: { sortBy: "age", userLat: 40.7448, userLng: -74.0248 },
    });
    pass(`Get Posts (age sort) — ${res.data.length} result(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Posts (age sort)", e);
  }
}

async function testDeletePost() {
  if (!createdPostId) {
    console.log("⚠️  Skipping Delete Post — no postId available (set createdPostId manually)");
    return;
  }
  try {
    const res = await axios.delete(`${BASE_URL}/api/posts/${createdPostId}`);
    pass("Delete Post", res.data);
  } catch (e) {
    fail("Delete Post", e);
  }
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

async function testSendMessage() {
  if (!createdUserId || !createdUser2Id) {
    console.log("⚠️  Skipping Send Message — need both user IDs (set createdUserId + createdUser2Id manually)");
    return;
  }
  try {
    const res = await axios.post(`${BASE_URL}/api/messages`, {
      senderId: createdUserId,
      recipientId: createdUser2Id,
      content: "Hey, want to share a ride to Hoboken Terminal?",
    });
    pass("Send Message", res.data);
  } catch (e) {
    fail("Send Message", e);
  }
}

async function testGetChatHistory() {
  if (!createdUserId || !createdUser2Id) {
    console.log("⚠️  Skipping Get Chat History — need both user IDs");
    return;
  }
  try {
    const res = await axios.get(`${BASE_URL}/api/messages/chat/${createdUserId}/${createdUser2Id}`);
    pass(`Get Chat History — ${res.data.length} message(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Chat History", e);
  }
}

async function testGetConversations() {
  if (!createdUserId) {
    console.log("⚠️  Skipping Get Conversations — no userId available");
    return;
  }
  try {
    const res = await axios.get(`${BASE_URL}/api/messages/conversations/${createdUserId}`);
    pass(`Get Conversations — ${res.data.length} conversation(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Conversations", e);
  }
}

async function testArchiveChat() {
  if (!createdUserId || !createdUser2Id) {
    console.log("⚠️  Skipping Archive Chat — need both user IDs");
    return;
  }
  try {
    const res = await axios.post(
      `${BASE_URL}/api/messages/archive/${createdUserId}/${createdUser2Id}`
    );
    pass("Archive Chat", res.data);
  } catch (e) {
    fail("Archive Chat", e);
  }
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

async function testHealth() {
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    pass("Health Check", res.data);
  } catch (e) {
    fail("Health Check", e);
  }
}

// ─── RUNNER ───────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  HomeSafely — No-Auth Test Suite");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // NOTE: Set these manually after your first run if your routes don't return IDs yet:
  // createdUserId  = "paste-uuid-from-snowflake-here";
  // createdUser2Id = "paste-uuid-from-snowflake-here";
  // createdPostId  = 1;

  console.log("── Health ──");
  await testHealth();

  console.log("\n── Users ──");
  await testCreateUser();
  await testCreateUser2();
  await testGetUsers();
  await testGetUserById();
  await testUpdateUser();
  await testUpdateUserStatus();

  console.log("\n── Posts ──");
  await testCreatePost();
  await testGetPosts();
  await testGetPostsSortedByAge();
  await testDeletePost();

  console.log("\n── Messages ──");
  await testSendMessage();
  await testGetChatHistory();
  await testGetConversations();
  await testArchiveChat();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Test run complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("ℹ️  To test user-specific routes (Get/Update/Status, Posts, Messages),");
  console.log("   set createdUserId and createdUser2Id at the top of the runner");
  console.log("   using IDs from: SELECT ID, USERNAME FROM USERS ORDER BY CREATED_AT DESC LIMIT 5;\n");
}

run();