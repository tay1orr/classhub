'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeTime } from '@/lib/utils'
import { Heart, MessageSquare, Search } from 'lucide-react'

interface Post {
  id: string
  title: string
  image: string | null
  author: string
  isAnonymous: boolean
  likes: number
  comments: number
  createdAt: string
}

export default function MemoriesSearch({ posts, classroom, userLoggedIn }: {
  posts: Post[]
  classroom: string
  userLoggedIn: boolean
}) {
  const [search, setSearch] = useState('')
  const displayed = search ? posts.filter((p) => p.title.includes(search)) : posts

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="추억 검색..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
      </div>

      {displayed.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <div className="text-5xl mb-3">📸</div>
          <p>{search ? '검색 결과가 없습니다' : '아직 추억이 없습니다'}</p>
          {userLoggedIn && !search && (
            <Link href={`/${classroom}/memories/write`} className="mt-4 inline-block text-sm text-pink-500 hover:underline">
              첫 번째 추억을 남겨보세요!
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((post) => (
            <Link key={post.id} href={`/${classroom}/memories/${post.id}`}
              className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
              {post.image ? (
                <div className="relative aspect-square">
                  <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-square bg-pink-50 flex items-center justify-center text-4xl">📸</div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.title}</p>
                <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                  <span>{post.isAnonymous ? '익명' : post.author}</span>
                  <div className="flex items-center gap-2">
                    {post.likes > 0 && (
                      <span className="flex items-center gap-0.5 text-pink-400"><Heart className="h-3 w-3" />{post.likes}</span>
                    )}
                    {post.comments > 0 && (
                      <span className="flex items-center gap-0.5 text-blue-400"><MessageSquare className="h-3 w-3" />{post.comments}</span>
                    )}
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
