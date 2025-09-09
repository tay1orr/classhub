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
    console.log('🔄 Starting enhanced features migration...');
    
    // Add new columns to posts table
    console.log('➕ Adding new columns to posts table...');
    
    // Check and add likesCount column
    const likesCountCheck = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'likesCount'
    `;
    if (Array.isArray(likesCountCheck) && likesCountCheck.length === 0) {
      await prisma.$queryRaw`ALTER TABLE "posts" ADD COLUMN "likesCount" INTEGER DEFAULT 0`;
    }
    
    // Check and add dislikesCount column
    const dislikesCountCheck = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'dislikesCount'
    `;
    if (Array.isArray(dislikesCountCheck) && dislikesCountCheck.length === 0) {
      await prisma.$queryRaw`ALTER TABLE "posts" ADD COLUMN "dislikesCount" INTEGER DEFAULT 0`;
    }
    
    // Check and add image column
    const imageCheck = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'image'
    `;
    if (Array.isArray(imageCheck) && imageCheck.length === 0) {
      await prisma.$queryRaw`ALTER TABLE "posts" ADD COLUMN "image" TEXT`;
    }

    // Add new columns to comments table
    console.log('➕ Adding new columns to comments table...');
    await prisma.$queryRaw`
      ALTER TABLE "comments" 
      ADD COLUMN IF NOT EXISTS "parentId" TEXT,
      ADD COLUMN IF NOT EXISTS "likesCount" INTEGER DEFAULT 0
    `;

    // Create PostLike table
    console.log('🆕 Creating PostLike table...');
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "post_likes" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "postId" TEXT NOT NULL,
        "isLike" BOOLEAN NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    await prisma.$queryRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "post_likes_userId_postId_key" ON "post_likes"("userId", "postId")
    `;

    // Create CommentLike table
    console.log('🆕 Creating CommentLike table...');
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "comment_likes" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "commentId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    await prisma.$queryRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_userId_commentId_key" ON "comment_likes"("userId", "commentId")
    `;

    // Create CommentReport table
    console.log('🆕 Creating CommentReport table...');
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "comment_reports" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "commentId" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "comment_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "comment_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    await prisma.$queryRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "comment_reports_userId_commentId_key" ON "comment_reports"("userId", "commentId")
    `;

    // Create Announcement table
    console.log('🆕 Creating Announcement table...');
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "classroomId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "announcements_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `;

    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "announcements_classroomId_createdAt_idx" ON "announcements"("classroomId", "createdAt")
    `;

    // Add MEMORIES board if it doesn't exist
    console.log('➕ Adding MEMORIES board...');
    await prisma.$queryRaw`
      INSERT INTO "boards" ("id", "key", "name") 
      VALUES ('memories_board_id', 'MEMORIES', '우리반 추억')
      ON CONFLICT ("key") DO NOTHING
    `;

    // Add foreign key constraint for comment replies
    console.log('➕ Adding comment parent-child relationship...');
    await prisma.$queryRaw`
      ALTER TABLE "comments"
      ADD CONSTRAINT IF NOT EXISTS "comments_parentId_fkey" 
      FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `;

    // Add indexes for better performance
    console.log('📊 Adding performance indexes...');
    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "posts_title_content_idx" ON "posts"("title", "content")
    `;
    
    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS "comments_parentId_idx" ON "comments"("parentId")
    `;

    // Get updated counts
    const totalPosts = await prisma.post.count();
    const totalComments = await prisma.comment.count();
    const totalBoards = await prisma.board.count();

    console.log('✅ Enhanced features migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Enhanced features migration completed successfully',
      stats: {
        totalPosts,
        totalComments,
        totalBoards,
        newFeatures: [
          'Post likes/dislikes',
          'Comment likes',
          'Comment reports',
          'Nested comments',
          'Photo uploads',
          'Announcement system',
          'MEMORIES board'
        ]
      }
    });

  } catch (error: any) {
    console.error('❌ Enhanced features migration error:', error);
    return NextResponse.json(
      { error: 'Enhanced features migration failed: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}