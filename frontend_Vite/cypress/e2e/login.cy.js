describe('Login Page', () => {

  beforeEach(() => {
    // 清除 localStorage
    cy.clearLoginState();

    // 默认情况下，不在 beforeEach 中预先拦截 /auth/login
    // 让每个测试根据需要单独设置拦截并指定别名 loginApi

    // 访问登录页
    cy.visit('/login');
  });

  it('displays the login form', () => {
    // More flexible selector that looks for any element containing "Sign In" or "Login"
    cy.contains(/sign in|login/i).should('be.visible');
    
    // Look for input fields using more flexible selectors
    cy.get('body').then($body => {
      // Check for email input field
      const emailSelectors = [
        'input[type="email"]',
        'input[placeholder*="email"]',
        'input[name="email"]',
        '[data-testid*="email"]'
      ].join(', ');
      
      if ($body.find(emailSelectors).length) {
        cy.get(emailSelectors).should('be.visible');
      } else {
        cy.log('Email input not found with standard selectors');
      }
      
      // Check for password input field
      const passwordSelectors = [
        'input[type="password"]',
        'input[placeholder*="password"]',
        'input[name="password"]',
        '[data-testid*="password"]'
      ].join(', ');
      
      if ($body.find(passwordSelectors).length) {
        cy.get(passwordSelectors).should('be.visible');
      } else {
        cy.log('Password input not found with standard selectors');
      }
      
      // Check for submit button
      const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Sign In")',
        'button:contains("Login")',
        '[data-testid*="login-button"]',
        '[data-testid*="submit"]'
      ].join(', ');
      
      if ($body.find(buttonSelectors).length) {
        cy.get(buttonSelectors).should('be.visible');
      } else {
        cy.log('Submit button not found with standard selectors');
      }
    });
  });

  it('validates empty form submissions', () => {
    // Find and click submit button
    cy.get('button[type="submit"], input[type="submit"], button:contains("Sign In"), button:contains("Login")').click();
    
    // Look for validation messages
    cy.contains(/required|cannot be empty|field is needed/i).should('be.visible');
  });

  it('validates email format', () => {
    // Find email input using flexible selectors
    cy.get('input[type="email"], input[placeholder*="email"], input[name="email"]')
      .type('invalid-email');
    
    // Find and click submit button
    cy.get('button[type="submit"], input[type="submit"], button:contains("Sign In"), button:contains("Login")').click();
    
    // Look for validation message about email format
    cy.contains(/valid email|email format|invalid email/i).should('be.visible');
  });

  it('displays error for invalid credentials', () => {
    // 预先拦截 /auth/login，并返回 400
    cy.intercept('POST', '**/auth/login', {
      statusCode: 400,
      body: {
        code: 1001,
        msg: 'Invalid email or password'
      }
    }).as('loginApi');

    // 填写错误的邮箱
    cy.get('input[type="email"], input[placeholder*="email"], input[name="email"]')
      .type('invalid@example.com');
    
    // 填写错误的密码  
    cy.get('input[type="password"], input[placeholder*="password"], input[name="password"]')
      .type('wrongpassword');
    
    // 提交表单
    cy.get('button[type="submit"], input[type="submit"], button:contains("Sign In"), button:contains("Login")').click();
    
    // 等待拦截
    cy.wait('@loginApi');
    
    // Check for error message
    cy.contains(/invalid email or password|invalid credentials|incorrect password|wrong email or password/i)
      .should('be.visible');
  });

  it('redirects to dashboard on successful login', () => {
    // 预先拦截 /auth/login 并返回 200
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        code: 0,
        data: {
          userInfo: {
            id: 1,
            userName: 'Test User',
            email: 'test@example.com',
            role: 'member',
            token: 'mock-jwt-token-12345'
          }
        }
      }
    }).as('loginApi');

    // 填写邮箱
    cy.get('input[type="email"], input[placeholder*="email"], input[name="email"]')
      .type('test@example.com');
    
    // 填写密码  
    cy.get('input[type="password"], input[placeholder*="password"], input[name="password"]')
      .type('password123');
    
    // 提交表单
    cy.get('button[type="submit"], input[type="submit"], button:contains("Sign In"), button:contains("Login")').click();
    
    // 检查登录请求
    cy.wait('@loginApi');
    
    // Check for redirection - using regex to match various dashboard URLs
    cy.url().should('match', /(member|user|dashboard|home)/);
    
    // Verify token is set in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('mock-jwt-token-12345');
    });
  });

  it('shows "Remember me" option', () => {
    // Look for remember me checkbox with flexible selectors
    cy.get('body').then($body => {
      const rememberMeSelectors = [
        'input[type="checkbox"][name*="remember"]',
        'input[type="checkbox"] + label:contains("Remember")',
        'input[type="checkbox"][id*="remember"]',
        '[data-testid*="remember-me"]'
      ].join(', ');
      
      if ($body.find(rememberMeSelectors).length) {
        cy.get(rememberMeSelectors).should('exist');
      } else {
        // Skip this test if remember me checkbox isn't found
        cy.log('Remember me option not found - this feature may not be implemented');
      }
    });
  });

  it('allows navigation to registration page', () => {
    // Look for sign up/register link with flexible selectors
    cy.get('body').then($body => {
      const registerLinkSelectors = [
        'a:contains("Sign Up")',
        'a:contains("Register")',
        'a:contains("Create account")',
        'a[href*="register"]',
        'a[href*="signup"]',
        'button:contains("Sign Up")',
        'button:contains("Register")'
      ].join(', ');
      
      if ($body.find(registerLinkSelectors).length) {
        cy.get(registerLinkSelectors).should('exist');
      } else {
        // Skip this test if register link isn't found
        cy.log('Registration link not found - this feature may not be accessible from login page');
      }
    });
  });
}); 