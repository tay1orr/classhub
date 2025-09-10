import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      select: {
        id: true,
        key: true,
        name: true
      },
      orderBy: {
        key: 'asc'
      }
    });

    return NextResponse.json({ boards });
  } catch (error: any) {
    console.error('API Error fetching boards:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch boards',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, name } = await request.json();

    const existingBoard = await prisma.board.findUnique({
      where: { key: key.toUpperCase() }
    });

    if (existingBoard) {
      return NextResponse.json({ 
        message: 'Board already exists',
        board: existingBoard 
      });
    }

    const board = await prisma.board.create({
      data: {
        key: key.toUpperCase(),
        name
      }
    });

    return NextResponse.json({ 
      success: true,
      board 
    });
  } catch (error: any) {
    console.error('API Error creating board:', error);
    return NextResponse.json({ 
      error: 'Failed to create board',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}