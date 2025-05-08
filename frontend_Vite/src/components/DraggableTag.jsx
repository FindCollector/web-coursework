import { useState, useRef, useEffect } from 'react';
import { Tag, Badge } from 'antd';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';

// Define a set of colorful tag colors
const TAG_COLORS = [
  'magenta', 'red', 'volcano', 'orange', 'gold',
  'lime', 'green', 'cyan', 'blue', 'geekblue',
  'purple'
];

const DraggableTag = ({ tag, index, type, onMove, onRemove, style }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use useEffect to check if the component ref is properly initialized
  useEffect(() => {
    if (!ref.current) {
      // Tag ref not initialized
    }
  }, [tag, type]);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'tag',
    item: () => {
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
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [{ isOver }, drop] = useDrop({
    accept: 'tag',
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceType = item.sourceType;
      const targetType = type;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex && sourceType === targetType) {
        return;
      }
      
      // Get mouse position information for more accurate dragging
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (
        (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
        (dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
      ) {
        return;
      }
      
      // Call onMove function to handle the movement logic
      onMove(dragIndex, hoverIndex, sourceType, targetType, item.id);
      
      // Update the index and sourceType for the dragged item
      item.index = hoverIndex;
      item.sourceType = targetType;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  // Apply drag and drop to the same ref
  drag(drop(ref));
  
  // Determine tag color based on tag ID to ensure the same tag always has the same color
  const getTagColor = () => {
    // Use the tag ID to calculate the color index, ensuring consistent colors for the same ID
    const colorIndex = tag.id % TAG_COLORS.length;
    return TAG_COLORS[colorIndex];
  };
  
  // Set style based on drag state
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
  
  // Mouse hover effects
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Add special marker for selected tags
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