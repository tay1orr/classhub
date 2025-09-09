'use client'

import { useState, useEffect } from 'react'

export default function DebugPosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...')
      const response = await fetch('/api/posts')
      const data = await response.json()
      
      console.log('Raw API response:', data)
      setRawData(data)
      
      if (response.ok) {
        // 자유게시판 게시글만 필터링
        const freePosts = data.posts.filter((post: any) => post.board === 'free')
        console.log('Filtered free posts:', freePosts)
        setPosts(freePosts)
      } else {
        setError(`API Error: ${data.error}`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(`Network Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">게시글 디버깅 페이지</h1>
      
      {loading && <div>로딩 중...</div>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>오류:</strong> {error}
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">원본 API 응답</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">필터링된 자유게시판 게시글 ({posts.length}개)</h2>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              필터링된 게시글이 없습니다.
            </div>
          ) : (
            posts.map((post, index) => (
              <div key={post.id} className="border p-4 rounded">
                <div className="font-semibold">{index + 1}. {post.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Board: "{post.board}" | Author: {post.author} | Pinned: {post.isPinned ? 'Yes' : 'No'}
                </div>
                <div className="text-sm mt-2">{post.content.substring(0, 100)}...</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <button 
          onClick={fetchPosts}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          다시 불러오기
        </button>
      </div>
    </div>
  )
}