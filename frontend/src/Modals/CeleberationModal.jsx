import React, { useState, useEffect } from "react";
import Confetti from "react-confetti"; // Confetti effect
import Particles from "react-tsparticles"; // Particle effect

// UAE Flag Image URL
const uaeFlagUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_United_Arab_Emirates.svg/1280px-Flag_of-the_United_Arab_Emirates.svg.png";

const NationalHolidayModal = () => {
  const [isOpen, setIsOpen] = useState(true); // Modal is open on load
  const [width, height] = useWindowSize(); // Confetti size based on window dimensions

  // Close the modal after 8 seconds (you can adjust this time)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 8000); // Modal disappears after 8 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {isOpen && (
        <>
          {/* Confetti Effect */}
          <Confetti width={width} height={height} numberOfPieces={300} />

          {/* Particle Effect in Background */}
          <Particles
            params={{
              particles: {
                number: {
                  value: 100,
                },
                shape: {
                  type: "circle",
                },
                size: {
                  value: 4,
                },
                opacity: {
                  value: 0.6,
                },
                move: {
                  speed: 5,
                },
              },
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1,
            }}
          />

          {/* Background Blur Layer */}
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 backdrop-blur-lg z-0"></div>

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-xl z-10 opacity-100">
            <img src={uaeFlagUrl} alt="UAE Flag" className="w-24 mb-4 mx-auto rounded-xl" />
            <h1 className="text-4xl font-bold text-green-600 mb-4">🎉  National Holidays Celebration! 🎉</h1>
              <button
              onClick={() => setIsOpen(false)}
              className="bg-red-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-red-400 transition duration-300"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Custom hook to get window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return [windowSize.width, windowSize.height];
}

export default NationalHolidayModal;
