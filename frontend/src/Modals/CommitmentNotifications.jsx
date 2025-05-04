import { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // To get user info from Redux store
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL);

function CommitmentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const user = useSelector((state) => state.Auth.user); // Get user from Redux store

  useEffect(() => {
    socket.on("commitmentNotification", (data) => {
      setNotifications((prevNotifications) => [...prevNotifications, data]);
    });
    
    socket.on("criticalHighlightNotification", (data) => {
      setNotifications((prevNotifications) => [...prevNotifications, data]);
    });

    return () => {
      socket.off("commitmentNotification");
      socket.off("criticalHighlightNotification");
    };
  }, []);

  const dismissNotification = (index) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.filter((_, i) => i !== index);
      return updatedNotifications;
    });
  };

  // Filter notifications to only those where cssValue matches user.name
  const filteredNotifications = notifications.filter(
    (notif) => notif.cssValue === user?.name
  );

  return (
    <>
      {filteredNotifications.length > 0 && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="space-y-4 w-full max-w-lg">
            {filteredNotifications.map((notif, index) => (
              <div
                key={notif.clientId + notif.itemName} // Use a unique key to prevent re-rendering issues
                className="bg-white p-6 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-2xl animate__animated animate__fadeInRight"
              >
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  {notif.type === "commitment" ? "Commitment Reminder" : "Critical Highlight Reminder"}
                </h3>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-800">
                    Customer: <span className="text-blue-600">{notif.customerName}</span>
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    CSS: <span className="text-blue-600">{notif.cssValue}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    {/* Use itemName to show the formatted name with deadline or expiry */}
                    {notif.itemName}
                  </p>
                 
                  
                  <p className="text-sm font-medium text-red-600">{notif.message}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => dismissNotification(index)}
                    className="bg-red-600 text-white px-5 py-2 rounded-md text-sm transition-colors duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default CommitmentNotifications;
