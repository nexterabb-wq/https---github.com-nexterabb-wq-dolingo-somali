import NextAuth, { type NextAuthOptions, getServerSession as getNextAuthSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { DefaultSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);

/**
 * Lightweight session extraction that reads the next-auth.session-token cookie
 * and decodes it using next-auth/jwt's decode() — compatible with the token
 * produced by our /api/auth/login route.
 *
 * This replaces getServerSession() which has internal incompatibilities
 * with tokens produced by next-auth/jwt's encode() in some NextAuth v4.x versions.
 */
export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get('next-auth.session-token')?.value;
  if (!token) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    const decoded = await decode({ token, secret });
    if (!decoded?.sub) return null;

    return {
      user: {
        id: decoded.sub as string,
        email: (decoded.email as string) || '',
        name: (decoded.name as string) || null,
        image: (decoded.image as string) || null,
        role: (decoded.role as string) || 'learner',
      },
    };
  } catch {
    return null;
  }
}
