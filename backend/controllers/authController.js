const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use Pool for reliable concurrent Web + Mobile connection handling
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

dbPool.on('error', (err) => console.error('[pg Connection Pool Error]', err));

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

// ==========================================
// LOGIN CONTROLLER
// ==========================================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    // Normalize email
    email = email.toLowerCase().trim();

    // Query PostgreSQL case‑insensitively
    const result = await dbPool.query('SELECT * FROM "User" WHERE LOWER(email) = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Standardised JSON payload
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Express Login Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

// ==========================================
// REGISTER CONTROLLER
// ==========================================
exports.register = async (req, res) => {
  try {
    let {
      name,
      email,
      phone,
      password,
      captchaId,
      captchaAnswer,
      clientFallbackAnswer,
    } = req.body;
    const clientPlatform = (req.headers['x-client-platform'] || "").toLowerCase();

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    // Normalise email
    email = email.toLowerCase().trim();

    // Allow registration when mobile header present or when using the local fallback captcha
    const isMobile = clientPlatform === "android" || clientPlatform === "ios";
    const isLocalFallback = captchaId === "LOCAL_FALLBACK" || captchaId === "client-fallback";

    if (!isMobile && !isLocalFallback) {
      // Standard web captcha validation
      if (captchaId !== "success-signature") {
        return res.status(400).json({ success: false, error: "Incorrect Captcha solution. Please try again." });
      }
    } else if (isLocalFallback) {
      // Math‑captcha fallback verification
      const cleanUserAns = String(captchaAnswer || '').trim();
      const cleanFallbackAns = String(clientFallbackAnswer || '').trim();

      if (cleanUserAns !== cleanFallbackAns || !cleanUserAns) {
        return res.status(400).json({ success: false, error: "Incorrect Captcha solution. Please try again." });
      }
    }

    // Check for existing user (case‑insensitive)
    const existing = await dbPool.query('SELECT id FROM "User" WHERE LOWER(email) = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertResult = await dbPool.query(
      `INSERT INTO "User"
        (id, name, email, phone, "passwordHash", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        `user_${Date.now()}`,
        name,
        email,
        phone,
        hashedPassword,
        'STUDENT',
      ]
    );
    const user = insertResult.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Standardised JSON payload
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Express Register Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};
