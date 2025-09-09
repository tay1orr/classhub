import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&pool_timeout=0'
      }
    }
  });

  try {
    const postId = params.id;
    
    // 게시글이 존재하는지 확인
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 게시글과 관련된 likes도 함께 삭제
    await prisma.$transaction([
      prisma.postLike.deleteMany({
        where: { postId }
      }),
      prisma.post.delete({
        where: { id: postId }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Post ${postId} deleted successfully`,
      deletedPost: {
        id: post.id,
        title: post.title
      }
    });

  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}