'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, X, Upload } from 'lucide-react'
import { getCurrentUser } from '@/lib/simple-auth'

export default function WriteMemoryPage() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      router.push('/login')
      return
    }
    setUser(currentUser)
  }, [router])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        alert('이미지 크기는 10MB 이하여야 합니다.')
        return
      }
      
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const storedPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
      const newId = Math.max(...storedPosts.map((p: any) => p.id), 0) + 1

      const newPost = {
        id: newId,
        board: 'memories',
        title: title.trim(),
        content: content.trim(),
        author: user.name,
        isAnonymous: anonymous,
        anonymous: anonymous,
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments: 0,
        tags: tags,
        hasImage: selectedImage !== null,
        imageData: imagePreview // Base64 이미지 데이터 저장 (실제 구현에서는 별도 저장소 사용)
      }

      const updatedPosts = [...storedPosts, newPost]
      localStorage.setItem('classhub_posts', JSON.stringify(updatedPosts))

      alert('추억이 성공적으로 등록되었습니다! 💝')
      router.push('/1-8/memories')
    } catch (error) {
      console.error('Error creating post:', error)
      alert('추억 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-64">로딩 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/1-8/memories" className="flex items-center gap-2 text-pink-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          추억 게시판으로 돌아가기
        </Link>
      </div>

      <Card className="border-pink-100 dark:border-pink-900">
        <CardHeader className="border-b border-pink-100 dark:border-pink-900">
          <CardTitle className="text-pink-600 dark:text-pink-400">📸 새로운 추억 올리기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* 제목 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="추억의 제목을 입력해주세요..."
              className="border-pink-200 focus:border-pink-400"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">{title.length}/100</p>
          </div>

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">사진</label>
            <div className="border-2 border-dashed border-pink-200 dark:border-pink-800 rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Camera className="h-12 w-12 text-pink-400 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400">추억의 사진을 올려보세요</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-pink-300 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    사진 선택
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500">JPG, PNG, GIF 파일 (최대 10MB)</p>
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="추억에 대한 이야기를 들려주세요...&#10;&#10;예시:&#10;- 오늘 체육대회에서 우리 반이 1등을 했어요! 🏆&#10;- 선생님과 함께 찍은 단체사진이에요 📸&#10;- 생일 축하해주는 친구들의 모습이에요 🎂"
              rows={8}
              className="resize-none border-pink-200 focus:border-pink-400"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500">{content.length}/2000</p>
          </div>

          {/* 태그 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">태그 (선택)</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="태그 입력 후 Enter"
                className="flex-1 border-pink-200 focus:border-pink-400"
                maxLength={20}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="border-pink-300 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950"
                disabled={tags.length >= 5}
              >
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-pink-200 text-pink-600">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-pink-800"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">최대 5개까지 추가할 수 있습니다</p>
          </div>

          {/* 익명 옵션 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={anonymous}
              onCheckedChange={(checked) => setAnonymous(checked as boolean)}
            />
            <label
              htmlFor="anonymous"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              익명으로 작성하기
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Link href="/1-8/memories" className="flex-1">
              <Button variant="outline" className="w-full">
                취소
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              {isSubmitting ? '등록 중...' : '추억 등록하기'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}