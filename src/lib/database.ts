// Supabase를 사용한 실제 데이터베이스 연결
import { supabase } from './supabase'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
  created_at: string
}

// 회원가입
export async function registerUser(userData: {
  name: string
  email: string
  password: string
}): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    // 이메일 중복 확인
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('email')
      .eq('email', userData.email)
      .single()

    if (existingUser) {
      return { success: false, message: '이미 가입된 이메일입니다.' }
    }

    // 새 사용자 생성
    const { data: newUser, error } = await supabase
      .from('app_users')
      .insert([{
        name: userData.name,
        email: userData.email,
        password: userData.password, // 실제 프로덕션에서는 해시화 필요
        role: 'STUDENT'
      }])
      .select()
      .single()

    if (error) {
      console.error('회원가입 오류:', error)
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' }
    }

    return { 
      success: true, 
      message: '회원가입이 완료되었습니다!', 
      user: newUser 
    }

  } catch (error) {
    console.error('회원가입 예외:', error)
    return { success: false, message: `회원가입 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }
  }
}

// 로그인
export async function loginUser(
  email: string, 
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !user) {
      return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }

    return { 
      success: true, 
      message: '로그인 성공!', 
      user 
    }

  } catch (error) {
    console.error('로그인 예외:', error)
    return { success: false, message: '로그인 중 오류가 발생했습니다.' }
  }
}

// 현재 사용자 세션 관리 (로컬 스토리지 사용)
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('classhub_current_user')
  return userStr ? JSON.parse(userStr) : null
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem('classhub_current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('classhub_current_user')
  }
}

export function logout(): void {
  setCurrentUser(null)
}