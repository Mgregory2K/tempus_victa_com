// src/lib/auth-utils.ts

export async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token"
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    console.log("[Auth] Google token rotated successfully.");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.error("[Auth] Error refreshing access token:", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}
