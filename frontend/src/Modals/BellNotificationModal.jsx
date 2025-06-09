import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { post, delet , get} from '../services/ApiEndpoint'; // Assuming delet is defined for DELETE requests

const BellNotificationModal = ({ isOpen, notifications, onClose, user, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [pictures, setPictures] = useState({});

  
  // Function to toggle read/unread status
  const toggleReadStatus = async (notificationId, currentStatus) => {
    setLoading(true);
    try {
      const updatedStatus = !currentStatus;
      await post(`/api/auth/notifications/${notificationId}`, { readStatus: updatedStatus });
      if (onActionComplete) onActionComplete(); // Notify parent to refresh data
    } catch (error) {
      console.error("Error updating notification status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all read notifications
  const clearAllNotifications = async () => {
    setClearLoading(true);
    try {
      await delet('/api/auth/notifications/clear'); // Make DELETE request to clear read notifications
      if (onActionComplete) onActionComplete(); // Notify parent to refresh data
    } catch (error) {
      console.error("Error clearing notifications:", error);
    } finally {
      setClearLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto relative shadow-lg">
        
        {/* Modal Header with Sticky Close Button */}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-4 px-6 border-b">
          <h2 className="text-xl font-semibold text-blue-600 flex items-center">
            <FaBell className="mr-2" />
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-lg font-semibold text-gray-600 hover:text-gray-800 transition-transform transform hover:scale-105"
            aria-label="Close Notifications"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* Admin Clear Notifications Button */}
        {user && user.role === 'admin' && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={clearAllNotifications}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex items-center"
              disabled={clearLoading}
            >
              {clearLoading ? <ClipLoader size={20} color="#fff" /> : 'Clear All Read Notifications'}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center">You have no notifications at the moment.</p>
          ) : (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`border-b py-4 px-2 rounded-lg transition-all ${notification.read ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Profile Picture and Item Name */}
                    <div className="flex items-center space-x-3">
                      
                      <h3 className="text-lg font-semibold text-blue-800">{notification.itemName}</h3>
                    </div>

                    {/* Read Status with toggle button */}
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`flex items-center text-sm ${notification.read ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {notification.read ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                        {notification.read ? 'Read' : 'Unread'}
                      </span>

                      {user && notification.cssValue === user.name && (
                        <button
                          onClick={() => toggleReadStatus(notification._id, notification.read)}
                          className="text-blue-500 hover:text-blue-700 disabled:opacity-50 flex items-center"
                          disabled={loading}
                        >
                          {loading ? (
                            <ClipLoader size={15} color="#2563eb" />
                          ) : (
                            <>
                              {notification.read ? (
                                <>
                                  Mark Unread
                                  <FaTimes className="mr-2" />
                                </>
                              ) : (
                                <>
                                  Mark Read
                                  <FaCheck className="mr-2" />
                                </>
                              )}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification Details */}
                  <div className="space-y-2 text-sm text-gray-700 mt-3">
                    <p><strong>Type:</strong> {notification.type}</p>
                    <p><strong>Customer Name:</strong> {notification.customerName}</p>
                    <div className="flex items-center">
                      <p><strong>CSS :</strong> </p>
                     
                      <span className="text-blue-600 ml-2">{notification.cssValue}</span>
                    </div>
                    <p><strong>Message:</strong> {notification.message}</p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 block mt-2">{new Date(notification.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BellNotificationModal;
