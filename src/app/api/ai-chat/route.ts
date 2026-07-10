import { NextResponse } from 'next/server';

function getLocalAIResponse(prompt: string): string {
  const query = prompt.toLowerCase().trim();

  if (query === "hi" || query === "hello" || query === "hey" || query === "greetings") {
    return "Hello! I am your LearnersPoint AI Guide. How can I assist you with your courses, placements, or dashboard navigation today?";
  }
  
  if (query.includes("next.js") || query.includes("nextjs") || query.includes("react") || query.includes("frontend")) {
    return "We offer the premium course **'Enterprise Next.js & React Core Architecture'** taught by Dr. Bhavik Kumar. It includes 3 modules, 4 live classes, and custom WebRTC streaming. Price: ₹4,999.";
  }

  if (query.includes("java") || query.includes("oop") || query.includes("programming")) {
    return "Our **'Core & Advanced Java Programming'** course is excellent for OOP concepts, exception chains, memory management, and multi-threading. Taught by Dr. Bhavik Kumar. Price: ₹6,000.";
  }

  if (query.includes("full stack") || query.includes("mern") || query.includes("php") || query.includes("python")) {
    return "Our high-density **'Full Stack Web Development (PHP / MERN / Python)'** course covers everything from base databases to perimeter layouts. Price: ₹8,500.";
  }

  if (query.includes("ui/ux") || query.includes("design") || query.includes("responsive") || query.includes("tailwind")) {
    return "Explore **'UI/UX & Responsive Web Designing'** to learn fluid grids, aspect-ratio bounds, and cross-device alignments. Price: ₹4,500.";
  }

  if (query.includes("security") || query.includes("cyber") || query.includes("cybersecurity") || query.includes("zero trust")) {
    return "Learn modern network safety with **'Modern Cyber Security & Perimeterless Zero Trust Architecture'**. It covers firewalls, secure CORS alignment, and vulnerability auditing.";
  }

  if (query.includes("ml") || query.includes("machine learning") || query.includes("ai") || query.includes("anomaly")) {
    return "Our **'Advanced Machine Learning & Behavioral Anomaly Detection'** course teaches you explainable AI models, predictive scoring, and rank metrics.";
  }

  if (query.includes("placement") || query.includes("job") || query.includes("package") || query.includes("internship") || query.includes("salary")) {
    return "LearnersPoint has a **98% assessment clearance rate** and an average placement package of **₹6.5 LPA**. We link you directly with top tech companies upon course completion and dashboard certifications.";
  }

  if (query.includes("price") || query.includes("fee") || query.includes("cost") || query.includes("fees") || query.includes("buy")) {
    return "Course pricing:\n- Next.js & React: ₹4,999\n- Java Programming: ₹6,000\n- Full Stack Web: ₹8,500\n- UI/UX Responsive Design: ₹4,500.\n\nYou can add any of these to your cart directly from the syllabus details page!";
  }

  if (query.includes("cart") || query.includes("checkout") || query.includes("add")) {
    return "To purchase a course, click 'Add to Cart' on the homepage or course catalog. Then visit your `/cart` page to finalize secure payment authorization.";
  }

  if (query.includes("live") || query.includes("stream") || query.includes("webrtc") || query.includes("class")) {
    return "All pro tracks include scheduled live classes with screen sharing, dynamic host waiting room queue lists, and real-time interactive chat sidebars.";
  }

  return `Thank you for asking about "${prompt}". LearnersPoint specializes in premium technical training. You can explore our catalog of 10k+ trained learners and placement programs. Let me know if you want information on Java, Next.js, Cybersecurity, or placement metrics!`;
}

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt string is empty" }, { status: 400 });
    }

    const apiKey = process.env.AI_PROVIDER_API_KEY;
    if (!apiKey) {
      // Dynamic local NLP parser response if no API key is specified
      const localReply = getLocalAIResponse(prompt);
      return NextResponse.json({ success: true, text: localReply }, { status: 200 });
    }

    // Context System Instruction to make the AI act strictly as LearnersPoint support core
    const systemContext = `You are the official LearnersPoint AI Training Assistant. Help the student (ID: ${userId || 'Guest'}) with their platform queries, courses like 'Core & Advanced Java Programming', or tech questions politely. Keep responses concise and scannable.`;

    // Actual API invocation payload layout
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemContext}\n\nUser Question: ${prompt}` }] }]
      })
    });

    const data = await response.json();
    const aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting to my cognitive grid right now. Please try again.";

    return NextResponse.json({ success: true, text: aiAnswer }, { status: 200 });

  } catch (error: any) {
    console.error("!!! AI CORE CONNECTION FAULT !!!", error);
    return NextResponse.json({ success: false, error: error.message || "AI internal gateway error" }, { status: 500 });
  }
}
