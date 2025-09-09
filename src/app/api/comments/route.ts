import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // 댓글과 대댓글을 모두 가져옴 (parentId가 null인 것이 최상위 댓글)
    const comments = await prisma.comment.findMany({
      where: { 
        postId: postId,
        deletedAt: null
      },
      select: {
        id: true,
        content: true,
        isAnonymous: true,
        parentId: true,
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
    });

    // 댓글을 계층 구조로 변환
    const topLevelComments = comments.filter(comment => !comment.parentId);
    const repliesMap = new Map();

    // 대댓글들을 parentId별로 그룹화
    comments.filter(comment => comment.parentId).forEach(reply => {
      if (!repliesMap.has(reply.parentId)) {
        repliesMap.set(reply.parentId, []);
      }
      repliesMap.get(reply.parentId).push(reply);
    });

    // 최상위 댓글에 대댓글들 추가
    const formattedComments = topLevelComments.map(comment => ({
      ...comment,
      author: comment.author.name,
      authorId: comment.author.id,
      createdAt: comment.createdAt.toISOString(),
      replies: repliesMap.get(comment.id) || []
    }));

    return NextResponse.json({ comments: formattedComments });

  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const { postId, authorId, content, isAnonymous, parentId } = JSON.parse(body);

    if (!postId || !authorId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 댓글 생성
    const newComment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        isAnonymous: isAnonymous || false,
        parentId: parentId || null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 포맷된 댓글 데이터 반환
    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      author: newComment.author.name,
      authorId: newComment.author.id,
      isAnonymous: newComment.isAnonymous,
      parentId: newComment.parentId,
      likesCount: newComment.likesCount,
      createdAt: newComment.createdAt.toISOString(),
      replies: []
    };

    return NextResponse.json({
      success: true,
      comment: formattedComment
    });

  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment: ' + error.message },
      { status: 500 }
    );
  }
}