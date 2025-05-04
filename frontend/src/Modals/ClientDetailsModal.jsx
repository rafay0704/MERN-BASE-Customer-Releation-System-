// ClientDetailsModal.js
import React from 'react';

const ClientDetailsModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;  // Don't render the modal if it's closed

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-3/4 md:w-1/2 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          &times; {/* Close button */}
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;
