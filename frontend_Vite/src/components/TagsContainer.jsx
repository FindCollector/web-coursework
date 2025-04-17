import { useMemo, useEffect } from 'react';
import { Typography, Card, Empty } from 'antd';
import { TagsOutlined } from '@ant-design/icons';
import { useDrop } from 'react-dnd';
import DraggableTag from './DraggableTag';

const { Title } = Typography;

const TagsContainer = ({ title, tags, type, onMove, onRemove, style }) => {
  // 组件挂载后记录容器信息
  useEffect(() => {
    console.log(`TagContainer initialized - Type: ${type}, Tags count: ${tags.length}`);
  }, [type, tags.length]);
  
  // 当标签数量变化时输出日志
  useEffect(() => {
    console.log(`TagContainer updated - Type: ${type}, Current tags count: ${tags.length}`);
    if (tags.length > 0) {
      console.log(`${type} container tags:`, tags.map(tag => tag.tagName));
    }
  }, [tags, type]);
  
  // 启用容器级别的拖放功能，允许直接拖放到空容器
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'tag',
    drop: (item, monitor) => {
      // 记录拖放完成
      console.log(`Tag dropped in ${type} container:`, { 
        item, 
        isDroppedOnSelf: item.sourceType === type,
        didDrop: monitor.didDrop()
      });
      
      // 只处理来自其他容器的拖放，同一容器的由标签组件处理
      if (item.sourceType !== type) {
        console.log(`Cross-container drag - From ${item.sourceType} to ${type}:`, { 
          tagId: item.id,
          tagName: item.name,
          targetPosition: tags.length 
        });
        
        // 放到容器末尾
        onMove(item.index, tags.length, item.sourceType, type, item.id);
      }
      
      return { dropped: true, targetType: type };
    },
    hover: (item, monitor) => {
      if (item.sourceType !== type) {
        // 只在首次悬停或进入新容器时记录，避免过多日志
        if (!isOver) {
          console.log(`Tag hovering over ${type} container:`, {
            tagId: item.id,
            tagName: item.name,
            sourceType: item.sourceType
          });
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // 使用白色背景，彩色边框
  const defaultStyle = type === 'coach' 
    ? { 
        background: 'white',
        borderLeft: '4px solid #52c41a'
      }
    : { 
        background: 'white',
        borderLeft: '4px solid #fa8c16'
      };
  
  // 增加拖放状态的样式变化
  const isActive = isOver && canDrop;
  
  const containerStyle = {
    minHeight: '100px',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    border: isActive ? '2px dashed #1890ff' : '1px solid #f0f0f0',
    background: isActive 
      ? (type === 'coach' ? 'rgba(217, 247, 190, 0.3)' : 'rgba(255, 231, 186, 0.3)') 
      : defaultStyle.background,
    borderLeft: defaultStyle.borderLeft,
    ...style // 允许覆盖默认样式
  };
  
  // 使用useMemo优化标签渲染性能
  const renderedTags = useMemo(() => {
    return tags.map((tag, index) => (
      <DraggableTag
        key={tag.id}
        tag={tag}
        index={index}
        type={type}
        onMove={onMove}
        onRemove={onRemove}
        style={{ margin: '6px' }}
      />
    ));
  }, [tags, type, onMove, onRemove]);
  
  // 获取卡片标题样式
  const getTitleStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      fontSize: '16px',
      fontWeight: '600',
      color: type === 'coach' ? '#389e0d' : '#d46b08'
    };
  };
  
  // 获取卡片标题图标
  const getTitleIcon = () => {
    return (
      <TagsOutlined 
        style={{ 
          marginRight: '8px',
          fontSize: '18px', 
          color: type === 'coach' ? '#52c41a' : '#fa8c16'
        }} 
      />
    );
  };

  // 拖放提示样式
  const dropPromptStyle = {
    border: '2px dashed #d9d9d9',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    backgroundColor: isActive 
      ? (type === 'coach' ? 'rgba(217, 247, 190, 0.5)' : 'rgba(255, 231, 186, 0.5)')
      : 'rgba(0, 0, 0, 0.02)',
    transition: 'all 0.3s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100px',
    width: '100%'
  };
  
  return (
    <Card 
      title={
        <div style={getTitleStyle()}>
          {getTitleIcon()}
          {title}
        </div>
      }
      style={containerStyle}
      className="shadow-sm transition-all duration-300 hover:shadow-md"
      bodyStyle={{ padding: '16px', background: 'white' }}
    >
      <div 
        ref={drop}
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          minHeight: '120px',
          position: 'relative',
          borderRadius: '8px',
          background: 'white'
        }}
        data-testid={`tags-container-${type}`}
      >
        {renderedTags.length > 0 ? (
          renderedTags
        ) : (
          <div style={dropPromptStyle}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500">
                  {type === 'coach' 
                    ? 'Drag tags here to add to your profile' 
                    : 'No available tags. All tags have been added to your profile.'}
                </span>
              }
              style={{ margin: '20px auto' }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default TagsContainer; 