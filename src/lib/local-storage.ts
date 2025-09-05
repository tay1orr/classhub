// 로컬 스토리지를 사용한 임시 데이터 저장

export interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export interface Post {
  id: string
  title: string
  content: string
  author: string
  isAnonymous: boolean
  board: 'free' | 'assignment' | 'exam'
  classroom: string
  views: number
  likes: number
  comments: number
  createdAt: string
  tags: string[]
}

class LocalStorage {
  private getUsers(): User[] {
    if (typeof window === 'undefined') return []
    const users = localStorage.getItem('classhub_users')
    return users ? JSON.parse(users) : []
  }

  private setUsers(users: User[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('classhub_users', JSON.stringify(users))
  }

  private getPosts(): Post[] {
    if (typeof window === 'undefined') return []
    const posts = localStorage.getItem('classhub_posts')
    return posts ? JSON.parse(posts) : this.getDefaultPosts()
  }

  private setPosts(posts: Post[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('classhub_posts', JSON.stringify(posts))
  }

  private getDefaultPosts(): Post[] {
    return [
      {
        id: '1',
        title: '점심시간 동아리 모집합니다',
        content: '코딩동아리에서 새로운 멤버를 모집하고 있어요. 관심있는 분들 연락주세요!',
        author: '익명',
        isAnonymous: true,
        board: 'free',
        classroom: '1-6',
        views: 45,
        likes: 12,
        comments: 8,
        createdAt: '2024.03.15 14:30',
        tags: ['동아리', '모집']
      },
      {
        id: '2',
        title: '내일 수학 시험 범위 질문있어요',
        content: '수학 선생님이 알려주신 범위가 정확히 어디까지인지 아시는 분 있나요?',
        author: '김학생',
        isAnonymous: false,
        board: 'free',
        classroom: '1-6',
        views: 78,
        likes: 5,
        comments: 15,
        createdAt: '2024.03.15 13:45',
        tags: ['수학', '시험']
      }
    ]
  }

  // 사용자 관련 메서드
  async registerUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers()
    
    // 이메일 중복 확인
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: '이미 가입된 이메일입니다.' }
    }

    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    this.setUsers(users)

    return { success: true, message: '회원가입이 완료되었습니다!', user: newUser }
  }

  async loginUser(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers()
    const user = users.find(u => u.email === email && u.password === password)

    if (user) {
      return { success: true, message: '로그인 성공!', user }
    }

    return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  // 게시글 관련 메서드
  getPosts(board?: string, classroom?: string): Post[] {
    let posts = this.getPosts()
    
    if (board) {
      posts = posts.filter(p => p.board === board)
    }
    
    if (classroom) {
      posts = posts.filter(p => p.classroom === classroom)
    }

    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  addPost(postData: Omit<Post, 'id' | 'views' | 'likes' | 'comments' | 'createdAt'>): Post {
    const posts = this.getPosts()
    
    const newPost: Post = {
      id: Date.now().toString(),
      ...postData,
      views: 0,
      likes: 0,
      comments: 0,
      createdAt: new Date().toLocaleString('ko-KR')
    }

    posts.push(newPost)
    this.setPosts(posts)

    return newPost
  }

  // 현재 로그인된 사용자
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('classhub_current_user')
    return userStr ? JSON.parse(userStr) : null
  }

  setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return
    if (user) {
      localStorage.setItem('classhub_current_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('classhub_current_user')
    }
  }

  logout(): void {
    this.setCurrentUser(null)
  }
}

export const localDB = new LocalStorage()