import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';
import DraggableTag from '../../src/components/DraggableTag.jsx';

// 工具函数：用 TestBackend 包裹以绕开浏览器 Drag API 依赖
const renderWithDnd = (ui) => {
  return render(<DndProvider backend={TestBackend}>{ui}</DndProvider>);
};

describe('DraggableTag component', () => {
  it('renders tag with correct text', () => {
    const mockTag = { id: 1, tagName: 'Yoga' };
    
    renderWithDnd(
      <DraggableTag
        tag={mockTag}
        index={0}
        type="coach"
        onMove={() => {}}
        onRemove={() => {}}
      />
    );
    
    // 验证标签名称显示正确
    expect(screen.getByText('Yoga')).toBeInTheDocument();
  });
  
  it('calls onRemove when close button is clicked', () => {
    const mockTag = { id: 42, tagName: 'Pilates' };
    const mockOnRemove = vi.fn(); // 使用 Vitest 的 mock 函数跟踪调用
    
    renderWithDnd(
      <DraggableTag
        tag={mockTag}
        index={0}
        type="member"
        onMove={() => {}}
        onRemove={mockOnRemove}
      />
    );
    
    // 找到关闭按钮并点击
    const closeButton = screen.getByRole('img', { name: /close/i });
    fireEvent.click(closeButton);
    
    // 验证 onRemove 被调用，且参数正确
    expect(mockOnRemove).toHaveBeenCalledTimes(1);
    expect(mockOnRemove).toHaveBeenCalledWith(42, 'member');
  });
  
  it('does not render close button when onRemove is not provided', () => {
    const mockTag = { id: 3, tagName: 'CrossFit' };
    
    renderWithDnd(
      <DraggableTag
        tag={mockTag}
        index={0}
        type="coach"
        onMove={() => {}}
        // 不提供 onRemove
      />
    );
    
    // 验证没有关闭按钮
    const closeButton = screen.queryByRole('img', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });
}); 