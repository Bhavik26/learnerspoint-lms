import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export async function generateCaptchaSignature(captchaId: string, answer: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${captchaId}:${answer.trim()}:${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 15) + 1;
  const operators = ["+", "-", "*"];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let answer = 0;
  switch (operator) {
    case "+":
      answer = num1 + num2;
      break;
    case "-":
      answer = num1 - num2;
      break;
    case "*":
      answer = num1 * num2;
      break;
  }
  
  const captchaId = crypto.randomUUID();
  const question = `Solve: ${num1} ${operator} ${num2}`;
  
  // Generate lightweight, fast visual SVG captcha image (dark card theme)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 160 50">
    <rect width="100%" height="100%" fill="#020617"/>
    <!-- Noise lines to deter OCR scraping bots -->
    <line x1="10" y1="12" x2="150" y2="38" stroke="#1e293b" stroke-width="2"/>
    <line x1="20" y1="38" x2="140" y2="12" stroke="#334155" stroke-width="1.5"/>
    <line x1="5" y1="25" x2="155" y2="25" stroke="#0f172a" stroke-width="2"/>
    <!-- Question label rendering -->
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="#3DBFF2" letter-spacing="1">
      ${question}
    </text>
  </svg>`;
  
  const base64Svg = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const signature = await generateCaptchaSignature(captchaId, answer.toString(), JWT_SECRET);
  
  return NextResponse.json({
    captchaId,
    question,
    image: base64Svg,
    signature
  });
}
