import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-server'
import { CLASS_CONFIG } from '@/lib/config'
import { formatRelativeTime } from '@/lib/utils'
import { PenSquare, Heart, MessageSquare } from 'lucide-react'
import MemoriesSearch from './MemoriesSearch'

async function fetchMemories() {
  const classroom = await prisma.classroom.findUnique({
    where: { grade_classNo: { grade: CLASS_CONFIG.grade, classNo: CLASS_CONFIG.classNo } },
  })
  if (!classroom) return []

  const posts = await prisma.post.findMany({
    where: { classroomId: classroom.id, board: { key: 'MEMORIES' }, deletedAt: null },
    select: {
      id: true,
      title: true,
      image: true,
      isAnonymous: true,
      likesCount: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    image: p.image,
    author: p.author.name,
    isAnonymous: p.isAnonymous,
    likes: p.likesCount,
    comments: p._count.comments,
    createdAt: p.createdAt.toISOString(),
  }))
}

export default async function MemoriesPage({ params }: { params: { classroom: string } }) {
  const [posts, user] = await Promise.all([fetchMemories(), getServerSession()])
  const classroom = params.classroom

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="rounded-xl border p-5 bg-pink-50 border-pink-200 text-pink-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📸 우리반 추억</h1>
            <p className="text-sm opacity-70 mt-1">총 {posts.length}개의 추억</p>
          </div>
          {user && (
            <Link href={`/${classroom}/memories/write`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors">
              <PenSquare className="h-4 w-4" />추억 남기기
            </Link>
          )}
        </div>
      </div>

      <MemoriesSearch posts={posts} classroom={classroom} userLoggedIn={!!user} />
    </div>
  )
}
