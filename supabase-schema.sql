-- ClassHub Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Users table (compatible with Prisma schema)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    "passwordHash" TEXT,
    role TEXT DEFAULT 'STUDENT',
    image TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (NextAuth)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, "providerAccountId")
);

-- Sessions table (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Verification tokens (NextAuth)
CREATE TABLE IF NOT EXISTS verificationtokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    UNIQUE(identifier, token)
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    grade INTEGER NOT NULL,
    "classNo" INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(grade, "classNo")
);

-- User-Classroom junction table
CREATE TABLE IF NOT EXISTS user_classrooms (
    "userId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    PRIMARY KEY ("userId", "classroomId"),
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("classroomId") REFERENCES classrooms(id) ON DELETE CASCADE
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "boardId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "isAnonymous" BOOLEAN DEFAULT FALSE,
    "isPinned" BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ,
    FOREIGN KEY ("boardId") REFERENCES boards(id),
    FOREIGN KEY ("classroomId") REFERENCES classrooms(id),
    FOREIGN KEY ("authorId") REFERENCES users(id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    content TEXT NOT NULL,
    "isAnonymous" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ,
    FOREIGN KEY ("postId") REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY ("authorId") REFERENCES users(id)
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS posts_boardId_classroomId_idx ON posts("boardId", "classroomId");
CREATE INDEX IF NOT EXISTS posts_createdAt_idx ON posts("createdAt");
CREATE INDEX IF NOT EXISTS posts_isPinned_createdAt_idx ON posts("isPinned", "createdAt");
CREATE INDEX IF NOT EXISTS comments_postId_idx ON comments("postId");

-- Insert initial data
INSERT INTO boards (id, key, name) VALUES 
    ('board_free', 'FREE', '자유게시판'),
    ('board_assignment', 'ASSIGNMENT', '수행평가'),
    ('board_exam', 'EXAM', '지필평가')
ON CONFLICT (key) DO NOTHING;

INSERT INTO classrooms (id, grade, "classNo", name) VALUES 
    ('classroom_1_8', 1, 8, '1학년 8반')
ON CONFLICT (grade, "classNo") DO NOTHING;

-- Insert admin user (password: admin123!)
INSERT INTO users (id, email, name, "passwordHash", role) VALUES 
    ('user_admin', 'admin@classhub.co.kr', '관리자', '$2a$10$rF8Zx7z8Z8Z8Z8Z8Z8Z8Z.Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Add admin to classroom
INSERT INTO user_classrooms ("userId", "classroomId") VALUES 
    ('user_admin', 'classroom_1_8')
ON CONFLICT ("userId", "classroomId") DO NOTHING;

-- Insert welcome post
INSERT INTO posts (id, "boardId", "classroomId", "authorId", title, content, "isPinned") VALUES 
    ('post_welcome', 'board_free', 'classroom_1_8', 'user_admin', 
     '🎉 우리반 커뮤니티에 오신 것을 환영합니다!',
     '안녕하세요 여러분! 

1학년 8반만의 특별한 소통 공간이 만들어졌어요. 
여기서 자유롭게 이야기하고, 과제 정보도 공유하고, 시험 자료도 함께 나눠요! 

궁금한 것이 있으면 언제든 글을 올려주세요 😊',
     true)
ON CONFLICT (id) DO NOTHING;