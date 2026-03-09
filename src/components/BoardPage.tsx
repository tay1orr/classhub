import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'
import BoardPageClient from './BoardPageClient'

interface Props {
  boardKey: string
  title: string
  color: string
  emoji: string
  writeLabel?: string
  page?: number
}

async function fetchPosts(boardKey: string, page: number, limit = 15) {
  const skip = (page - 1) * limit
  const where = { deletedAt: null, board: { key: boardKey } }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        isAnonymous: true,
        isPinned: true,
        views: true,
        likesCount: true,
        createdAt: true,
        author: { select: { name: true } },
        board: { select: { key: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip,
    }),
    prisma.post.count({ where }),
  ])

  return {
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author.name,
      isAnonymous: p.isAnonymous,
      board: p.board.key.toLowerCase(),
      views: p.views,
      likes: p.likesCount,
      comments: p._count.comments,
      isPinned: p.isPinned,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page, pages: Math.ceil(total / limit), total },
  }
}

export default async function BoardPage({ boardKey, title, color, emoji, writeLabel, page = 1 }: Props) {
  const [{ posts, pagination }, user] = await Promise.all([
    fetchPosts(boardKey, page),
    getServerSession(),
  ])

  return (
    <BoardPageClient
      boardKey={boardKey}
      title={title}
      color={color}
      emoji={emoji}
      writeLabel={writeLabel}
      initialPosts={posts}
      pagination={pagination}
      userLoggedIn={!!user}
    />
  )
}
