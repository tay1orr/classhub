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
    console.log('🔄 Deleting welcome post...');

    // Find and delete the welcome post
    const deletedPosts = await prisma.post.deleteMany({
      where: {
        title: {
          contains: '우리반 커뮤니티에 오신 것을 환영합니다'
        }
      }
    });

    console.log(`✅ Deleted ${deletedPosts.count} welcome posts`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedPosts.count} welcome posts`,
      deletedCount: deletedPosts.count
    });

  } catch (error: any) {
    console.error('❌ Delete welcome post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete welcome post: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}