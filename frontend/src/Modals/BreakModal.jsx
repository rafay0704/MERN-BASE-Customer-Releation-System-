import React, { useState, useEffect } from 'react';
import { get } from '../services/ApiEndpoint'; // Assuming `get` API function is defined

const BreakModal = ({ isVisible, onEndBreak, username, userId }) => {
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Fetch break status from the server
  const fetchBreakStatus = async () => {
    try {
      const response = await get(`/api/auth/status/${userId}`);
      if (response.data.success) {
        const activeBreak = response.data.breaks.find((b) => !b.endTime);
        setIsOnBreak(!!activeBreak);
      } else {
        console.error('Failed to fetch break status.');
      }
    } catch (error) {
      console.error('Error fetching break status:', error);
    }
  };

  // Fetch break status when the component is mounted or when `userId` or `isVisible` changes
  useEffect(() => {
    if (isVisible) {
      fetchBreakStatus();
    }
  }, [isVisible, userId]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-lg">
      <div className="bg-white rounded-lg p-8 shadow-xl text-center space-y-6 w-11/12 sm:w-1/3 max-w-lg transform transition-all duration-300 ease-in-out scale-105">
        <h2 className="text-3xl font-semibold text-gray-900">{username} is on a break! ☕</h2>
        <p className="text-gray-600 text-lg">
          Take a moment to recharge, and when you're ready, click "End Break" to continue your work.
        </p>
        <button
          onClick={onEndBreak}
          className="px-8 py-4 bg-red-600 text-white font-bold rounded-lg shadow-md transform transition duration-200 hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
        >
          End Break
        </button>
      </div>
    </div>
  );
};

export default BreakModal;
