import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    
    return NextResponse.json({ 
      status: 'ok',
      hasDbUrl: !!dbUrl,
      dbUrlPrefix: dbUrl ? dbUrl.substring(0, 20) + '...' : 'not set',
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Test API failed' }, { status: 500 });
  }
}