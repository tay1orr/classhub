// ====================================================
// 학급 설정 파일
// 학년/반이 바뀔 때 이 파일만 수정하면 됩니다.
// ====================================================

export const CLASS_CONFIG = {
  grade: 1,
  classNo: 7,
  slug: '1-7',               // URL에 사용되는 경로 (/1-7/)
  displayName: '1학년 7반',
  schoolName: '우리 학교',

  // 관리자 이메일 목록 (자동 승인 + ADMIN 권한 부여)
  adminEmails: [
    'taylorr@gclass.ice.go.kr',
  ],
} as const

export type ClassConfig = typeof CLASS_CONFIG
