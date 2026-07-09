const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const apiPath = path.join(__dirname, "../src/app/api");
const backupPath = path.join(__dirname, "../api-backup");

console.log("📦 Starting native mobile build pipeline...");

let buildSuccess = false;

try {
  // 0. Delete stale Next.js cache directory to clear route validator type references
  const nextCachePath = path.join(__dirname, "../.next");
  if (fs.existsSync(nextCachePath)) {
    console.log("🧹 Clearing Next.js build cache...");
    try {
      fs.rmSync(nextCachePath, { recursive: true, force: true });
    } catch (rmErr) {
      console.warn("⚠️ Standard folder cleanup locked, trying native OS force cleanup...");
      try {
        // Windows fallback force rmdir
        execSync(`rmdir /s /q "${nextCachePath}"`, { stdio: "ignore" });
      } catch (winErr) {
        // Unix/macOS fallback
        try {
          execSync(`rm -rf "${nextCachePath}"`, { stdio: "ignore" });
        } catch (unixErr) {
          console.warn("⚠️ Cache warning: folder remains locked.", winErr, unixErr);
        }
      }
    }
  }

  // 1. Temporarily backup the API directory to prevent static export errors (using copy-then-delete for Windows locking safety)
  if (fs.existsSync(apiPath)) {
    console.log("🔄 Backing up dynamic API routes...");
    fs.cpSync(apiPath, backupPath, { recursive: true });
    fs.rmSync(apiPath, { recursive: true, force: true });
  }

  // 2. Trigger static export build (Note: Next.js standalone build targets build:web, we execute next build dynamically inside export mode)
  console.log("🚀 Compiling static export...");
  execSync("npm run build:web", {
    env: { ...process.env, MOBILE_BUILD: "true" },
    stdio: "inherit",
  });

  console.log("✅ Static export completed successfully.");
  buildSuccess = true;
} catch (err) {
  console.error("❌ Build failed:", err);
  process.exitCode = 1;
} finally {
  // 3. Always restore API routes back to original path
  if (fs.existsSync(backupPath)) {
    console.log("🔄 Restoring dynamic API routes...");
    try {
      fs.cpSync(backupPath, apiPath, { recursive: true });
      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log("✅ Restored API folder.");
    } catch (restoreErr) {
      console.error("❌ Critical: Failed to restore API routes! Check api-backup folder.", restoreErr);
    }
  }
}

if (buildSuccess) {
  console.log("🎉 Mobile assets exported to /out ready for Capacitor!");
}
