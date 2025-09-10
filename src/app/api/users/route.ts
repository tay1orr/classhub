import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('API Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}