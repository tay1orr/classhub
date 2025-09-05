-- ClassHub 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 먼저 기존 todos 테이블 삭제 (필요시)
-- DROP TABLE IF EXISTS todos;

-- Enums 생성
CREATE TYPE user_role AS ENUM ('ADMIN', 'MOD', 'STUDENT');
CREATE TYPE board_type AS ENUM ('FREE', 'ASSIGNMENT', 'EXAM');
CREATE TYPE report_status AS ENUM ('OPEN', 'HOLD', 'REJECT', 'ACTION');
CREATE TYPE notification_type AS ENUM ('NEW_COMMENT', 'POST_LIKED', 'POST_PINNED', 'REPORT_RESOLVED', 'MENTION');
CREATE TYPE target_type AS ENUM ('POST', 'COMMENT');

-- Users 테이블 (Supabase auth와 별도)
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,
    role user_role DEFAULT 'STUDENT',
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classrooms 테이블
CREATE TABLE classrooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    grade INTEGER NOT NULL,
    class_no INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(grade, class_no)
);

-- User-Classroom 매핑
CREATE TABLE user_classrooms (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    classroom_id TEXT REFERENCES classrooms(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, classroom_id)
);

-- Boards 테이블
CREATE TABLE boards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key board_type UNIQUE NOT NULL,
    name TEXT NOT NULL
);

-- Posts 테이블
CREATE TABLE posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    board_id TEXT REFERENCES boards(id) NOT NULL,
    classroom_id TEXT REFERENCES classrooms(id) NOT NULL,
    author_id TEXT REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tags 테이블
CREATE TABLE tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL
);

-- Post-Tag 매핑
CREATE TABLE post_tags (
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Comments 테이블
CREATE TABLE comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    author_id TEXT REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Votes 테이블
CREATE TABLE votes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
    comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id, comment_id)
);

-- 인덱스 생성
CREATE INDEX idx_posts_board_classroom ON posts(board_id, classroom_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_pinned_created ON posts(is_pinned, created_at);
CREATE INDEX idx_comments_post ON comments(post_id);

-- 초기 데이터 삽입
INSERT INTO boards (key, name) VALUES 
    ('FREE', '자유게시판'),
    ('ASSIGNMENT', '수행평가'),
    ('EXAM', '지필평가');

INSERT INTO classrooms (grade, class_no, name) VALUES 
    (1, 6, '1-6'),
    (1, 7, '1-7');

-- 테스트 사용자 생성 (비밀번호: password123)
INSERT INTO users (email, name, password_hash, role) VALUES 
    ('admin@classhub.kr', '김교사', '$2a$12$rQZ8YnKKJJpGUWlVf8i6qedZlH4mNJz7VYVPzj8YbC3N2xF8xo8SK', 'ADMIN'),
    ('student1@classhub.kr', '이학생', '$2a$12$rQZ8YnKKJJpGUWlVf8i6qedZlH4mNJz7VYVPzj8YbC3N2xF8xo8SK', 'STUDENT');

COMMIT;