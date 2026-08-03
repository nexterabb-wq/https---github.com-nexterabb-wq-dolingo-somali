import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'duolingo-somali-dev-secret-change-in-production';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      name: string | null;
      role: string;
    };

    return NextResponse.json({
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        image: null,
        role: decoded.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
