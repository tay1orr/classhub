const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('=== 전체 사용자 목록 ===');
    console.log('총 사용자 수:', users.length);
    console.log('');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   이름: '${user.name}' (길이: ${user.name.length})`);
      console.log(`   이메일: ${user.email}`);
      console.log(`   역할: ${user.role}`);
      console.log(`   승인: ${user.isApproved}`);
      console.log(`   가입일: ${user.createdAt}`);
      console.log('---');
    });
    
    // 깨진 텍스트 찾기 (ASCII가 아닌 특수 문자)
    const brokenUsers = users.filter(user => {
      const name = user.name;
      return name.includes('?') || name.includes('???') || /[^\x20-\x7E\uAC00-\uD7AF\u3131-\u318E]/.test(name);
    });
    
    if (brokenUsers.length > 0) {
      console.log('\n=== 깨진 텍스트 사용자 ===');
      brokenUsers.forEach(user => {
        console.log(`ID: ${user.id}, 이름: '${user.name}'`);
      });
    } else {
      console.log('\n깨진 텍스트 사용자 없음');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();