import { NextResponse } from 'next/server';

export async function GET() {
  // Return JavaScript code to clear localStorage for the specific problematic post
  const postId = 'cmfc04tc30001wihvjvglx5nv'; // 자유게시판 이용 안내
  
  const clearScript = `
    console.log('Clearing localStorage for post: ${postId}');
    console.log('Before:', localStorage.getItem('comments_${postId}'));
    console.log('Before:', localStorage.getItem('replies_${postId}'));
    
    localStorage.removeItem('comments_${postId}');
    localStorage.removeItem('replies_${postId}');
    
    console.log('After:', localStorage.getItem('comments_${postId}'));
    console.log('After:', localStorage.getItem('replies_${postId}'));
    console.log('Cleared localStorage for post ${postId}');
  `;

  return new Response(clearScript, {
    headers: {
      'Content-Type': 'application/javascript'
    }
  });
}