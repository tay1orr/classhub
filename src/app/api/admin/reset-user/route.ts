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

    // Delete existing user
    await prisma.user.delete({
      where: { email: 'taylorr@gclass.ice.go.kr' }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully. You can now register again with admin privileges.'
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}