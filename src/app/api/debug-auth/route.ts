import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Auth debug endpoint',
    instructions: {
      reset: 'Send POST request to reset localStorage data',
      defaultUser: {
        email: 'admin@classhub.co.kr',
        password: 'admin123!',
        name: '관리자',
        role: 'ADMIN'
      }
    }
  });
}

export async function POST() {
  // localStorage 초기화 스크립트 반환
  const resetScript = `
    <html>
    <head><title>LocalStorage Reset</title></head>
    <body>
      <h2>LocalStorage Reset for ClassHub</h2>
      <button onclick="resetAuth()">Reset Auth Data</button>
      <button onclick="checkAuth()">Check Current Auth</button>
      <div id="result"></div>
      
      <script>
        function resetAuth() {
          localStorage.clear();
          const defaultUsers = [{
            id: '1',
            name: '관리자',
            email: 'admin@classhub.co.kr',
            password: 'admin123!',
            role: 'ADMIN'
          }];
          localStorage.setItem('classhub_users', JSON.stringify(defaultUsers));
          document.getElementById('result').innerHTML = 
            '<p style="color: green;">✅ Auth data reset successfully!</p>' +
            '<p>Now try logging in with: admin@classhub.co.kr / admin123!</p>' +
            '<p><a href="/login">Go to Login Page</a></p>';
        }
        
        function checkAuth() {
          const users = localStorage.getItem('classhub_users');
          const currentUser = localStorage.getItem('classhub_current_user');
          document.getElementById('result').innerHTML = 
            '<pre>Users: ' + users + '</pre>' +
            '<pre>Current: ' + currentUser + '</pre>';
        }
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(resetScript, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}