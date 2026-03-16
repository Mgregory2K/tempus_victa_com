// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { refreshAccessToken } from "@/lib/auth-utils"

/**
 * TOKEN ROTATION v3.8 - REFRESH TOKEN LOGIC & IDENTITY PERSISTENCE
 * Objective: Ensure Google API access tokens are automatically rotated and identity is preserved.
 */

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/spreadsheets.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in: store the initial tokens and user info
      if (account && user) {
        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
        return {
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
          email: user.email,
          name: user.name,
          picture: user.image,
          isAdmin: adminEmails.includes(user.email?.toLowerCase() || ""),
        }
      }

      // If token is still valid, return it
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Access token has expired, use shared utility to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.isAdmin = !!token.isAdmin;
      session.error = token.error as string;
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
})

export { handler as GET, handler as POST }
