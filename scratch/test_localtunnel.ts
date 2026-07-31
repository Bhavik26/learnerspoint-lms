async function main() {
  const url = "https://puny-parts-tell.loca.lt/api/auth/captcha";

  console.log("Testing background URL:", url);
  try {
    const res = await fetch(url, {
      headers: { "bypass-tunnel-reminder": "true" }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text (first 200 chars):", text.substring(0, 200));
  } catch (err: any) {
    console.error("Failed:", err.message);
  }
}

main();
