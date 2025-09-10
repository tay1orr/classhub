const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCorruptedPosts() {
  try {
    // 인코딩이 깨진 게시글 ID들
    const corruptedPostIds = [
      'cmfdwu7o60009n3qtw84hbh1q', // �׽�Ʈ ������ �Խñ�
      'cmfdu6eh30007n3qtjiw80ehb', // �߾� �׽�Ʈ
      'cmfdu5i340005n3qtx9nloscm', // ������ �׽�Ʈ
      'cmfdtrtxm0003n3qt6mtfsuh6', // ������ �׽�Ʈ
      'cmfdw6ntu0001wvegqc0kx58o'  // asfas (임시 테스트)
    ];
    
    console.log('인코딩이 깨진 게시글들을 삭제합니다...');
    
    for (const postId of corruptedPostIds) {
      try {
        // 먼저 게시글이 존재하는지 확인
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { id: true, title: true }
        });
        
        if (post) {
          console.log(`삭제 중: ${post.id} - ${post.title}`);
          
          // 관련 댓글들 삭제
          await prisma.comment.deleteMany({
            where: { postId: postId }
          });
          
          // 좋아요/싫어요 기록 삭제
          await prisma.postLike.deleteMany({
            where: { postId: postId }
          });
          
          // 게시글 삭제
          await prisma.post.delete({
            where: { id: postId }
          });
          
          console.log(`✅ 삭제 완료: ${postId}`);
        } else {
          console.log(`❌ 게시글을 찾을 수 없음: ${postId}`);
        }
      } catch (error) {
        console.error(`❌ ${postId} 삭제 실패:`, error.message);
      }
    }
    
    console.log('\n🎉 모든 인코딩 깨진 게시글 정리 완료!');
    
    // 남은 게시글 확인
    const remainingPosts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        board: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n📋 현재 남은 게시글들:');
    remainingPosts.forEach(post => {
      console.log(`  - [${post.board.name}] ${post.title}`);
    });
    
  } catch (error) {
    console.error('❌ 전체적인 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanCorruptedPosts();