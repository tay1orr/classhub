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
    console.log('🔄 Starting schema migration...');
    
    // Check if isApproved column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'isApproved'
    `;

    if (Array.isArray(result) && result.length === 0) {
      // Add isApproved column if it doesn't exist
      console.log('➕ Adding isApproved column...');
      await prisma.$queryRaw`
        ALTER TABLE "users" 
        ADD COLUMN "isApproved" BOOLEAN DEFAULT false
      `;
      
      // Update admin users to be approved by default
      console.log('✅ Setting admin users as approved...');
      await prisma.$queryRaw`
        UPDATE "users" 
        SET "isApproved" = true 
        WHERE "role" = 'ADMIN' OR "email" IN (
          'taylorr@gclass.ice.go.kr',
          'admin@classhub.co.kr', 
          'taylorr@naver.com'
        )
      `;
      
      console.log('✅ Schema migration completed successfully');
    } else {
      console.log('ℹ️ isApproved column already exists');
    }

    // Get updated user counts
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'ADMIN' } });
    const approvedUsers = await prisma.user.count({ where: { isApproved: true } });

    return NextResponse.json({
      success: true,
      message: 'Schema migration completed successfully',
      stats: {
        totalUsers,
        adminUsers,
        approvedUsers,
        pendingUsers: totalUsers - approvedUsers
      }
    });

  } catch (error: any) {
    console.error('❌ Schema migration error:', error);
    return NextResponse.json(
      { error: 'Schema migration failed: ' + error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}