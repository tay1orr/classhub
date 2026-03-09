export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {
    const postId = params.id;

    const post = await prisma.post.findFirst({
      where: { 
        id: postId,
        deletedAt: null // 삭제되지 않은 게시글만 조회
      },
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
          where: { deletedAt: null, parentId: null },
          select: {
            id: true,
            content: true,
            isAnonymous: true,
            likesCount: true,
            createdAt: true,
            author: { select: { id: true, name: true } },
            replies: {
              where: { deletedAt: null },
              select: {
                id: true,
                content: true,
                isAnonymous: true,
                likesCount: true,
                createdAt: true,
                author: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.post.update({
      where: { id: postId },
      data: {
        views: { increment: 1 }
      }
    });

    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.name,
      authorId: post.author.id,
      board: post.board.key.toLowerCase(),
      boardName: post.board.name,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      views: post.views + 1, // Include the increment
      likes: post.likesCount,
      dislikes: post.dislikesCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      comments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.isAnonymous ? '익명' : comment.author.name,
        author: comment.isAnonymous ? '익명' : comment.author.name,
        authorId: comment.author.id,
        isAnonymous: comment.isAnonymous,
        createdAt: comment.createdAt.toISOString(),
        likes: comment.likesCount || 0,
        replies: comment.replies.map((r: any) => ({
          id: r.id,
          content: r.content,
          author: r.isAnonymous ? '익명' : r.author.name,
          authorId: r.author.id,
          isAnonymous: r.isAnonymous,
          createdAt: r.createdAt.toISOString(),
          likes: r.likesCount || 0,
          replies: [],
        })),
      }))
    };

    const response = NextResponse.json({ post: formattedPost });
    
    // 캐시 비활성화 헤더 설정
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error: any) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const postId = params.id
    const { title, content } = await request.json()
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    if (post.authorId !== session.id) return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })

    await prisma.post.update({ where: { id: postId }, data: { title: title.trim(), content: content.trim() } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const postId = params.id
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })

    if (post.authorId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.comment.deleteMany({ where: { postId } })
    await prisma.post.delete({ where: { id: postId } })
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post: ' + error.message },
      { status: 500 }
    );
  }
}