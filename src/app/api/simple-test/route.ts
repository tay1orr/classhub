import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    return NextResponse.json({ 
      status: 'success',
      hasDBURL: !!dbUrl,
      nodeEnv: process.env.NODE_ENV,
      message: 'Simple test API working'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Simple test failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}