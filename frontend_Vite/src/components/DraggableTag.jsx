import { useState, useRef, useEffect } from 'react';
import { Tag, Badge } from 'antd';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';

// 定义一组多彩的标签颜色
const TAG_COLORS = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'cyan', 'blue', 'geekblue',
  'purple'
];

const DraggableTag = ({ tag, index, type, onMove, onRemove, style }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 使用 useEffect 检查组件 ref 是否正确初始化
  useEffect(() => {
    if (!ref.current) {
      console.warn('Tag ref not initialized:', tag);
    } else {
      console.log('Tag ref initialized:', tag.tagName, '- Type:', type);
    }
  }, [tag, type]);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'tag',
    item: () => {
      console.log('Starting drag tag:', { 
        id: tag.id, 
        name: tag.tagName, 
        index, 
        sourceType: type 
      });
      
      return { 
        id: tag.id, 
        index, 
        sourceType: type, 
        name: tag.tagName 
      };
    },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      const dropResult = monitor.getDropResult();
      
      console.log('Drag end:', { 
        didDrop, 
        dropResult,
        item 
      });
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [{ isOver }, drop] = useDrop({
    accept: 'tag',
    hover: (item, monitor) => {
      if (!ref.current) {
        console.error('Ref not available during hover');
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceType = item.sourceType;
      const targetType = type;
      
      // 如果拖拽项和放置项相同，则不做任何处理
      if (dragIndex === hoverIndex && sourceType === targetType) {
        return;
      }
      
      // 获取鼠标位置信息，用于更准确的拖拽
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // 仅在鼠标越过中线时进行处理，减少频繁更新
      if (
        (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
        (dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
      ) {
        return;
      }
      
      console.log('Hover event:', { 
        dragTag: item.name,
        hoverTag: tag.tagName,
        dragIndex, 
        hoverIndex, 
        sourceType, 
        targetType
      });
      
      // 调用传入的onMove函数处理移动逻辑
      onMove(dragIndex, hoverIndex, sourceType, targetType, item.id);
      
      // 更新拖拽项的index和sourceType
      item.index = hoverIndex;
      item.sourceType = targetType;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  // 将 drag 和 drop 应用于同一个引用
  drag(drop(ref));
  
  // 根据标签ID确定标签颜色，保证相同标签始终相同颜色
  const getTagColor = () => {
    // 使用标签ID来计算颜色索引，确保相同ID的标签颜色一致
    const colorIndex = tag.id % TAG_COLORS.length;
    return TAG_COLORS[colorIndex];
  };
  
  // 根据拖拽状态设置样式
  const tagStyle = {
    cursor: 'move',
    opacity: isDragging ? 0.5 : 1,
    margin: '6px',
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    boxShadow: isDragging 
      ? '0 5px 15px rgba(0, 0, 0, 0.2)' 
      : isHovered 
        ? '0 3px 10px rgba(0, 0, 0, 0.1)' 
        : 'none',
    transform: isHovered && !isDragging ? 'translateY(-3px)' : 'none',
    border: isOver ? '1px dashed #1890ff' : 'none',
    ...style,
  };
  
  // 鼠标悬停效果
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // 为选中的标签添加特殊标记
  const badgeColor = type === 'coach' ? '#52c41a' : 'transparent';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      data-testid={`drag-tag-${tag.id}`}
    >
      <Badge 
        dot={type === 'coach'} 
        color={badgeColor}
      >
        <Tag
          ref={ref}
          style={tagStyle}
          closable={onRemove !== undefined}
          onClose={() => {
            console.log('Remove tag:', tag.tagName, '- Type:', type);
            onRemove && onRemove(tag.id, type);
          }}
          color={getTagColor()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`rounded-full ${isHovered ? 'shadow-md' : ''} ${isOver ? 'tag-hover' : ''}`}
        >
          {tag.tagName}
        </Tag>
      </Badge>
    </motion.div>
  );
};

export default DraggableTag; 