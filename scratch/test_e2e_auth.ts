async function main() {
  const BASE_URL = "http://127.0.0.1:3001";
  console.log("Using Next.js local server at:", BASE_URL);

  // 1. Get Captcha
  console.log("\n[Step 1] Fetching Captcha...");
  const captchaRes = await fetch(`${BASE_URL}/api/auth/captcha`);
  if (!captchaRes.ok) {
    throw new Error(`Failed to fetch captcha: ${captchaRes.statusText}`);
  }
  const captchaData = await captchaRes.json();
  console.log("Captcha received:", captchaData);

  // Parse and solve the question
  const expr = captchaData.question.replace("Solve: ", "").trim();
  const answer = eval(expr).toString();
  console.log(`Solved Captcha: ${expr} = ${answer}`);

  // Generate random email to avoid duplicate errors
  const rand = Math.floor(Math.random() * 100000);
  const email = `test_student_${rand}@learnerspoint.com`;
  const phone = `9${String(rand).padStart(9, "0")}`.substring(0, 10);
  const password = "password123";

  // 2. Register User
  console.log("\n[Step 2] Registering User...");
  const registerPayload = {
    name: "Test E2E Student",
    email,
    phone,
    password,
    captchaId: captchaData.captchaId,
    captchaAnswer: answer,
    captchaSignature: captchaData.signature
  };
  console.log("Registration payload:", registerPayload);

  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(registerPayload)
  });

  const registerData = await registerRes.json();
  console.log("Registration Response (Status:", registerRes.status, "):", registerData);

  if (!registerData.success) {
    throw new Error(`Registration failed: ${registerData.error || "unknown error"}`);
  }

  // 3. Login User
  console.log("\n[Step 3] Logging in with new credentials...");
  const loginPayload = {
    email,
    password
  };
  console.log("Login payload:", loginPayload);

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginPayload)
  });

  const loginData = await loginRes.json();
  console.log("Login Response (Status:", loginRes.status, "):", loginData);

  if (loginData.success && loginData.token) {
    console.log("\n✅ E2E Auth Flow completed successfully! Registration and Login are 100% correct.");
  } else {
    console.log("\n❌ Login verification failed!");
  }
}

main().catch(err => {
  console.error("\n❌ E2E Diagnostics failed with error:", err);
});
