import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'duolingo-somali-dev-secret-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create JWT token compatible with next-auth
    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name, role: user.role, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '30d' },
    );

    // Set the session cookie using next-auth's cookie name
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
    });

    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: false,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
