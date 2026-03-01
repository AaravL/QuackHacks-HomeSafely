const axios = require("axios");
const readline = require("readline");

const BASE_URL = "http://localhost:3001";

let token = null;
let currentUser = null;
let targetUser = null;

function pass(label, data) {
  console.log(`✅ ${label}:`, JSON.stringify(data).slice(0, 150));
}

function fail(label, err) {
  console.error(`❌ ${label}:`, err.response?.data || err.message);
}

function authHeaders() {
  return { headers: { Authorization: `Bearer ${token}` } };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function login() {
  console.log("\n── Login ──");
  const email = await prompt("Your email: ");
  const password = await prompt("Your password: ");

  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    token = res.data.token;
    currentUser = res.data.user;
    pass("Logged in", { id: currentUser.id, email: currentUser.email });
    return true;
  } catch (e) {
    fail("Login", e);
    return false;
  }
}

// ── Pick recipient ────────────────────────────────────────────────────────────

async function pickRecipient() {
  console.log("\n── Choose recipient ──");

  try {
    const res = await axios.get(`${BASE_URL}/api/users/lookup`, {
      params: { limit: 10 },
    });

    const others = res.data.filter((u) => u.ID !== currentUser.id);
    if (!others.length) {
      console.log("❌ No other users found. Create another user first.");
      return false;
    }

    console.log("\nAvailable users:");
    others.forEach((u, i) => {
      console.log(`  [${i + 1}] ${u.USERNAME} (${u.ID})`);
    });

    const choice = await prompt("\nPick a user number: ");
    const idx = parseInt(choice) - 1;

    if (idx < 0 || idx >= others.length) {
      console.log("❌ Invalid choice.");
      return false;
    }

    targetUser = others[idx];
    console.log(`\n→ Messaging: ${targetUser.USERNAME} (${targetUser.ID})`);
    return true;
  } catch (e) {
    fail("Lookup users", e);
    return false;
  }
}

// ── Show chat history ─────────────────────────────────────────────────────────

async function showHistory() {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/messages/chat/${currentUser.id}/${targetUser.ID}`,
      authHeaders()
    );

    if (!res.data.length) {
      console.log("\n   (no messages yet)\n");
      return;
    }

    console.log("\n── Chat History ──────────────────────────────");
    for (const m of res.data) {
      const sender = m.SENDER_ID === currentUser.id
        ? `You (${currentUser.email})`
        : targetUser.USERNAME;
      const time = new Date(m.CREATED_AT).toLocaleTimeString();
      console.log(`  [${time}] ${sender}: ${m.CONTENT}`);
    }
    console.log("──────────────────────────────────────────────\n");
  } catch (e) {
    fail("Fetch history", e);
  }
}

// ── Send a message ────────────────────────────────────────────────────────────

async function sendMessage(content) {
  try {
    await axios.post(`${BASE_URL}/api/messages`, {
      senderId: currentUser.id,
      recipientId: targetUser.ID,
      content,
    }, authHeaders());
    console.log(`  → Sent: "${content}"`);
  } catch (e) {
    fail("Send message", e);
  }
}

// ── Poll for new messages ─────────────────────────────────────────────────────

let lastMessageCount = 0;

async function pollForNewMessages() {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/messages/chat/${currentUser.id}/${targetUser.ID}`,
      authHeaders()
    );

    const incoming = res.data.filter(
      (m) => m.SENDER_ID === targetUser.ID
    );

    if (incoming.length > lastMessageCount) {
      const newMsgs = incoming.slice(lastMessageCount);
      for (const m of newMsgs) {
        const time = new Date(m.CREATED_AT).toLocaleTimeString();
        console.log(`\n  📩 [${time}] ${targetUser.USERNAME}: ${m.CONTENT}`);
        console.log("  Type a message (or 'quit' to exit): ");
      }
      lastMessageCount = incoming.length;
    }
  } catch {
    // silent fail on poll
  }
}

// ── Interactive chat loop ─────────────────────────────────────────────────────

async function chatLoop() {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Chat with ${targetUser.USERNAME}`);
  console.log(`   Type a message and press Enter to send.`);
  console.log(`   Type 'history' to reload chat.`);
  console.log(`   Type 'quit' to exit.`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await showHistory();

  // Poll for incoming messages every 2 seconds
  const pollInterval = setInterval(pollForNewMessages, 2000);

  while (true) {
    const input = await prompt("You: ");

    if (input.toLowerCase() === "quit") {
      clearInterval(pollInterval);
      console.log("\nGoodbye!");
      rl.close();
      break;
    }

    if (input.toLowerCase() === "history") {
      await showHistory();
      continue;
    }

    if (!input.trim()) continue;

    await sendMessage(input.trim());
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   HomeSafely — Terminal Chat");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const loggedIn = await login();
  if (!loggedIn) { rl.close(); return; }

  const picked = await pickRecipient();
  if (!picked) { rl.close(); return; }

  await chatLoop();
}

run();