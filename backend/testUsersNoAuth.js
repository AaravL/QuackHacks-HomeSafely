const axios = require("axios");

const BASE_URL = "http://localhost:3001";

// State shared across tests
let user1 = null;
let user2 = null;
let postId = null;

function pass(label, data) {
  console.log(`✅ ${label}:`, JSON.stringify(data).slice(0, 120));
}

function fail(label, err) {
  console.error(`❌ ${label}:`, err.response?.data || err.message);
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

async function testHealth() {
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    pass("Health Check", res.data);
    return true;
  } catch (e) {
    fail("Health Check", e);
    return false;
  }
}

// ─── USERS ────────────────────────────────────────────────────────────────────

async function testCreateUsers() {
  try {
    await axios.post(`${BASE_URL}/api/users`, {
      account: "duck123",
      username: "Mihir",
      age: 19,
      gender: "male",
      university: "Stevens Institute of Technology",
    });
    pass("Create User 1", { username: "Mihir" });
  } catch (e) {
    fail("Create User 1", e);
  }

  try {
    await axios.post(`${BASE_URL}/api/users`, {
      account: "jane456",
      username: "Jane",
      age: 22,
      gender: "female",
      university: "Stevens Institute of Technology",
    });
    pass("Create User 2", { username: "Jane" });
  } catch (e) {
    fail("Create User 2", e);
  }
}

async function testLookupUsers() {
  try {
    const res = await axios.get(`${BASE_URL}/api/users/lookup`, {
      params: { limit: 5 },
    });

    // Grab the two most recently created users
    user1 = res.data.find((u) => u.USERNAME === "Mihir") || res.data[0];
    user2 = res.data.find((u) => u.USERNAME === "Jane") || res.data[1];

    pass("Lookup Users", res.data.map((u) => ({ id: u.ID, username: u.USERNAME })));

    if (!user1 || !user2) {
      console.warn("⚠️  Could not find both users in lookup — some tests may be skipped");
    } else {
      console.log(`   → User1: ${user1.USERNAME} (${user1.ID})`);
      console.log(`   → User2: ${user2.USERNAME} (${user2.ID})`);
    }
  } catch (e) {
    fail("Lookup Users", e);
  }
}

async function testGetUserById() {
  if (!user1) return console.log("⚠️  Skipping Get User By ID");
  try {
    const res = await axios.get(`${BASE_URL}/api/users/${user1.ID}`);
    pass("Get User By ID", res.data);
  } catch (e) {
    fail("Get User By ID", e);
  }
}

async function testUpdateUser() {
  if (!user1) return console.log("⚠️  Skipping Update User");
  try {
    const res = await axios.put(`${BASE_URL}/api/users/${user1.ID}`, {
      username: "MihirUpdated",
      age: 20,
    });
    pass("Update User", res.data);
  } catch (e) {
    fail("Update User", e);
  }
}

