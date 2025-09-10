import { NextResponse } from 'next/server';

export async function GET() {
  // JavaScript 코드를 반환하여 브라우저에서 localStorage 정리
  const clearScript = `
// 모든 댓글 관련 localStorage 데이터 정리
console.log('=== 댓글 캐시 정리 시작 ===');

let clearedCount = 0;
let totalKeys = 0;

// localStorage의 모든 키 확인
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  totalKeys++;
  
  if (key && (key.startsWith('comments_') || key.startsWith('replies_') || key.startsWith('userLikes_'))) {
    console.log('제거 중:', key, '=', localStorage.getItem(key));
    localStorage.removeItem(key);
    clearedCount++;
  }
}

console.log(\`총 \${totalKeys}개 키 중 \${clearedCount}개 댓글/좋아요 캐시 정리 완료\`);
console.log('=== 댓글 캐시 정리 완료 ===');
console.log('페이지를 새로고침하면 정확한 댓글 수가 표시됩니다.');
  `;

  return new Response(clearScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    }
  });
}