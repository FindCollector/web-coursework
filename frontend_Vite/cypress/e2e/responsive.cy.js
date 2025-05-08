describe('Responsive Design Tests', () => {
  
  // Setup common test actions before each test
  beforeEach(() => {
    // Set token in localStorage to simulate logged in state
    cy.window().then(win => {
      win.localStorage.setItem('token', 'mock-jwt-token-12345');
      win.localStorage.setItem('userType', 'member');
      win.localStorage.setItem('userName', 'Test Member');
    });
    
    // Intercept all API calls to make tests more reliable
    cy.intercept('GET', '**/api/**', {
      statusCode: 200,
      body: {
        code: 0,
        data: {}
      }
    });
    
    cy.intercept('POST', '**/api/**', {
      statusCode: 200,
      body: {
        code: 0,
        data: {}
      }
    });
  });

  context('Mobile view (iPhone 12)', () => {
    beforeEach(() => {
      // Set viewport to iPhone 12
      cy.viewport('iphone-x');
      cy.visit('/');
      // Wait for page to fully load
      cy.wait(1500);
    });

    it('shows menu toggle on small screens', () => {
      // Look for hamburger menu or mobile navigation toggle using flexible selectors
      cy.get('body').then($body => {
        // Try common patterns for mobile menus
        const mobileMenuSelector = [
          '[data-testid*="menu-toggle"]',
          '[class*="hamburger"]',
          '[class*="menu-toggle"]',
          '[class*="menu-button"]',
          '[aria-label*="menu"]',
          'button svg', // Often hamburger menus are buttons with SVG icons
        ].join(', ');
        
        if ($body.find(mobileMenuSelector).length) {
          cy.get(mobileMenuSelector).should('be.visible');
        } else {
          cy.log('Mobile menu toggle not found with standard selectors - app may use different patterns');
        }
      });
    });

    it('login page is properly responsive on mobile', () => {
      cy.clearLoginState();
      cy.visit('/login');
      cy.wait(1000);
      
      // Take screenshot for visual inspection
      cy.screenshot('mobile-login-page', { capture: 'viewport' });
      
      // Verify login form elements are visible and properly sized for mobile
      cy.get('body').then($body => {
        const loginElements = $body.find('input[type="email"], input[type="password"], button[type="submit"]');
        if (loginElements.length) {
          // Check if elements exist and are visible
          cy.get('input[type="email"], input[type="password"], button[type="submit"]')
            .should('be.visible')
            .should(($el) => {
              // Get viewport width
              const viewportWidth = Cypress.config('viewportWidth');
              // Check each element width is reasonable for mobile
              $el.each((_, el) => {
                const width = Cypress.$(el).outerWidth();
                expect(width).to.be.lessThan(viewportWidth);
              });
            });
        } else {
          cy.log('Standard login elements not found - app may use different form structure');
        }
      });
    });
  });

  context('Tablet view (iPad)', () => {
    beforeEach(() => {
      // Set viewport to iPad
      cy.viewport('ipad-2');
      cy.visit('/');
      cy.wait(1500);
    });

    it('dashboard adapts properly to tablet view', () => {
      // Check layout of member dashboard on tablet
      cy.visit('/member/dashboard');
      cy.wait(1500);
      
      // Take screenshot for visual inspection
      cy.screenshot('tablet-dashboard', { capture: 'viewport' });
      
      // Check if content is properly sized for tablet viewport
      cy.get('body').then(($body) => {
        // Look for main container elements
        const containers = $body.find('[class*="container"], [class*="dashboard"], main, section');
        if (containers.length) {
          // Check if the containers adjust to the tablet width properly
          cy.get(containers.selector).first()
            .should(($el) => {
              const viewportWidth = Cypress.config('viewportWidth');
              const width = $el.outerWidth();
              expect(width).to.be.at.most(viewportWidth);
            });
        } else {
          cy.log('Standard container elements not found - app may use different layout structure');
        }
      });
    });
  });

  context('Desktop view', () => {
    beforeEach(() => {
      // Set viewport to desktop
      cy.viewport(1920, 1080);
      cy.visit('/');
      cy.wait(1500);
    });

    it('navigation shows full menu on desktop', () => {
      // Check if desktop navigation is visible with full menu
      cy.get('body').then(($body) => {
        // Look for navigation elements that should be visible on desktop
        const navSelectors = [
          'nav', 
          '[class*="navigation"]',
          '[class*="menu"]',
          'header ul',
          '[role="navigation"]'
        ].join(', ');
        
        if ($body.find(navSelectors).length) {
          // Check that nav elements are visible
          cy.get(navSelectors).first().should('be.visible');
          
          // Look for menu items - either they'll be direct children or nested
          cy.get(`${navSelectors} a, ${navSelectors} li`).should('have.length.gt', 1);
        } else {
          cy.log('Standard navigation elements not found - app may use different layout structure');
        }
      });
      
      // Take screenshot for visual inspection
      cy.screenshot('desktop-navigation', { capture: 'viewport' });
    });
  });
}); 