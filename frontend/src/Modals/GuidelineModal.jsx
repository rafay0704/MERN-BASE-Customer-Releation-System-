import React from "react";
import { FaTimes } from "react-icons/fa";

const GuidelineModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
        >
          <FaTimes size={20} />
        </button>
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-gray-600">{children}</div>
      </div>
    </div>
  );
};

export default GuidelineModal;
