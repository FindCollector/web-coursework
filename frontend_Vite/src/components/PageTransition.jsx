import { motion } from 'framer-motion';

const PageTransition = ({ children, isVisible, direction = 'horizontal' }) => {
  const getInitialX = () => {
    if (direction === 'horizontal') {
      return isVisible ? 100 : -100;
    }
    return 0;
  };

  const getInitialY = () => {
    if (direction === 'vertical') {
      return isVisible ? 50 : -50;
    }
    return 0;
  };

  const getExitX = () => {
    if (direction === 'horizontal') {
      return isVisible ? -100 : 100;
    }
    return 0;
  };

  const getExitY = () => {
    if (direction === 'vertical') {
      return isVisible ? -50 : 50;
    }
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: getInitialX(), y: getInitialY() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: getExitX(), y: getExitY() }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 