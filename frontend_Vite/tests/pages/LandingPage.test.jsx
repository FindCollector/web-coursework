import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from '../../src/pages/LandingPage';
import { BrowserRouter } from 'react-router-dom';

// 模拟react-router-dom的useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('LandingPage Component', () => {
  const renderLandingPage = () => {
    return render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  };

  it('renders hero section with title', () => {
    renderLandingPage();
    
    // 检查标题是否存在
    expect(screen.getByText(/健康生活从这里开始/i)).toBeInTheDocument();
  });
  
  it('renders call-to-action buttons', () => {
    renderLandingPage();
    
    // 检查按钮是否存在
    const loginButton = screen.getByRole('button', { name: /登录/i });
    const registerButton = screen.getByRole('button', { name: /注册/i });
    
    expect(loginButton).toBeInTheDocument();
    expect(registerButton).toBeInTheDocument();
  });
  
  it('renders features section', () => {
    renderLandingPage();
    
    // 检查特性部分是否存在
    expect(screen.getByText(/特色服务/i)).toBeInTheDocument();
    
    // 检查是否包含至少三个特性卡片
    const featureCards = screen.getAllByTestId('feature-card');
    expect(featureCards.length).toBeGreaterThanOrEqual(3);
  });
  
  it('renders testimonials section', () => {
    renderLandingPage();
    
    // 检查客户评价部分是否存在
    expect(screen.getByText(/客户反馈/i)).toBeInTheDocument();
    
    // 检查是否包含评价卡片
    const testimonialCards = screen.getAllByTestId('testimonial-card');
    expect(testimonialCards.length).toBeGreaterThan(0);
  });
  
  it('renders footer with contact information', () => {
    renderLandingPage();
    
    // 检查页脚是否存在
    const footer = screen.getByTestId('landing-footer');
    expect(footer).toBeInTheDocument();
    
    // 检查页脚是否包含联系信息
    expect(screen.getByText(/联系我们/i)).toBeInTheDocument();
  });
}); 