'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { 
  getCurrentUser, 
  isAdmin, 
  getAllUsers, 
  changeUserRole 
} from '@/lib/simple-auth'
import { ArrowLeft, Shield, ShieldCheck, User, UserCheck, AlertTriangle, Trash2 } from 'lucide-react'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [targetEmail, setTargetEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    if (!currentUser || !isAdmin(currentUser)) {
      return
    }
    
    loadUsers()
  }, [])

  const loadUsers = () => {
    const result = getAllUsers()
    if (result.success && result.users) {
      setUsers(result.users)
    }
    setIsLoading(false)
  }

  const handleGrantAdmin = async (email: string) => {
    const result = changeUserRole(email, 'ADMIN')
    setMessage(result.message)
    if (result.success) {
      loadUsers()
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleRevokeAdmin = async (email: string) => {
    const result = changeUserRole(email, 'STUDENT')
    setMessage(result.message)
    if (result.success) {
      loadUsers()
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleGrantAdminByEmail = async () => {
    if (!targetEmail.trim()) {
      setMessage('이메일을 입력해주세요.')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    
    const result = changeUserRole(targetEmail.trim(), 'ADMIN')
    setMessage(result.message)
    if (result.success) {
      loadUsers()
      setTargetEmail('')
    }
    setTimeout(() => setMessage(''), 3000)
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

  if (!isAdmin(user)) {
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userData) => (
              <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{userData.name}</h3>
                    <Badge 
                      className={userData.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}
                    >
                      {userData.role === 'ADMIN' ? '관리자' : '학생'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{userData.email}</p>
                  <p className="text-xs text-gray-400">ID: {userData.id}</p>
                </div>
                
                <div className="flex gap-2">
                  {userData.role === 'ADMIN' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRevokeAdmin(userData.email)}
                      disabled={userData.email === user.email} // 자기 자신의 권한은 제거 불가
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      관리자 권한 제거
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGrantAdmin(userData.email)}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      관리자 권한 부여
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                등록된 사용자가 없습니다.
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
              <li>모든 게시글 삭제 권한</li>
              <li>공지사항 작성 권한 (게시글 상단 고정)</li>
              <li>댓글 삭제 권한</li>
              <li>다른 사용자에게 관리자 권한 부여/제거</li>
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