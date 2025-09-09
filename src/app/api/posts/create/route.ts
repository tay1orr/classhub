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
    const body = await request.text();
    const { title, content, authorId, boardKey, isAnonymous, isPinned, category } = JSON.parse(body);

    console.log('Creating post:', { title, content, authorId, boardKey, isAnonymous, isPinned, category });

    // Find board ID by key
    const board = await prisma.board.findUnique({
      where: { key: boardKey.toUpperCase() }
    });

    if (!board) {
      return NextResponse.json(
        { error: `Board ${boardKey} not found` },
        { status: 404 }
      );
    }

    // Find classroom (assuming 1-8 for now)
    const classroom = await prisma.classroom.findUnique({
      where: { 
        grade_classNo: { // Composite unique key
          grade: 1,
          classNo: 8
        }
      }
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom 1-8 not found' },
        { status: 404 }
      );
    }

    // Create the post
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
        boardId: board.id,
        classroomId: classroom.id,
        isAnonymous: isAnonymous || false,
        isPinned: isPinned || false,
        views: 0
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        },
        board: true,
        comments: {
          select: {
            id: true
          }
        }
      }
    });

    console.log('Post created successfully:', newPost.id);

    // Return formatted post data
    const formattedPost = {
      id: newPost.id,
      title: newPost.title,
      content: newPost.content,
      author: newPost.author.name,
      authorId: newPost.author.id,
      board: newPost.board.key.toLowerCase(),
      boardName: newPost.board.name,
      isAnonymous: newPost.isAnonymous,
      isPinned: newPost.isPinned,
      views: newPost.views,
      createdAt: newPost.createdAt.toISOString(),
      updatedAt: newPost.updatedAt.toISOString(),
      comments: newPost.comments.length,
      category: category || null
    };

    return NextResponse.json({
      success: true,
      post: formattedPost
    });

  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}