'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
// 데이터베이스 기반 인증으로 변경됨 - simple-auth는 더 이상 사용하지 않음
import { ArrowLeft, Shield, ShieldCheck, User, UserCheck, AlertTriangle, Trash2 } from 'lucide-react'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [targetEmail, setTargetEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)

  useEffect(() => {
    const currentUserStr = localStorage.getItem('classhub_current_user')
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
    setUser(currentUser)
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return
    }
    
    loadUsers()

    // 페이지 포커스 시 실시간 새로고침
    const handleFocus = () => {
      console.log('👁️ Admin page focused - refreshing user list...')
      loadUsers()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus()
      }
    })

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Loading users...')
      
      // 강력한 캐시 우회를 위해 다중 timestamp 추가
      const timestamp = new Date().getTime()
      const random = Math.random()
      const uuid = Math.random().toString(36).substring(7)
      
      const response = await fetch(`/api/admin/users?t=${timestamp}&r=${random}&v=${Date.now()}&u=${uuid}&_=${new Date().valueOf()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date().toUTCString()
        }
      });
      
      console.log('📋 API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      console.log('📋 API Response:', result)
      console.log('👥 Users data:', result.users)
      
      if (result.success && result.users) {
        setUsers(result.users)
        console.log('✅ Users set successfully:', result.users.length, 'users')
      } else {
        console.error('❌ API returned error:', result)
        setMessage('사용자 목록을 불러올 수 없습니다: ' + (result.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('❌ Load users error:', error)
      setMessage('사용자 목록을 불러오는 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      })
      
      const result = await response.json()
      setMessage(result.message || result.error)
      
      if (result.success) {
        loadUsers()
      }
    } catch (error) {
      setMessage('권한 변경 중 오류가 발생했습니다.')
    }
    setTimeout(() => setMessage(''), 3000)
  }


  const handleRevokeAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'STUDENT' }),
      })
      
      const result = await response.json()
      setMessage(result.message || result.error)
      
      if (result.success) {
        loadUsers()
      }
    } catch (error) {
      setMessage('권한 변경 중 오류가 발생했습니다.')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleApproveUser = async (userId: string, userName: string) => {
    console.log(`🔄 승인 시작: ${userName} (${userId})`)
    setProcessingUserId(userId)
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('📋 승인 응답 상태:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📋 승인 결과:', result)
      
      setMessage(result.message || result.error)
      
      if (result.success) {
        console.log('✅ 승인 성공 - 사용자 목록 새로고침 중...')
        await loadUsers()
      } else {
        console.error('❌ 승인 실패:', result.error)
      }
    } catch (error: any) {
      console.error('❌ 승인 오류:', error)
      setMessage(`사용자 승인 중 오류가 발생했습니다: ${error.message}`)
    }
    
    setProcessingUserId(null)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleRejectUser = async (userId: string, userName: string) => {
    if (!confirm(`정말로 "${userName}"님의 가입 신청을 거부하시겠습니까?\n\n⚠️ 거부하면 해당 사용자 계정이 완전히 삭제됩니다!`)) {
      return
    }

    console.log(`🔄 거부 시작: ${userName} (${userId})`)
    setProcessingUserId(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('📋 거부 응답 상태:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📋 거부 결과:', result)
      
      setMessage(result.message || result.error)
      
      if (result.success) {
        console.log('✅ 거부 성공 - 사용자 목록 새로고침 중...')
        await loadUsers()
      } else {
        console.error('❌ 거부 실패:', result.error)
      }
    } catch (error: any) {
      console.error('❌ 거부 오류:', error)
      setMessage(`사용자 거부 중 오류가 발생했습니다: ${error.message}`)
    }
    
    setProcessingUserId(null)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`정말로 "${userName}" 사용자를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!\n- 사용자의 모든 게시글과 댓글이 삭제됩니다.\n- 관련된 모든 데이터가 영구적으로 제거됩니다.`)) {
      return
    }

    console.log(`🔄 삭제 시작: ${userName} (${userId})`)
    setProcessingUserId(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('📋 삭제 응답 상태:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📋 삭제 결과:', result)
      
      setMessage(result.message || result.error)
      
      if (result.success) {
        console.log('✅ 삭제 성공 - 사용자 목록 새로고침 중...')
        
        // 로컬 상태에서도 즉시 제거
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId))
        
        // API에서 새로고침도 병행
        await loadUsers()
      } else {
        console.error('❌ 삭제 실패:', result.error)
      }
    } catch (error: any) {
      console.error('❌ 삭제 오류:', error)
      setMessage(`사용자 삭제 중 오류가 발생했습니다: ${error.message}`)
    }
    
    setProcessingUserId(null)
    setTimeout(() => setMessage(''), 5000)
  }

  const handleMigrateSchema = async () => {
    if (!confirm('데이터베이스 스키마를 업데이트하시겠습니까?\n\n이 작업은 isApproved 필드를 추가하고 관리자들을 자동 승인합니다.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/migrate-schema', {
        method: 'POST',
      })
      
      const result = await response.json()
      setMessage(result.message || result.error)
      
      if (result.success) {
        loadUsers()
      }
    } catch (error) {
      setMessage('스키마 마이그레이션 중 오류가 발생했습니다.')
    }
    setTimeout(() => setMessage(''), 5000)
  }

  const handleMigrateExistingUsers = async () => {
    if (!confirm('승인된 학생들을 모두 승인대기 상태로 되돌리시겠습니까?\n\n⚠️ 관리자는 제외하고 학생들만 승인대기 상태로 변경됩니다.\n이후 수동으로 승인/거부를 할 수 있습니다.')) {
      return
    }

    console.log('🔄 학생들을 승인대기로 되돌리기 시작...')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/migrate-existing-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('📋 되돌리기 응답 상태:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📋 되돌리기 결과:', result)
      
      setMessage(result.message || result.error)
      
      if (result.success) {
        console.log('✅ 되돌리기 성공 - 사용자 목록 새로고침 중...')
        await loadUsers()
      } else {
        console.error('❌ 되돌리기 실패:', result.error)
      }
    } catch (error: any) {
      console.error('❌ 되돌리기 오류:', error)
      setMessage(`학생 상태 되돌리기 중 오류가 발생했습니다: ${error.message}`)
    }
    
    setIsLoading(false)
    setTimeout(() => setMessage(''), 5000)
  }


  const handleGrantAdminByEmail = async () => {
    if (!targetEmail.trim()) {
      setMessage('이메일을 입력해주세요.')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    try {
      // 먼저 해당 이메일의 사용자를 찾기
      const targetUser = users.find(u => u.email === targetEmail.trim())
      if (!targetUser) {
        setMessage('해당 이메일의 사용자를 찾을 수 없습니다.')
        setTimeout(() => setMessage(''), 3000)
        return
      }
      
      // 사용자 ID로 권한 변경
      await handleGrantAdmin(targetUser.id)
      setTargetEmail('')
    } catch (error) {
      setMessage('권한 부여 중 오류가 발생했습니다.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
          <Link href="/login">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 임시: taylorr@gclass.ice.go.kr 계정은 무조건 관리자 권한 허용
  const isForceAdmin = user?.email === 'taylorr@gclass.ice.go.kr'
  if (user?.role !== 'ADMIN' && !isForceAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">관리자 권한이 필요합니다.</p>
          <Link href="/1-6">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center p-6">로딩 중...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/1-6" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          홈으로 돌아가기
        </Link>
        
        {/* 관리자 메뉴 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">관리자: {user.name}</span>
          <Badge className="bg-red-500 text-white">ADMIN</Badge>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          관리자 패널
        </h1>
        <p className="text-gray-600">사용자 권한 관리 및 시스템 관리</p>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          {message}
        </div>
      )}

      {/* 빠른 관리자 권한 부여 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <UserCheck className="h-5 w-5" />
              이메일로 관리자 권한 부여
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Input
                  placeholder="이메일 주소를 입력하세요"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleGrantAdminByEmail} className="bg-green-600 hover:bg-green-700">
                  권한 부여
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                특정 사용자에게 관리자 권한을 부여할 수 있습니다. (해당 사용자가 먼저 회원가입을 완료해야 합니다)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Shield className="h-5 w-5" />
              관리자 빠른 메뉴
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Button 
                onClick={handleMigrateSchema}
                className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                데이터베이스 스키마 업데이트
              </Button>
              <Button 
                onClick={handleMigrateExistingUsers}
                disabled={isLoading}
                className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {isLoading ? '처리중...' : '승인된 학생들을 승인대기로 되돌리기'}
              </Button>
              <Link href="/1-6/free">
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  자유게시판 관리
                </Button>
              </Link>
              <Link href="/1-6/assignment">
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  수행평가 게시판 관리
                </Button>
              </Link>
              <Link href="/1-6/exam">
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  지필평가 게시판 관리
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            전체 사용자 관리 ({users.length}명)
            <Badge className="bg-green-500 text-white">
              승인됨: {users.filter(u => u.isApproved).length}명
            </Badge>
            <Badge className="bg-yellow-500 text-white">
              승인대기: {users.filter(u => !u.isApproved).length}명
            </Badge>
            <Badge className="bg-red-500 text-white">
              깨진 텍스트: {users.filter(u => u.name.includes('�')).length}명
            </Badge>
            <Button 
              onClick={loadUsers} 
              size="sm" 
              variant="outline"
              className="ml-auto"
            >
              새로고침
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userData) => (
              <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`font-semibold ${userData.name.includes('�') ? 'text-red-600 bg-red-50 px-2 py-1 rounded border' : ''}`}>
                      {userData.name}
                      {userData.name.includes('�') && <span className="text-xs text-red-500 ml-2">⚠️ 깨진 텍스트</span>}
                    </h3>
                    <Badge 
                      className={userData.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}
                    >
                      {userData.role === 'ADMIN' ? '관리자' : '학생'}
                    </Badge>
                    <Badge 
                      className={userData.isApproved ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}
                    >
                      {userData.isApproved ? '승인됨' : '승인대기'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{userData.email}</p>
                  <p className="text-xs text-gray-400">ID: {userData.id}</p>
                </div>
                
                <div className="flex gap-2">
                  {!userData.isApproved && userData.role !== 'ADMIN' ? (
                    // 승인 대기 상태 (관리자 제외): 승인/거부 버튼 표시
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApproveUser(userData.id, userData.name)}
                        disabled={processingUserId === userData.id}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {processingUserId === userData.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                            처리중...
                          </>
                        ) : (
                          '승인'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRejectUser(userData.id, userData.name)}
                        disabled={processingUserId === userData.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {processingUserId === userData.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            처리중...
                          </>
                        ) : (
                          '거부'
                        )}
                      </Button>
                    </>
                  ) : (
                    // 승인된 사용자: 역할 관리 및 삭제 버튼
                    <>
                      {userData.role === 'ADMIN' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRevokeAdmin(userData.id)}
                          disabled={userData.id === user.id} // 자기 자신의 권한은 제거 불가
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          관리자 권한 제거
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGrantAdmin(userData.id)}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          관리자 권한 부여
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(userData.id, userData.name)}
                        disabled={userData.id === user.id || processingUserId === userData.id} // 자기 자신은 삭제 불가
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {processingUserId === userData.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            처리중...
                          </>
                        ) : (
                          '삭제'
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {users.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <p>등록된 사용자가 없습니다.</p>
                <p className="text-sm mt-2">API에서 사용자 목록을 불러올 수 없습니다.</p>
                <Button onClick={loadUsers} className="mt-4">
                  다시 시도
                </Button>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                사용자 목록을 불러오는 중...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 관리자 기능 안내 */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="text-yellow-700">🛡️ 관리자 권한 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-yellow-800 space-y-2">
            <p><strong>관리자가 할 수 있는 작업:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>사용자 가입 승인/거부</li>
              <li>모든 게시글 삭제 권한</li>
              <li>공지사항 작성 권한 (게시글 상단 고정)</li>
              <li>댓글 삭제 권한</li>
              <li>다른 사용자에게 관리자 권한 부여/제거</li>
              <li>사용자 계정 삭제</li>
              <li>전체 사용자 목록 조회</li>
            </ul>
            <p className="text-xs mt-4 text-yellow-600">
              ⚠️ 관리자 권한은 신중하게 부여해주세요. 악용될 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}