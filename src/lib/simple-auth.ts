// 브라우저 localStorage 기반 영구 저장소
function getUsers() {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('classhub_users')
  if (stored) {
    return JSON.parse(stored)
  }
  // 기본 사용자 생성
  const defaultUsers = [
    {
      id: '1',
      name: '김교사',
      email: 'admin@classhub.kr',
      password: 'password123',
      role: 'ADMIN'
    }
  ]
  localStorage.setItem('classhub_users', JSON.stringify(defaultUsers))
  return defaultUsers
}

function saveUsers(users: any[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('classhub_users', JSON.stringify(users))
}

export async function registerUser(userData: {
  name: string
  email: string
  password: string
}): Promise<{ success: boolean; message: string; user?: any }> {
  
  const users = getUsers()
  
  // 이메일 중복 확인
  if (users.find((u: any) => u.email === userData.email)) {
    return { success: false, message: '이미 가입된 이메일입니다.' }
  }

  // 새 사용자 추가 (특정 이메일은 자동으로 관리자 권한 부여)
  const isSpecialAdmin = userData.email === 'taylorr@glcass.ice.go.kr'
  const newUser = {
    id: Date.now().toString(),
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: isSpecialAdmin ? 'ADMIN' : 'STUDENT'
  }
  
  users.push(newUser)
  saveUsers(users)
  
  console.log('✅ 사용자 등록 성공:', newUser)
  if (isSpecialAdmin) {
    console.log('🎉 특별 관리자 계정이 생성되었습니다! (taylorr@glcass.ice.go.kr)')
  }
  console.log('현재 사용자 목록:', users)
  
  return { 
    success: true, 
    message: isSpecialAdmin ? 
      '회원가입이 완료되었습니다! 관리자 권한이 자동으로 부여되었습니다. 🎉' : 
      '회원가입이 완료되었습니다!', 
    user: newUser 
  }
}

export async function loginUser(email: string, password: string) {
  const users = getUsers()
  const user = users.find((u: any) => u.email === email && u.password === password)
  
  if (user) {
    console.log('✅ 로그인 성공:', user)
    return { success: true, message: '로그인 성공!', user }
  }
  
  console.log('❌ 로그인 실패:', { email, password })
  console.log('현재 사용자 목록:', users)
  return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('classhub_current_user')
  return userStr ? JSON.parse(userStr) : null
}

export function setCurrentUser(user: any) {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem('classhub_current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('classhub_current_user')
  }
  
  // 네비바 업데이트를 위한 이벤트 발생
  window.dispatchEvent(new Event('userStatusChanged'))
}

// 관리자 권한 확인
export function isAdmin(user: any = null): boolean {
  const currentUser = user || getCurrentUser()
  return currentUser?.role === 'ADMIN'
}

// 사용자 역할 변경 (관리자만 가능)
export function changeUserRole(targetEmail: string, newRole: 'ADMIN' | 'STUDENT'): { success: boolean; message: string } {
  const currentUser = getCurrentUser()
  if (!isAdmin(currentUser)) {
    return { success: false, message: '관리자 권한이 필요합니다.' }
  }

  const users = getUsers()
  const targetUserIndex = users.findIndex((u: any) => u.email === targetEmail)
  
  if (targetUserIndex === -1) {
    return { success: false, message: '사용자를 찾을 수 없습니다.' }
  }

  users[targetUserIndex].role = newRole
  saveUsers(users)
  
  console.log(`✅ 사용자 권한 변경: ${targetEmail} -> ${newRole}`)
  return { success: true, message: `사용자 권한이 ${newRole}로 변경되었습니다.` }
}

// 모든 사용자 조회 (관리자만 가능)
export function getAllUsers(): { success: boolean; users?: any[]; message?: string } {
  const currentUser = getCurrentUser()
  if (!isAdmin(currentUser)) {
    return { success: false, message: '관리자 권한이 필요합니다.' }
  }
  
  return { success: true, users: getUsers() }
}

// 게시글 삭제 (관리자 또는 작성자만 가능)
export function canDeletePost(post: any, user: any = null): boolean {
  const currentUser = user || getCurrentUser()
  if (!currentUser) return false
  
  return isAdmin(currentUser) || post.authorId === currentUser.id
}

// 댓글 삭제 (관리자만 가능)
export function canDeleteComment(user: any = null): boolean {
  const currentUser = user || getCurrentUser()
  return isAdmin(currentUser)
}

// 공지사항 작성 권한 (관리자만 가능)
export function canCreateNotice(user: any = null): boolean {
  const currentUser = user || getCurrentUser()
  return isAdmin(currentUser)
}

// 특정 사용자에게 관리자 권한 자동 부여 (시스템 초기화용)
export function grantAdminToSpecificUser(): { success: boolean; message: string } {
  const targetEmail = 'taylorr@glcass.ice.go.kr'
  const users = getUsers()
  const targetUserIndex = users.findIndex((u: any) => u.email === targetEmail)
  
  if (targetUserIndex === -1) {
    console.log(`⚠️ 사용자 ${targetEmail}이 아직 가입하지 않았습니다. 가입 후 자동으로 관리자 권한이 부여됩니다.`)
    return { success: false, message: `사용자 ${targetEmail}이 아직 가입하지 않았습니다.` }
  }

  if (users[targetUserIndex].role === 'ADMIN') {
    console.log(`✅ 사용자 ${targetEmail}은 이미 관리자 권한을 가지고 있습니다.`)
    return { success: true, message: `${targetEmail}은 이미 관리자 권한을 가지고 있습니다.` }
  }

  users[targetUserIndex].role = 'ADMIN'
  saveUsers(users)
  
  console.log(`🎉 사용자 ${targetEmail}에게 관리자 권한이 부여되었습니다!`)
  return { success: true, message: `${targetEmail}에게 관리자 권한이 부여되었습니다.` }
}