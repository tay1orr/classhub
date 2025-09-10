import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('Setting up boards and classroom...');

    // 1. 먼저 classroom 생성 또는 확인
    let classroom = await prisma.classroom.findUnique({
      where: { 
        grade_classNo: { 
          grade: 1,
          classNo: 8
        }
      }
    });

    if (!classroom) {
      classroom = await prisma.classroom.create({
        data: {
          grade: 1,
          classNo: 8,
          name: '1학년 8반'
        }
      });
      console.log('Created classroom:', classroom);
    }

    // 2. 필요한 보드들 생성
    const requiredBoards = [
      { key: 'FREE', name: '자유게시판' },
      { key: 'ASSIGNMENT', name: '수행평가' },
      { key: 'NOTICE', name: '공지사항' }
    ];

    const createdBoards = [];
    for (const boardData of requiredBoards) {
      let board = await prisma.board.findUnique({
        where: { key: boardData.key }
      });

      if (!board) {
        board = await prisma.board.create({
          data: boardData
        });
        console.log('Created board:', board);
        createdBoards.push(board);
      } else {
        console.log('Board already exists:', board);
      }
    }

    return NextResponse.json({ 
      success: true,
      classroom,
      createdBoards,
      message: 'Setup completed successfully'
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}