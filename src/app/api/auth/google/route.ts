import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = new URL(request.url).origin;

  // Check if we are in mockup / simulated mode
  if (
    !clientId ||
    clientId === "your-google-client-id" ||
    !clientSecret ||
    clientSecret === "your-google-client-secret"
  ) {
    const mockUrl = new URL("/login/google-mock", request.url);
    mockUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(mockUrl);
  }

  // Real Google OAuth Redirect
  const redirectUri = `${origin}/api/auth/google/callback`;
  const scope = "openid email profile";
  const state = callbackUrl;

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(googleAuthUrl);
}
