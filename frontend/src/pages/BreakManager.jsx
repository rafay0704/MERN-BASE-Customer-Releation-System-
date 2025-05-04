import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { post, get } from '../services/ApiEndpoint.jsx'; // Assuming you have these API utilities
import { useSelector } from 'react-redux'; // Import useSelector to get user from Redux store
import 'react-toastify/dist/ReactToastify.css';

const BreakManager = () => {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user from Redux store
  const user = useSelector((state) => state.Auth.user);

  useEffect(() => {
    if (user?._id) {
      fetchBreakStatus(user._id);  // Check break status on page load or refresh
    }
  }, [user]);

  // Fetch break status from the server to determine if the user is on break
  const fetchBreakStatus = async (userId) => {
    try {
      const response = await get(`/api/auth/status/${userId}`);
      if (response.data.success) {
        // If there are breaks, check if any are active (no endTime)
        if (response.data.breaks && response.data.breaks.length > 0) {
          const activeBreak = response.data.breaks.find((b) => !b.endTime);
          setIsOnBreak(!!activeBreak);  // Set break status based on response
        } else {
          setIsOnBreak(false);  // No breaks found, treat as not on break
        }
      } else {
        toast.error('Failed to fetch break status.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching break status.');
    }
  };

  // Start a break
  const handleStartBreak = async () => {
    try {
      setLoading(true);
      const response = await post('/api/auth/startbreak', { userId: user._id });
      if (response.data.success) {
        toast.success('Break started!');
        setIsOnBreak(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error starting break.');
    } finally {
      setLoading(false);
    }
  };

  // End a break
  const handleEndBreak = async () => {
    try {
      setLoading(true);
      const response = await post('/api/auth/endbreak', { userId: user._id });
      if (response.data.success) {
        toast.success('Break ended!');
        setIsOnBreak(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error ending break.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Break Manager</h2>

        {/* Display Break Status */}
        <div className="mb-6">
          {isOnBreak ? (
            <p className="text-lg text-green-600 font-semibold">You are currently on a break.</p>
          ) : (
            <p className="text-lg text-gray-600">You are not on a break.</p>
          )}
        </div>

        {/* Start/End Break Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleStartBreak}
            disabled={isOnBreak || loading}
            className={`px-4 py-2 rounded-md shadow-md font-semibold ${
              isOnBreak || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Start Break
          </button>
          <button
            onClick={handleEndBreak}
            disabled={!isOnBreak || loading}
            className={`px-4 py-2 rounded-md shadow-md font-semibold ${
              !isOnBreak || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            End Break
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakManager;
