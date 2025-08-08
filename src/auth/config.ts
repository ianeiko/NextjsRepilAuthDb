import { NextAuthConfig } from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"

export default {
  adapter: DrizzleAdapter(db),
  providers: [{
    id: "replit",
    name: "Replit",
    type: "oidc",
    issuer: "https://replit.com",
    clientId: process.env.REPLIT_CLIENT_ID!,
    clientSecret: process.env.REPLIT_CLIENT_SECRET!,
    wellKnown: "https://replit.com/.well-known/openid-configuration",
    authorization: { params: { scope: "openid email profile" } },
    idToken: true,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
  }],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
} satisfies NextAuthConfig