import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ 
    success: true,
    message: '클라이언트 localStorage 캐시를 정리하세요.',
    instructions: [
      '브라우저 개발자도구(F12) → Console 탭',
      'localStorage.clear() 명령어 실행',
      '페이지 새로고침(F5)'
    ]
  });
}

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'localStorage 정리 API',
    usage: 'POST 요청을 보내주세요'
  });
}