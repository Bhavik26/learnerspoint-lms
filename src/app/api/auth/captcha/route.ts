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
  
  const signature = await generateCaptchaSignature(captchaId, answer.toString(), JWT_SECRET);
  
  return NextResponse.json({
    captchaId,
    question,
    signature
  });
}
