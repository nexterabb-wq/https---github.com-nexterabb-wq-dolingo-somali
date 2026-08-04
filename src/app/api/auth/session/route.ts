import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('next-auth.session-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[GET /api/auth/session] NEXTAUTH_SECRET not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decoded = await decode({ token, secret });

    if (!decoded?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: decoded.sub as string,
        email: (decoded.email as string) || '',
        name: (decoded.name as string) || null,
        image: null,
        role: (decoded.role as string) || 'learner',
      },
    });
  } catch (error) {
    console.error('[GET /api/auth/session] Error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
