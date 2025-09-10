const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteFFFPost() {
  try {
    // 먼저 FFF 게시글들을 찾기
    const fffPosts = await prisma.post.findMany({
      where: {
        title: 'FFF'
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        deletedAt: true
      }
    });
    
    console.log('Found FFF posts:', fffPosts);
    
    // 각각의 FFF 게시글을 완전히 삭제
    for (const post of fffPosts) {
      // 먼저 댓글들 삭제
      await prisma.comment.deleteMany({
        where: { postId: post.id }
      });
      
      // 좋아요/싫어요 기록 삭제
      await prisma.postLike.deleteMany({
        where: { postId: post.id }
      });
      
      // 게시글 삭제
      await prisma.post.delete({
        where: { id: post.id }
      });
      
      console.log(`Deleted post: ${post.id} - ${post.title}`);
    }
    
    console.log('All FFF posts deleted successfully');
  } catch (error) {
    console.error('Error deleting FFF posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteFFFPost();