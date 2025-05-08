import { useMemo, useEffect } from 'react';
import { Typography, Card, Empty } from 'antd';
import { TagsOutlined } from '@ant-design/icons';
import { useDrop } from 'react-dnd';
import DraggableTag from './DraggableTag';

const { Title } = Typography;

const TagsContainer = ({ title, tags, type, onMove, onRemove, style }) => {
  // Component initialization - no action needed after removal of console logs
  useEffect(() => {
    // Container initialization
  }, [type, tags.length]);
  
  // Monitor tags count changes
  useEffect(() => {
    // Tags updated
  }, [tags, type]);
  
  // Enable container-level drag and drop, allowing direct drops to empty containers
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'tag',
    drop: (item, monitor) => {
      // Only handle drops from other containers, same container drops are handled by tag components
      if (item.sourceType !== type) {
        // Drop at the end of the container
        onMove(item.index, tags.length, item.sourceType, type, item.id);
      }
      
      return { dropped: true, targetType: type };
    },
    hover: (item, monitor) => {
      // Hover handling
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Use white background with colored border
  const defaultStyle = type === 'coach' 
    ? { 
        background: 'white',
        borderLeft: '4px solid #52c41a'
      }
    : { 
        background: 'white',
        borderLeft: '4px solid #fa8c16'
      };
  
  // Add style changes for drag and drop states
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
    ...style // Allow overriding default styles
  };
  
  // Use useMemo to optimize tag rendering performance
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
  
  // Get card title style
  const getTitleStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      fontSize: '16px',
      fontWeight: '600',
      color: type === 'coach' ? '#389e0d' : '#d46b08'
    };
  };
  
  // Get card title icon
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

  // Drag and drop prompt style
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