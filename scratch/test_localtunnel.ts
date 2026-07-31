async function test() {
  try {
    const res = await fetch("https://puny-parts-tell.loca.lt/api/auth/captcha");
    console.log("Localtunnel Captcha status:", res.status);
    const data = await res.text();
    console.log("Localtunnel Captcha response:", data.slice(0, 300));
  } catch (err) {
    console.error("Localtunnel test failed:", err);
  }
}
test();
