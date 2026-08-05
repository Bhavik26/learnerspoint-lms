export {};

async function testLocaltunnel() {
  try {
    const url = "https://puny-parts-tell.loca.lt/api/auth/captcha";
    console.log(`[Localtunnel Test] Requesting ${url}...`);

    const res = await fetch(url, {
      headers: {
        "bypass-tunnel-reminder": "true",
        "User-Agent": "LearnersPointMobileApp/1.0"
      }
    });

    console.log("Localtunnel Captcha status:", res.status);
    const data = await res.text();
    console.log("Localtunnel Captcha response:", data.slice(0, 300));
  } catch (err) {
    console.error("Localtunnel test failed:", err);
  }
}

testLocaltunnel();
