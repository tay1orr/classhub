const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ofcvpbucylqtmdpaeizt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY3ZwYnVjeWxxdG1kcGFlaXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjI5MzAsImV4cCI6MjA3MjQzODkzMH0.kvS2lBldEinltZkVmzcdbdQOs3hr19G9lWCxtNz29YA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🔧 데이터베이스 설정 시작...')

  try {
    // 1. 간단한 사용자 테이블 생성 시도
    const { data, error } = await supabase.rpc('create_users_table')
    
    if (error) {
      console.log('❌ RPC 사용 불가:', error.message)
      console.log('ℹ️  수동으로 SQL을 실행해야 합니다.')
    } else {
      console.log('✅ 테이블 생성 성공!')
    }

    // 2. 테이블 존재 확인
    const { data: tables, error: listError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (!listError && tables) {
      console.log('📋 현재 테이블 목록:')
      tables.forEach(table => console.log(`  - ${table.table_name}`))
    }

  } catch (err) {
    console.log('❌ 연결 실패:', err.message)
    console.log('\n📝 수동 설정이 필요합니다:')
    console.log('1. Supabase 대시보드 → SQL Editor')
    console.log('2. supabase-schema.sql 파일 내용 복사 → 실행')
  }
}

setupDatabase()