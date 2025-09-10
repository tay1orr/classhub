import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    // 깨진 인코딩 게시글들 삭제
    const brokenPosts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: '�' } }, // 깨진 문자 포함
          { content: { contains: '�' } }, // 깨진 문자 포함
          { id: { in: ['cmfdgh6ud0006nicucgmubi31', 'cmfdgkcmp0008nicu8sinv2ao'] } } // 특정 ID
        ]
      }
    });

    console.log('Found broken posts:', brokenPosts.length);

    if (brokenPosts.length > 0) {
      // 연관된 댓글들 먼저 삭제
      for (const post of brokenPosts) {
        await prisma.comment.deleteMany({
          where: { postId: post.id }
        });
        
        await prisma.postLike.deleteMany({
          where: { postId: post.id }
        });
      }

      // 게시글 삭제
      const deletedPosts = await prisma.post.deleteMany({
        where: {
          id: { in: brokenPosts.map(p => p.id) }
        }
      });

      return NextResponse.json({
        success: true,
        deletedCount: deletedPosts.count,
        deletedPosts: brokenPosts.map(p => ({ id: p.id, title: p.title }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No broken posts found',
      deletedCount: 0
    });

  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup broken posts',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}