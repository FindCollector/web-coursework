import { render, screen } from '@testing-library/react';
import PageTransition from '../../src/components/PageTransition';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

// 模拟Framer Motion
vi.mock('framer-motion', () => {
  return {
    motion: {
      div: ({ children, ...props }) => (
        <div data-testid="motion-div" {...props}>
          {children}
        </div>
      ),
    },
    AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>,
  };
});

describe('PageTransition Component', () => {
  test('renders children', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PageTransition>
                <div data-testid="child-content">Test Content</div>
              </PageTransition>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // 验证子内容是否渲染
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders with AnimatePresence and motion.div', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PageTransition>
                <div>Test Content</div>
              </PageTransition>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // 验证动画包装器组件是否正确渲染
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  test('applies transition properties to motion div', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PageTransition>
                <div>Test Content</div>
              </PageTransition>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const motionDiv = screen.getByTestId('motion-div');
    
    // 验证motion.div上是否包含必要的class
    expect(motionDiv.className).toContain('min-h-full');
    
    // 验证子内容是否在motion.div内部
    expect(motionDiv.textContent).toBe('Test Content');
  });
}); 