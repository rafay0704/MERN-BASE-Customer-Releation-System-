// PopupNotification.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // For toast styles
import moment from 'moment';

// Assuming the backend URL is stored in an environment variable
const socket = io(import.meta.env.VITE_BACKEND_URL);

const PopupNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for 'popup' events from the backend
    socket.on('popup', (data) => {
      const notification = {
        message: data.message,
        client: data.client,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      };

      // Add the notification to the list
      setNotifications((prevNotifications) => [...prevNotifications, notification]);

      // Display a toast notification
      toast.info(`${data.client}: ${data.message}`);
    });

    return () => {
      socket.off('popup'); // Cleanup on component unmount
    };
  }, []);

  return (
    <div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      {/* Render a list of notifications */}
      <div className="notifications-list">
        {notifications.map((notif, index) => (
          <div key={index} className="notification">
            <p><strong>{notif.client}</strong> - {notif.message}</p>
            <span>{notif.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopupNotification;
