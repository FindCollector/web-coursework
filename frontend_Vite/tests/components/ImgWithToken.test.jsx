import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ImgWithToken from '../../src/components/ImgWithToken';
import * as imageUtils from '../../src/utils/imageUtils';

// 模拟imageUtils中的getTokenizedImageUrl函数
vi.mock('../../src/utils/imageUtils', () => ({
  getTokenizedImageUrl: vi.fn()
}));

describe('ImgWithToken Component', () => {
  const testSrc = 'test-image.jpg';
  const testAlt = '测试带令牌的图片';
  const tokenizedUrl = 'https://example.com/image.jpg?token=abc123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // 设置模拟的tokenizedUrl返回值
    imageUtils.getTokenizedImageUrl.mockReturnValue(tokenizedUrl);
  });

  test('renders image with tokenized URL', () => {
    render(<ImgWithToken src={testSrc} alt={testAlt} />);
    
    // 验证图片是否渲染
    const image = screen.getByAltText(testAlt);
    expect(image).toBeInTheDocument();
    
    // 验证getTokenizedImageUrl是否被调用
    expect(imageUtils.getTokenizedImageUrl).toHaveBeenCalledWith(testSrc);
    
    // 验证图片的src是否为tokenized URL
    expect(image.src).toBe(tokenizedUrl);
  });

  test('passes additional props to img element', () => {
    const className = 'custom-class';
    const width = 200;
    const height = 150;
    
    render(
      <ImgWithToken 
        src={testSrc} 
        alt={testAlt} 
        className={className}
        width={width}
        height={height}
      />
    );
    
    const image = screen.getByAltText(testAlt);
    expect(image.className).toContain(className);
    expect(image.width).toBe(width);
    expect(image.height).toBe(height);
  });

  test('renders placeholder when src is not provided', () => {
    imageUtils.getTokenizedImageUrl.mockReturnValue(''); // 模拟空URL

    render(<ImgWithToken alt={testAlt} />);
    
    const image = screen.getByAltText(testAlt);
    expect(image.src).not.toBe(tokenizedUrl);
  });

  test('renders with token refresh when refreshInterval is provided', () => {
    // 模拟计时器函数
    vi.useFakeTimers();
    
    const refreshInterval = 5000; // 5秒
    
    render(<ImgWithToken src={testSrc} alt={testAlt} refreshInterval={refreshInterval} />);
    
    // 初始渲染时调用一次
    expect(imageUtils.getTokenizedImageUrl).toHaveBeenCalledTimes(1);
    
    // 前进5秒，应该再次调用getTokenizedImageUrl
    vi.advanceTimersByTime(refreshInterval);
    expect(imageUtils.getTokenizedImageUrl).toHaveBeenCalledTimes(2);
    
    // 再前进5秒，应该再次调用
    vi.advanceTimersByTime(refreshInterval);
    expect(imageUtils.getTokenizedImageUrl).toHaveBeenCalledTimes(3);
    
    // 恢复真实计时器
    vi.useRealTimers();
  });
}); 