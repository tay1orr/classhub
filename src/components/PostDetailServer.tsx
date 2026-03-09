import { prisma } from '@/lib/prisma'
import PostDetail from './PostDetail'

interface Props {
  postId: string
  boardLabel: string
  boardColor: string
}

async function fetchPost(postId: string) {
  try {
    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        isAnonymous: true,
        isPinned: true,
        views: true,
        likesCount: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        board: { select: { key: true } },
        comments: {
          where: { deletedAt: null, parentId: null },
          select: {
            id: true,
            content: true,
            isAnonymous: true,
            likesCount: true,
            createdAt: true,
            author: { select: { id: true, name: true } },
            replies: {
              where: { deletedAt: null },
              select: {
                id: true,
                content: true,
                isAnonymous: true,
                likesCount: true,
                createdAt: true,
                author: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!post) return null

    // 조회수 증가 (비동기, 응답 안 기다림)
    prisma.post.update({ where: { id: postId }, data: { views: { increment: 1 } } }).catch(() => {})

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author.name,
      authorId: post.author.id,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      board: post.board.key.toLowerCase(),
      views: post.views + 1,
      likes: post.likesCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        author: c.isAnonymous ? '익명' : c.author.name,
        authorId: c.author.id,
        isAnonymous: c.isAnonymous,
        likes: c.likesCount,
        createdAt: c.createdAt.toISOString(),
        replies: c.replies.map((r) => ({
          id: r.id,
          content: r.content,
          author: r.isAnonymous ? '익명' : r.author.name,
          authorId: r.author.id,
          isAnonymous: r.isAnonymous,
          likes: r.likesCount,
          createdAt: r.createdAt.toISOString(),
          replies: [],
        })),
      })),
    }
  } catch {
    return null
  }
}

export default async function PostDetailServer({ postId, boardLabel, boardColor }: Props) {
  const initialPost = await fetchPost(postId)
  return <PostDetail boardLabel={boardLabel} boardColor={boardColor} initialPost={initialPost ?? undefined} />
}
