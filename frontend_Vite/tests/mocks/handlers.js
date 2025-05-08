import { http, HttpResponse } from 'msw';

// 创建模拟的登录API响应处理
export const loginHandlers = [
  // 处理成功登录
  http.post('http://localhost:8080/auth/login', async ({ request }) => {
    const data = await request.json();
    
    // 判断用例认为"成功"的登录凭据
    if (data.email === 'test@example.com' && data.password === 'password123') {
      return HttpResponse.json({
        code: 0,
        msg: 'Success',
        data: {
          userInfo: {
            id: 1,
            userName: 'Test User',
            email: data.email,
            userType: 'member',
            role: 'member',
            token: "mock-jwt-token-12345"
          }
        }
      });
    }
    
    // 模拟错误登录
    return HttpResponse.json({
      code: 1001,
      msg: 'Invalid email or password',
      data: null
    }, { status: 400 });
  }),
  
  // 处理注册API请求
  http.post('http://localhost:8080/auth/register', async ({ request }) => {
    const data = await request.json();
    
    if (!data.email || !data.password) {
      return HttpResponse.json({
        code: 1002,
        msg: 'Missing required fields',
        data: null
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      code: 0, 
      msg: 'Registration successful',
      data: {
        userInfo: {
          id: 999,
          email: data.email,
          userName: data.userName || 'New User',
          userType: data.userType || 'member'
        }
      }
    });
  })
];

// 会员相关API模拟
export const memberHandlers = [
  // 获取健身教练列表示例
  http.get('http://localhost:8080/api/member/coaches', () => {
    return HttpResponse.json({
      code: 0,
      msg: 'Success',
      data: {
        coaches: [
          {
            id: 101,
            userName: 'Coach Smith',
            rating: 4.8,
            specialties: ['Yoga', 'Pilates'],
            avatar: 'avatar1.jpg'
          },
          {
            id: 102,
            userName: 'Coach Johnson',
            rating: 4.9,
            specialties: ['Weight Training', 'HIIT'],
            avatar: 'avatar2.jpg'
          }
        ]
      }
    });
  })
];

// 统一导出所有处理器
export const handlers = [
  ...loginHandlers,
  ...memberHandlers
]; 