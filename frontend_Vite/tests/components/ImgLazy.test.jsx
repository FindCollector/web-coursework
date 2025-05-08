import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ImgLazy from '../../src/components/ImgLazy';

// 模拟IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.entries = [];
    this.observe = vi.fn();
    this.disconnect = vi.fn();
    this.unobserve = vi.fn();
  }

  simulateIntersection(isIntersecting) {
    this.entries = [{ isIntersecting, target: {} }];
    this.callback(this.entries, this);
  }
}

global.IntersectionObserver = IntersectionObserverMock;

describe('ImgLazy Component', () => {
  const originalSrc = 'https://example.com/image.jpg';
  const altText = '测试图片';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders placeholder initially', () => {
    render(<ImgLazy src={originalSrc} alt={altText} />);
    
    // 验证图片的初始状态是未加载
    const image = screen.getByAltText(altText);
    expect(image).toBeInTheDocument();
    expect(image.src).not.toContain(originalSrc);
    expect(image.classList.contains('opacity-0')).toBeTruthy();
  });

  test('loads image when it enters viewport', async () => {
    render(<ImgLazy src={originalSrc} alt={altText} />);
    
    // 获取组件实例的IntersectionObserver
    const observer = global.IntersectionObserver.mock.instances[0];
    
    // 模拟元素进入视口
    observer.simulateIntersection(true);
    
    // 验证图片加载
    const image = screen.getByAltText(altText);
    
    // 模拟图片加载完成
    image.dispatchEvent(new Event('load'));
    
    await waitFor(() => {
      expect(image.src).toContain(originalSrc);
      expect(image.classList.contains('opacity-100')).toBeTruthy();
    });
  });

  test('handles image load error', async () => {
    render(<ImgLazy src={originalSrc} alt={altText} />);
    
    // 获取组件实例的IntersectionObserver
    const observer = global.IntersectionObserver.mock.instances[0];
    
    // 模拟元素进入视口
    observer.simulateIntersection(true);
    
    const image = screen.getByAltText(altText);
    
    // 模拟图片加载失败
    image.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(image.src).not.toContain(originalSrc);
    });
  });

  test('applies custom className', () => {
    const customClass = 'custom-class';
    render(<ImgLazy src={originalSrc} alt={altText} className={customClass} />);
    
    const image = screen.getByAltText(altText);
    expect(image.classList.contains(customClass)).toBeTruthy();
  });
}); 