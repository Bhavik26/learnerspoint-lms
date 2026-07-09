import { cookies } from "next/headers";

/**
 * Safely retrieves the auth token from cookies.
 * Returns null during mobile static build exports to prevent Next.js build errors.
 */
export async function getSafeToken(): Promise<string | null> {
  if (process.env.MOBILE_BUILD === "true") {
    return null;
  }
  try {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value || null;
  } catch (err) {
    return null;
  }
}
