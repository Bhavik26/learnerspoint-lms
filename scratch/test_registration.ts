async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/captcha");
    console.log("Captcha status:", res.status);
    const data = await res.json();
    console.log("Captcha response:", data);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
test();
