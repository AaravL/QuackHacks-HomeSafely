const axios = require("axios");

const BASE_URL = "http://localhost:3001";

async function runTests() {
  try {
    console.log("🔹 Registering test user...");

    await axios.post(`${BASE_URL}/api/auth/register`, {
      email: "testrunner@stevens.edu",
      password: "Test123!",
      name: "Runner",
      age: 21,
      gender: "male",
    });

    console.log("✅ Registration successful (or user already exists)");
  } catch (err) {
    if (err.response && err.response.status === 409) {
      console.log("ℹ️ User already exists, continuing...");
    } else {
      console.error("❌ Registration failed:", err.response?.data || err.message);
      return;
    }
  }

  let token;

  try {
    console.log("🔹 Logging in...");

    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "testrunner@stevens.edu",
      password: "Test123!",
    });

    token = loginRes.data.token;

    console.log("✅ Login successful");
    console.log("🔑 Token:", token);
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    return;
  }

  try {
    console.log("🔹 Testing protected route...");

    const protectedRes = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Protected route works!");
    console.log("User data:", protectedRes.data);
  } catch (err) {
    console.error("❌ Protected route failed:", err.response?.data || err.message);
  }

  console.log("🎉 Test run complete");
}

runTests();
