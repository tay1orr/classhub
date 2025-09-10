import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Find all posts with inconsistent like counts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        likesCount: true,
        dislikesCount: true,
        likes: {
          select: {
            isLike: true
          }
        }
      }
    });

    const fixes = [];
    
    for (const post of posts) {
      // Calculate actual counts from PostLike records
      const actualLikes = post.likes.filter(like => like.isLike === true).length;
      const actualDislikes = post.likes.filter(like => like.isLike === false).length;
      
      // Check if counts are inconsistent
      if (post.likesCount !== actualLikes || post.dislikesCount !== actualDislikes) {
        fixes.push({
          postId: post.id,
          title: post.title,
          before: {
            likes: post.likesCount,
            dislikes: post.dislikesCount
          },
          after: {
            likes: actualLikes,
            dislikes: actualDislikes
          }
        });
        
        // Fix the counts
        await prisma.post.update({
          where: { id: post.id },
          data: {
            likesCount: actualLikes,
            dislikesCount: actualDislikes
          }
        });
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixes.length} posts with inconsistent like counts`,
      fixes
    });

  } catch (error: any) {
    console.error('Fix likes error:', error);
    return NextResponse.json(
      { error: 'Failed to fix like counts', details: error.message },
      { status: 500 }
    );
  }
}