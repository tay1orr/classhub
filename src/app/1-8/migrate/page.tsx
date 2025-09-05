'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MigratePage() {
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const createSampleData = () => {
    setIsLoading(true)
    setStatus('데이터 생성 중...')

    try {
      // 기존 데이터 확인
      const existingPosts = JSON.parse(localStorage.getItem('classhub_posts') || '[]')
      
      // 샘플 게시글 데이터 (3011에서 있었던 것들을 재현)
      const samplePosts = [
        {
          id: 1,
          board: 'memories',
          title: '우리반 처음 만난 날',
          content: '새 학기가 시작되면서 우리 반 친구들과 처음 만났던 그 날을 기억해요. 모두 어색했지만 지금은 이렇게 친해졌네요! 정말 소중한 추억이에요. 그때 다들 자기소개하느라 떨었던 게 기억나네요 ㅋㅋㅋ',
          author: '김학생',
          createdAt: '2024-03-02T09:00:00.000Z',
          views: 42,
          likes: 15,
          comments: 8,
          isAnonymous: false,
          hasImage: false,
          tags: ['새학기', '첫만남', '친구들']
        },
        {
          id: 2,
          board: 'memories',
          title: '체육대회 우승 기념 🏆',
          content: '우리반이 체육대회에서 종합 1위를 했어요! 모든 종목에서 열심히 뛰어준 친구들 덕분이에요. 특히 계주에서 역전했을 때는 정말 소름돋았어요!',
          author: '박학생',
          createdAt: '2024-05-15T14:30:00.000Z',
          views: 78,
          likes: 32,
          comments: 12,
          isAnonymous: false,
          hasImage: true,
          imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZDA5ZCIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNmZjY5MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+GPC90ZXh0Pgo8L3N2Zz4K',
          tags: ['체육대회', '우승', '단합']
        },
        {
          id: 3,
          board: 'memories',
          title: '생일축하 이벤트 🎂',
          content: '오늘 민지 생일이어서 다같이 깜짝 파티 열어줬어요! 케이크도 준비하고 선물도 모아서... 민지가 정말 좋아했어요 ㅠㅠ 우리반 최고!',
          author: '최학생',
          createdAt: '2024-06-20T16:45:00.000Z',
          views: 56,
          likes: 28,
          comments: 15,
          isAnonymous: false,
          hasImage: true,
          imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmYjNiYSIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNkYzI2MjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn46CPC90ZXh0Pgo8L3N2Zz4K',
          tags: ['생일', '축하', '케이크']
        },
        {
          id: 4,
          board: 'free',
          title: '내일 수학 시험 대박이다',
          content: '진짜 하나도 모르겠어... 특히 이차함수 부분이 너무 어려워요. 누가 같이 공부할 사람 있나요? 도서관에서 만나서 서로 모르는 거 가르쳐줘요!',
          author: '이학생',
          createdAt: '2024-06-25T20:30:00.000Z',
          views: 45,
          likes: 8,
          comments: 12,
          isAnonymous: false,
          tags: ['시험', '수학', '스터디']
        },
        {
          id: 5,
          board: 'free',
          title: '점심메뉴 투표합시다!',
          content: '내일 단체 주문할 점심 메뉴 투표해요~ 1번 치킨, 2번 피자, 3번 중국집, 4번 한식! 댓글로 번호 적어주세요!',
          author: '강학생',
          createdAt: '2024-06-26T11:20:00.000Z',
          views: 67,
          likes: 12,
          comments: 28,
          isAnonymous: false,
          tags: ['점심', '투표', '음식']
        },
        {
          id: 6,
          board: 'assignment',
          title: '국어 과제 - 독후감 작성법',
          content: '다음 주까지 독후감 제출해야 해요. 책은 자유선택이고 A4 2장 분량으로 써오라고 하셨어요. 구성은 책 소개, 감상문, 교훈 순서로 쓰면 됩니다!',
          author: '정학생',
          createdAt: '2024-06-24T08:45:00.000Z',
          views: 89,
          likes: 6,
          comments: 5,
          isAnonymous: false,
          tags: ['국어', '독후감', '과제']
        },
        {
          id: 7,
          board: 'exam',
          title: '영어 기말고사 범위 정리',
          content: '영어 기말고사 범위 정리해서 올립니다!\n\n- 교과서 Lesson 6~10\n- 워크북 Unit 6~10\n- 부교재 Chapter 5~8\n- 듣기는 지난 달 모의고사 유형\n\n모두 화이팅!',
          author: '윤학생',
          createdAt: '2024-06-23T17:15:00.000Z',
          views: 134,
          likes: 25,
          comments: 8,
          isAnonymous: false,
          isPinned: true,
          tags: ['영어', '시험', '정리']
        }
      ]

      // 기존 데이터와 새 데이터 합치기
      const allPosts = [...existingPosts, ...samplePosts]
      
      // ID 중복 방지
      const uniquePosts = allPosts.reduce((acc, post) => {
        if (!acc.find((p: any) => p.id === post.id)) {
          acc.push(post)
        }
        return acc
      }, [] as any[])

      // 댓글 샘플 데이터
      const sampleComments = [
        {
          id: 1,
          postId: 1,
          board: 'memories',
          content: '정말 그때가 엊그제 같은데... 벌써 이렇게 친해졌네요!',
          author: '서학생',
          createdAt: '2024-03-02T10:30:00.000Z',
          likes: 3
        },
        {
          id: 2,
          postId: 2,
          board: 'memories', 
          content: '그때 계주 뛸 때 정말 심장 터질뻔했어요 ㅋㅋㅋ',
          author: '김학생',
          createdAt: '2024-05-15T15:00:00.000Z',
          likes: 5
        },
        {
          id: 3,
          postId: 4,
          board: 'free',
          content: '저도 같이 공부해요! 내일 2시에 도서관 어때요?',
          author: '박학생',
          createdAt: '2024-06-25T21:00:00.000Z',
          likes: 2
        }
      ]

      // localStorage에 저장
      localStorage.setItem('classhub_posts', JSON.stringify(uniquePosts))
      localStorage.setItem('classhub_comments', JSON.stringify(sampleComments))

      setStatus(`✅ 성공! 총 ${uniquePosts.length}개의 게시글과 ${sampleComments.length}개의 댓글이 생성되었습니다!`)
      
      setTimeout(() => {
        window.location.href = '/1-8'
      }, 2000)

    } catch (error) {
      setStatus('❌ 오류 발생: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 페이지 로드 시 자동 실행
    createSampleData()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/1-8" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          메인으로 돌아가기
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔄 데이터 마이그레이션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">상태</h3>
            <p className="text-blue-700">{status || '데이터 생성 중...'}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">생성되는 데이터</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 📸 우리반 처음 만난 날 (추억 게시판)</li>
              <li>• 🏆 체육대회 우승 기념 (추억 게시판)</li>
              <li>• 🎂 생일축하 이벤트 (추억 게시판)</li>
              <li>• 💬 자유게시판 게시글들</li>
              <li>• 📝 수행평가 게시글들</li>
              <li>• 📚 지필평가 게시글들</li>
              <li>• 💭 댓글들</li>
            </ul>
          </div>

          <div className="text-center">
            <Button onClick={createSampleData} disabled={isLoading} className="mr-3">
              {isLoading ? '생성 중...' : '다시 생성하기'}
            </Button>
            <Link href="/1-8">
              <Button variant="outline">
                메인 페이지로 가기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}