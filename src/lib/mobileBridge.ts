import { App, URLOpenListenerEvent } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";

/**
 * Checks if the application is running inside a Capacitor native mobile wrapper
 */
export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  return (window as any).Capacitor !== undefined;
}

/**
 * Launches native financial applications (PhonePe, GPay, Paytm) using OS-level UPI Intent URIs
 * Bypasses standard Webview HTTP/HTTPS sandboxing.
 */
export async function launchUPIIntent(upiUrl: string): Promise<boolean> {
  if (!isCapacitor()) {
    // Fallback for desktop browsers: attempt redirection or show QR scanner fallback
    window.location.href = upiUrl;
    return true;
  }

  try {
    // Direct Capacitor native container to hand the URI scheme over to the mobile OS launcher
    const { value } = await AppLauncher.canOpenUrl({ url: upiUrl });
    if (value) {
      await AppLauncher.openUrl({ url: upiUrl });
      return true;
    } else {
      // If the specific app isn't matched, open via generic system browser mapping
      window.open(upiUrl, "_system");
      return true;
    }
  } catch (err) {
    console.error("Native UPI Intent Launch failed:", err);
    // Hard fallback: trigger window.open
    window.open(upiUrl, "_system");
    return true;
  }
}

/**
 * Set up custom deep-linking listeners (e.g. learnerspoint://oauth?token=...)
 * Parse redirect parameters and navigate back to the active page without losing state.
 */
export function setupDeepLinks(router: any, onTokenReceived: (token: string) => void) {
  if (!isCapacitor()) return;

  App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    try {
      const url = new URL(event.url);
      
      // Handle OAuth callback deep link: learnerspoint://oauth?token=xyz
      if (url.host === "oauth") {
        const token = url.searchParams.get("token");
        if (token) {
          onTokenReceived(token);
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Failed to parse native deep link callback URL:", err);
    }
  });
}
