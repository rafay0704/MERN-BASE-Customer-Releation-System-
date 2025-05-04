import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { AiOutlineCloseCircle } from "react-icons/ai"; // Using an icon for the dismiss button
import Confetti from "react-confetti"; // Importing the Confetti component
import Particles from "react-tsparticles"; // Particle effect
import { motion } from "framer-motion"; // For animations

const socket = io(import.meta.env.VITE_BACKEND_URL);

function BatchCompletionNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    socket.on("batchCompletionNotification", (data) => {
      setNotifications((prevNotifications) => [...prevNotifications, data]);
      setConfetti(true); // Trigger confetti when a new notification arrives

      // Disable confetti after a short period
      setTimeout(() => setConfetti(false), 3000);
    });

    return () => {
      socket.off("batchCompletionNotification");
    };
  }, []);

  const dismissNotification = (index) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((_, i) => i !== index)
    );
  };

  return (
    <>
      {confetti && (
        <Confetti
          width={window.innerWidth} // Full screen width for confetti
          height={window.innerHeight} // Full screen height for confetti
        />
      )}

      {notifications.length > 0 && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50">
          <Particles
            id="tsparticles"
            options={{
              background: {
                color: {
                  value: "rgba(0, 0, 0, 0.5)",
                },
              },
              particles: {
                number: {
                  value: 30,
                },
                size: {
                  value: 4,
                },
                move: {
                  speed: 1,
                },
              },
            }}
          />
          <div className="space-y-6 w-full max-w-lg p-4">
            {notifications.map((notif, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-teal-500 p-6 rounded-lg shadow-xl transform transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-2xl animate__animated animate__fadeInRight"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">
                    <span role="img" aria-label="notification">📢</span> Batch Completion Order
                  </h3>
                  <AiOutlineCloseCircle
                    onClick={() => dismissNotification(index)}
                    className="text-white cursor-pointer text-xl transition-transform transform hover:rotate-90"
                  />
                </div>

                <div className="space-y-3 mt-4">
                  <p className="text-sm font-medium text-white">
                    Here is the batch completion order:
                  </p>
                  <ul className="space-y-2 text-white">
                    {notif.order.map((user, idx) => (
                      <li key={idx} className="text-sm font-semibold">
                        <span className="text-lg text-yellow-400">{user.position}.</span> {user.user}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => dismissNotification(index)}
                    className="bg-red-600 text-white px-6 py-3 rounded-md text-sm transition-all duration-200 transform hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 hover:scale-105"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default BatchCompletionNotifications;
