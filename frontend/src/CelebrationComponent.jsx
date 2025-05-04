import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Confetti from 'react-confetti';
import celebrationSound from '../src/assets/celeberation.mp3'; // Correct import for sound

const CelebrationComponent = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [isCelebrating, setIsCelebrating] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Play sound when celebration starts
  const playCelebrationSound = () => {
    const audio = new Audio(celebrationSound); // Use the imported sound file
    audio.loop = true; // Loop the sound for longer celebrations
    audio.play();
  };

  // Stop sound after a few seconds
  const stopCelebrationSound = () => {
    const audio = new Audio(celebrationSound);
    audio.pause();
  };

  // Update window dimensions to keep confetti fullscreen
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger Celebration
  const triggerCelebration = () => {
    setShowConfetti(true);
    playCelebrationSound();
    toast.success('Let’s Celebrate! 🎉 From Sheik Money! 💸🤣');
  };

  // Close the celebration modal
  const closeCelebration = () => {
    setIsCelebrating(false);
    setShowConfetti(false);
    stopCelebrationSound(); // Stop sound when celebration ends
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 ${isCelebrating ? '' : 'hidden'}`}>
      <div className="absolute inset-0 z-40">
        {showConfetti && <Confetti width={windowDimensions.width} height={windowDimensions.height} numberOfPieces={500} /> /* Increase confetti particles */}
      </div>
      <div className="w-full max-w-3xl p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg rounded-lg text-center relative z-50 transform transition-transform duration-500 animate__animated animate__zoomIn animate__delay-1s">
        <button
          onClick={closeCelebration}
          className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700 transform transition-transform duration-300 ease-in-out"
        >
          X
        </button>
        <h2 className="text-4xl font-extrabold text-white mb-4 animate__animated animate__fadeIn animate__delay-1s">
          🎉 CRM Launch Creative Business Department 🎉
        </h2>
        <p className="text-lg text-white mb-4 animate__animated animate__fadeIn animate__delay-2s">
          11 November 2024 || 3:15 PM
        </p>
        <p className="text-lg text-white mb-6 animate__animated animate__fadeIn animate__delay-2.5s">
          Welcome, everyone: <br />
          Rickson, Shiekh, Muneeb, Mustafa, Alston, Russel , Raqeeb, Fatma, Tilak, Aniket, Rafay, Pahdai, Ajay, Yousef, Rohit
        </p>
        <p className="text-lg text-white mb-4 animate__animated animate__fadeIn animate__delay-3s">
          Also, special thanks to Boss and Imran Bhai for their exceptional contributions and unwavering support!
        </p>

        <button
          onClick={triggerCelebration}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-300 text-white font-semibold rounded-lg shadow-md hover:opacity-80 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 animate__animated animate__pulse animate__infinite"
        >
          What's Next? 🎉
        </button>
      </div>
    </div>
  );
};

export default CelebrationComponent;