async function testUpdateUserStatus() {
  if (!user1) return console.log("⚠️  Skipping Update User Status");
  try {
    const res = await axios.put(`${BASE_URL}/api/users/${user1.ID}/status`, {
      isOnline: true,
    });
    pass("Update User Status (online)", res.data);
  } catch (e) {
    fail("Update User Status", e);
  }
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

async function testCreatePost() {
  if (!user1) return console.log("⚠️  Skipping Create Post");
  try {
    const res = await axios.post(`${BASE_URL}/api/posts`, {
      userId: user1.ID,
      startLat: 40.7448,
      startLng: -74.0248,
      endLat: 40.7580,
      endLng: -73.9855,
      destination: "Hoboken Terminal",
      mode: "walking",
    });
    pass("Create Post", res.data);

    // Auto-fetch the post ID from the get posts response
    const posts = await axios.get(`${BASE_URL}/api/posts`, {
      params: { sortBy: "earliest", userLat: 40.7448, userLng: -74.0248 },
    });
    const created = posts.data.find((p) => p.USER_ID === user1.ID && p.IS_ACTIVE);
    if (created) {
      postId = created.ID;
      console.log(`   → Post ID: ${postId}`);
    }
  } catch (e) {
    fail("Create Post", e);
  }
}

async function testGetPosts() {
  try {
    const res = await axios.get(`${BASE_URL}/api/posts`, {
      params: { sortBy: "earliest", userLat: 40.7448, userLng: -74.0248 },
    });
    pass(`Get Posts (earliest) — ${res.data.length} result(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Posts (earliest)", e);
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

async function testGetPostsSortedByGender() {
  try {
    const res = await axios.get(`${BASE_URL}/api/posts`, {
      params: { sortBy: "gender", userLat: 40.7448, userLng: -74.0248 },
    });
    pass(`Get Posts (gender sort) — ${res.data.length} result(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Posts (gender sort)", e);
  }
}

async function testDeletePost() {
  if (!postId) return console.log("⚠️  Skipping Delete Post — no postId found");
  try {
    const res = await axios.delete(`${BASE_URL}/api/posts/${postId}`);
    pass("Delete Post", res.data);
  } catch (e) {
    fail("Delete Post", e);
  }
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

async function testSendMessage() {
  if (!user1 || !user2) return console.log("⚠️  Skipping Send Message — need both users");
  try {
    const res = await axios.post(`${BASE_URL}/api/messages`, {
      senderId: user1.ID,
      recipientId: user2.ID,
      content: "Hey, want to share a ride to Hoboken Terminal?",
    });
    pass("Send Message (user1 → user2)", res.data);
  } catch (e) {
    fail("Send Message", e);
  }
}

async function testSendReply() {
  if (!user1 || !user2) return console.log("⚠️  Skipping Send Reply");
  try {
    const res = await axios.post(`${BASE_URL}/api/messages`, {
      senderId: user2.ID,
      recipientId: user1.ID,
      content: "Sure! Meet at the main entrance?",
    });
    pass("Send Reply (user2 → user1)", res.data);
  } catch (e) {
    fail("Send Reply", e);
  }
}

async function testGetChatHistory() {
  if (!user1 || !user2) return console.log("⚠️  Skipping Get Chat History");
  try {
    const res = await axios.get(
      `${BASE_URL}/api/messages/chat/${user1.ID}/${user2.ID}`
    );
    pass(`Get Chat History — ${res.data.length} message(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Chat History", e);
  }
}

async function testGetConversations() {
  if (!user1) return console.log("⚠️  Skipping Get Conversations");
  try {
    const res = await axios.get(`${BASE_URL}/api/messages/conversations/${user1.ID}`);
    pass(`Get Conversations — ${res.data.length} conversation(s)`, res.data[0] ?? "none");
  } catch (e) {
    fail("Get Conversations", e);
  }
}

async function testArchiveChat() {
  if (!user1 || !user2) return console.log("⚠️  Skipping Archive Chat");
  try {
    const res = await axios.post(
      `${BASE_URL}/api/messages/archive/${user1.ID}/${user2.ID}`
    );
    pass("Archive Chat", res.data);
  } catch (e) {
    fail("Archive Chat", e);
  }
}

// ─── RUNNER ───────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   HomeSafely — No-Auth Test Suite");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("── Health ──");
  const healthy = await testHealth();
  if (!healthy) {
    console.error("\n🛑 Server is not reachable. Aborting tests.");
    return;
  }

  console.log("\n── Users ──");
  await testCreateUsers();
  await testLookupUsers();         // auto-populates user1 + user2
  await testGetUserById();
  await testUpdateUser();
  await testUpdateUserStatus();

  console.log("\n── Posts ──");
  await testCreatePost();          // auto-populates postId via get posts
  await testGetPosts();
  await testGetPostsSortedByAge();
  await testGetPostsSortedByGender();
  await testDeletePost();

  console.log("\n── Messages ──");
  await testSendMessage();
  await testSendReply();
  await testGetChatHistory();
  await testGetConversations();
  await testArchiveChat();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   Test run complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

run();