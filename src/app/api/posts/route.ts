import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('API: Starting posts fetch...');
    
    // URL에서 board 파라미터 추출
    const { searchParams } = new URL(request.url);
    const boardFilter = searchParams.get('board');
    
    // WHERE 조건 설정
    let whereCondition: any = {
      deletedAt: null // 삭제되지 않은 게시글만 조회
    };
    
    // board 파라미터가 있으면 필터링 추가
    if (boardFilter) {
      whereCondition.board = {
        key: boardFilter.toUpperCase()
      };
    }
    
    const posts = await prisma.post.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        content: true,
        isAnonymous: true,
        isPinned: true,
        views: true,
        likesCount: true,
        dislikesCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true
          }
        },
        board: {
          select: {
            key: true,
            name: true
          }
        },
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('API: Found posts:', posts.length);

    const postsWithCounts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.name,
      authorId: post.author.id,
      board: post.board.key.toLowerCase(),
      boardName: post.board.name,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      views: post.views,
      likes: post.likesCount,
      dislikes: post.dislikesCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      comments: post.comments.length
    }));

    const response = NextResponse.json({ posts: postsWithCounts });
    
    // UTF-8 인코딩 헤더 설정
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    // 캐시 완전 비활성화 헤더 설정 (Vercel CDN 무력화)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    
    return response;
  } catch (error: any) {
    console.error('API Error details:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'No code',
      meta: error?.meta || 'No meta',
      name: error?.name || 'Unknown'
    });
    return NextResponse.json({ 
      error: 'Failed to fetch posts',
      details: error?.message || 'Unknown error',
      code: error?.code || 'No code'
    }, { status: 500 });
  }
}