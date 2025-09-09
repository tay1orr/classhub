'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { getCurrentUser } from '@/lib/simple-auth'

interface LikeButtonProps {
  postId: string
  initialLikes: number
  initialDislikes: number
  initialUserLike?: boolean | null // true = liked, false = disliked, null = no action
  size?: 'sm' | 'default' | 'lg'
  showCounts?: boolean
}

export function LikeButton({
  postId,
  initialLikes,
  initialDislikes,
  initialUserLike = null,
  size = 'default',
  showCounts = true
}: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [userLike, setUserLike] = useState<boolean | null>(initialUserLike)
  const [isLoading, setIsLoading] = useState(false)

  const handleLikeDislike = async (isLike: boolean) => {
    const user = getCurrentUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isLike
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '좋아요/싫어요 처리에 실패했습니다.')
      }

      setLikes(result.likes)
      setDislikes(result.dislikes)
      setUserLike(result.userLike)
    } catch (error) {
      console.error('Like/dislike error:', error)
      alert('좋아요/싫어요 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSizeClass = {
    sm: 'h-8 px-2',
    default: 'h-9 px-3',
    lg: 'h-10 px-4'
  }[size]

  const iconSizeClass = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size]

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userLike === true ? 'default' : 'outline'}
        size={size}
        onClick={() => handleLikeDislike(true)}
        disabled={isLoading}
        className={`${buttonSizeClass} ${
          userLike === true 
            ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' 
            : 'hover:bg-blue-50 hover:border-blue-200'
        }`}
      >
        <ThumbsUp className={`${iconSizeClass} ${userLike === true ? 'fill-current' : ''}`} />
        {showCounts && <span className="ml-1">{likes}</span>}
      </Button>
      
      <Button
        variant={userLike === false ? 'default' : 'outline'}
        size={size}
        onClick={() => handleLikeDislike(false)}
        disabled={isLoading}
        className={`${buttonSizeClass} ${
          userLike === false 
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
            : 'hover:bg-red-50 hover:border-red-200'
        }`}
      >
        <ThumbsDown className={`${iconSizeClass} ${userLike === false ? 'fill-current' : ''}`} />
        {showCounts && <span className="ml-1">{dislikes}</span>}
      </Button>
    </div>
  )
}