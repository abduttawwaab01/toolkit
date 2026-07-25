import { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { verifyPassword } from "./auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({ clientId: process.env.AUTH_GITHUB_ID || "", clientSecret: process.env.AUTH_GITHUB_SECRET || "" }),
    Google({ clientId: process.env.AUTH_GOOGLE_ID || "", clientSecret: process.env.AUTH_GOOGLE_SECRET || "" }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({ where: { email: credentials.email as string } });
        if (!user || !user.passwordHash) return null;
        const valid = await verifyPassword(credentials.password as string, user.passwordHash);
        if (!valid || user.isSuspended) return null;
        return { id: user.id, email: user.email!, name: user.name, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      const email = user.email;
      if (!email) return false;

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.isSuspended) return false;
        const updated = await db.user.update({
          where: { email },
          data: {
            name: user.name || existing.name,
            image: user.image || existing.image,
            lastActiveAt: new Date(),
          },
        });
        user.id = updated.id;
        (user as any).role = updated.role;
        return true;
      }

      const created = await db.user.create({
        data: {
          email,
          name: user.name,
          image: user.image,
          role: "USER",
          creditsBalance: 5,
        },
      });
      user.id = created.id;
      (user as any).role = created.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user) { (token as any).role = (user as any).role; token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).role = (token as any).role; (session.user as any).id = token.id as string; }
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
  session: { strategy: "jwt" },
};
