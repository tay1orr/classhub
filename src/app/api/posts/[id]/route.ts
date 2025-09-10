import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          select: {
            id: true,
            content: true,
            isAnonymous: true,
            likesCount: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
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
        content: comment.content,
        author: comment.author.name,
        authorId: comment.author.id,
        isAnonymous: comment.isAnonymous,
        createdAt: comment.createdAt.toISOString(),
        likes: comment.likesCount || 0
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const { title, content, userId } = await request.json();

    if (!title || !content || !userId) {
      return NextResponse.json(
        { error: 'Title, content, and userId are required' },
        { status: 400 }
      );
    }

    // 게시글이 존재하는지 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 작성자 권한 확인
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the author can edit this post' },
        { status: 403 }
      );
    }

    // 게시글 수정
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Post updated successfully',
      post: updatedPost
    });

  } catch (error: any) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Failed to update post: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // 게시글과 사용자 정보 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 사용자 정보 확인 (관리자 권한 체크)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 권한 확인: 작성자이거나 관리자여야 함
    const isAdmin = user.email === 'admin@classhub.co.kr';
    const isAuthor = post.authorId === userId;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the author or admin can delete this post' },
        { status: 403 }
      );
    }

    // 먼저 관련 댓글들 삭제
    await prisma.comment.deleteMany({
      where: { postId: postId }
    });

    // 게시글 삭제
    await prisma.post.delete({
      where: { id: postId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });

  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post: ' + error.message },
      { status: 500 }
    );
  }
}