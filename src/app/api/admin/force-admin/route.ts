import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const { email } = await request.json();

    if (email !== 'taylorr@gclass.ice.go.kr') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Force update user role to ADMIN
    const updatedUser = await prisma.user.updateMany({
      where: { email: 'taylorr@gclass.ice.go.kr' },
      data: { role: 'ADMIN' }
    });

    console.log('Force admin update result:', updatedUser);

    // Verify the update
    const user = await prisma.user.findUnique({
      where: { email: 'taylorr@gclass.ice.go.kr' },
      select: { id: true, name: true, email: true, role: true }
    });

    return NextResponse.json({
      success: true,
      message: 'User forced to admin role',
      updatedCount: updatedUser.count,
      user: user
    });

  } catch (error: any) {
    console.error('Force admin error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}