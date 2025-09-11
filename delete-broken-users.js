const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteBrokenUsers() {
  try {
    console.log('깨진 텍스트 사용자 삭제 시작...');
    
    // 깨진 텍스트 사용자 ID들
    const brokenUserIds = [
      'cmfbu1uxb0001p03sneyuwi87', // '������'
      'cmfbu1g940000p03sicwbom76'  // '�׽�Ʈ�л�'
    ];
    
    for (const userId of brokenUserIds) {
      // 사용자 정보 확인
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      if (user) {
        console.log(`삭제 대상: ID=${user.id}, 이름='${user.name}', 이메일=${user.email}`);
        
        // 사용자 삭제
        await prisma.user.delete({
          where: { id: userId }
        });
        
        console.log(`✅ 사용자 삭제 완료: ${userId}`);
      } else {
        console.log(`⚠️ 사용자를 찾을 수 없음: ${userId}`);
      }
    }
    
    console.log('\n모든 깨진 텍스트 사용자 삭제 완료!');
    
  } catch (error) {
    console.error('삭제 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteBrokenUsers();