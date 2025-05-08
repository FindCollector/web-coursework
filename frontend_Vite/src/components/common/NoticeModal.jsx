import React from 'react';
import { Modal, Button } from 'antd';

const NoticeModal = ({ isVisible, onClose, title, children }) => {
  return (
    <Modal
      title={title || "Notice"}
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          OK
        </Button>
      ]}
      centered 
      width={600} 
    >
      {children} 
    </Modal>
  );
};

export default NoticeModal; 