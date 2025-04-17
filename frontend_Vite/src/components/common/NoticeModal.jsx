import React from 'react';
import { Modal, Button } from 'antd';

const NoticeModal = ({ isVisible, onClose, title, children }) => {
  return (
    <Modal
      title={title || "Notice"} // Default title if none provided
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          OK
        </Button>
      ]}
      centered // Center the modal vertically
      width={600} // Default width, can be overridden if needed via style/className props later
    >
      {children} 
    </Modal>
  );
};

export default NoticeModal; 