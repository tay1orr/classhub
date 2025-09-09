import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    // 깨진 한글이 포함된 게시글들을 찾아서 삭제
    const brokenPosts = await prisma.post.findMany({
      where: {
        OR: [
          {
            title: {
              contains: '�'
            }
          },
          {
            content: {
              contains: '�'
            }
          }
        ]
      }
    });

    console.log('Found broken posts:', brokenPosts.length);

    if (brokenPosts.length > 0) {
      const deletedPosts = await prisma.post.deleteMany({
        where: {
          OR: [
            {
              title: {
                contains: '�'
              }
            },
            {
              content: {
                contains: '�'
              }
            }
          ]
        }
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedPosts.count} broken posts`,
        deletedPosts: brokenPosts.map(p => ({
          id: p.id,
          title: p.title,
          content: p.content.substring(0, 100)
        }))
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No broken posts found'
      });
    }

  } catch (error: any) {
    console.error('Clean broken posts error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}