import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';
import TagsContainer from '../../src/components/TagsContainer.jsx';

// 工具函数：用 TestBackend 包裹以绕开浏览器 Drag API 依赖
const renderWithDnd = (ui) => {
  return render(<DndProvider backend={TestBackend}>{ui}</DndProvider>);
};

describe('TagsContainer component', () => {
  it('renders Empty state when tags array is empty (coach type)', () => {
    renderWithDnd(
      <TagsContainer
        title="Coach Tags"
        tags={[]}
        type="coach"
        onMove={() => {}}
        onRemove={() => {}}
      />
    );

    // 测试 Empty 组件中的描述性文本是否出现
    expect(
      screen.getByText(/Drag tags here to add to your profile/i)
    ).toBeInTheDocument();
  });

  it('renders tag items when tags array has data', () => {
    const mockTags = [
      { id: 1, tagName: 'Yoga' },
      { id: 2, tagName: 'Pilates' }
    ];

    renderWithDnd(
      <TagsContainer
        title="Available Tags"
        tags={mockTags}
        type="member"
        onMove={() => {}}
        onRemove={() => {}}
      />
    );

    // 断言两个 tag 均被渲染（DraggableTag 在 dom 中）
    expect(screen.getByTestId('drag-tag-1')).toBeInTheDocument();
    expect(screen.getByTestId('drag-tag-2')).toBeInTheDocument();
  });
}); 