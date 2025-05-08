/// <reference types="cypress" />

describe('用户资料页面', () => {
  beforeEach(() => {
    // 模拟用户登录状态
    cy.fixture('user').then((user) => {
      window.localStorage.setItem('token', user.token);
      window.localStorage.setItem('user', JSON.stringify(user.data));
    });
    
    // 直接访问用户资料页
    cy.visit('/profile');
  });
  
  it('能够正确加载个人资料页面', () => {
    // 验证页面标题和关键元素
    cy.contains('个人资料').should('be.visible');
    cy.get('form').should('exist');
  });
  
  it('显示用户的当前资料信息', () => {
    // 验证表单中预填充了用户信息
    cy.fixture('user').then((user) => {
      if (user.data.name) {
        cy.get('input[name="name"]').should('have.value', user.data.name);
      }
      
      if (user.data.email) {
        cy.get('input[name="email"]').should('have.value', user.data.email);
      }
      
      if (user.data.phone) {
        cy.get('input[name="phone"]').should('have.value', user.data.phone);
      }
    });
  });
  
  it('应该能够更新用户资料', () => {
    // 修改表单字段
    const updatedName = '张三更新';
    const updatedPhone = '13800138001';
    
    cy.get('input[name="name"]').clear().type(updatedName);
    cy.get('input[name="phone"]').clear().type(updatedPhone);
    
    // 提交表单
    cy.get('button[type="submit"]').click();
    
    // 验证成功消息
    cy.contains('资料已更新').should('be.visible');
    
    // 验证API调用
    cy.wait('@updateProfile').its('request.body').should('include', {
      name: updatedName,
      phone: updatedPhone
    });
  });
  
  it('处理表单验证错误', () => {
    // 清除必填字段
    cy.get('input[name="name"]').clear();
    
    // 提交表单
    cy.get('button[type="submit"]').click();
    
    // 验证错误消息
    cy.contains('姓名不能为空').should('be.visible');
  });
  
  it('显示用户头像并支持上传', () => {
    // 检查头像元素
    cy.get('[data-testid="avatar-upload"]').should('exist');
    
    // 上传新头像
    cy.get('input[type="file"]').attachFile('test-avatar.jpg');
    
    // 验证上传成功
    cy.contains('头像上传成功').should('be.visible');
    
    // 验证API调用
    cy.wait('@uploadAvatar').its('response.statusCode').should('eq', 200);
  });
  
  it('导航到其他个人设置页面', () => {
    // 测试页面内部导航
    cy.contains('安全设置').click();
    cy.url().should('include', '/profile/security');
    
    cy.contains('通知设置').click();
    cy.url().should('include', '/profile/notifications');
  });
}); 