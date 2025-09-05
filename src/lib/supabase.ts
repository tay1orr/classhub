import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofcvpbucylqtmdpaeizt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY3ZwYnVjeWxxdG1kcGFlaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjI5MzAsImV4cCI6MjA3MjQzODkzMH0.kvS2lBldEinltZkVmzcdbdQOs3hr19G9lWCxtNz29YA'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key 길이:', supabaseAnonKey.length)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 테스트 함수
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('todos').select('*').limit(1)
    if (error) {
      console.log('연결 테스트:', error.message)
      return false
    }
    console.log('✅ Supabase 연결 성공!')
    return true
  } catch (err) {
    console.log('연결 오류:', err)
    return false
  }
}