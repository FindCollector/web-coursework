// ***********************************************
// Custom commands for Cypress
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command
Cypress.Commands.add('login', (userType = 'default') => {
  cy.fixture('user').then((userData) => {
    window.localStorage.setItem('token', userData.token);
    window.localStorage.setItem('user', JSON.stringify(userData.data));
  });
});

// Force clear local storage and cookies
Cypress.Commands.add('clearLoginState', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then(win => {
    win.sessionStorage.clear();
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('userType');
    win.localStorage.removeItem('userName');
  });
});

// Wait for loading state to complete (for animations, etc)
Cypress.Commands.add('waitForLoadingToComplete', () => {
  // Check if loading overlay exists before attempting to wait for it
  cy.get('body').then($body => {
    if ($body.find('.loading-overlay').length) {
      cy.get('.loading-overlay').should('not.be.visible');
    }
  });
});

// Useful command for responsive testing
Cypress.Commands.add('setViewport', (size) => {
  const sizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 }
  };
  
  const viewport = sizes[size] || size;
  cy.viewport(viewport.width, viewport.height);
});

// 添加新命令：记录DOM并截图
Cypress.Commands.add('logPageContent', (name) => {
  cy.log(`**当前页面内容 (${name})**`);
  cy.get('body').then(($body) => {
    const html = $body.html();
    cy.log(`页面结构: ${html.substring(0, 500)}...`);
    cy.screenshot(`debug-${name}-${Date.now()}`);
  });
});

// 添加自定义命令：模拟API请求
Cypress.Commands.add('mockProfileApi', () => {
  // 模拟获取个人资料接口
  cy.intercept('GET', '/api/user/profile', {
    statusCode: 200,
    fixture: 'user'
  }).as('getProfile');
  
  // 模拟更新个人资料接口
  cy.intercept('PUT', '/api/user/profile', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        success: true,
        message: '资料已更新',
        data: {
          ...req.body
        }
      }
    });
  }).as('updateProfile');
  
  // 模拟头像上传接口
  cy.intercept('POST', '/api/user/avatar', {
    statusCode: 200,
    body: {
      success: true,
      message: '头像上传成功',
      data: {
        avatar_url: 'https://example.com/avatars/updated.jpg'
      }
    }
  }).as('uploadAvatar');
});

// 添加自定义命令：检查HTML元素可访问性
Cypress.Commands.add('checkA11y', (element) => {
  cy.get(element)
    .should('have.attr', 'role')
    .should('have.attr', 'aria-label');
}); 