import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlLower = process.env.database_url;
    
    return NextResponse.json({ 
      status: 'ok',
      DATABASE_URL: !!dbUrl,
      database_url: !!dbUrlLower,
      dbUrlPrefix: (dbUrl || dbUrlLower) ? (dbUrl || dbUrlLower)!.substring(0, 20) + '...' : 'not set',
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Test API failed' }, { status: 500 });
  }
}