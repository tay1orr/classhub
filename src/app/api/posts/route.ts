import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel serverless 최적화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log('🚀 게시글 목록 API 호출:', { requestId, timestamp: new Date().toISOString() });
    
    // URL에서 파라미터 추출
    const { searchParams } = new URL(request.url);
    const boardFilter = searchParams.get('board');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10'); // 10개씩으로 더 줄임 - 더 빠른 로딩
    const skip = (page - 1) * limit;
    
    console.log('📋 요청 파라미터:', { boardFilter, page, limit, skip });
    
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

    // 데이터베이스 연결 확인 제거 - 불필요한 쿼리
    // await prisma.$queryRaw`SELECT 1`;
    // console.log('✅ 데이터베이스 연결 확인됨');
    
    // 병렬로 게시글과 총 개수 조회 (성능 향상)
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
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
          // updatedAt 제거 - 불필요한 데이터 전송 줄이기
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
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' }, // 공지사항 우선
          { createdAt: 'desc' } // 최신순
        ],
        take: limit,
        skip: skip
      }),
      prisma.post.count({
        where: whereCondition
      })
    ]);

    const processingTime = Date.now() - startTime;
    console.log('✅ 게시글 조회 완료:', { 
      postsCount: posts.length, 
      totalCount, 
      processingTime: processingTime + 'ms' 
    });

    const postsWithCounts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content, // 더 짧게 자르기
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
      comments: post._count.comments
    }));

    const response = NextResponse.json({ 
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: skip + posts.length < totalCount,
        hasPrev: page > 1
      },
      performance: {
        requestId,
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
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