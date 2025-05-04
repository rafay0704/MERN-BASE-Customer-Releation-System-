import React from 'react';
import moon from '../src/assets/moon.png';

const MarqueeBanner = () => {
  return (
    <div className="w-full fixed top-0 left-0 bg-gradient-to-r from-green-800 via-yellow-500 to-blue-800 text-white text-center z-50">
      <div className="whitespace-nowrap animate-marquee py-2 overflow-hidden">
        <p className="inline-block pr-10">
          <img src={moon} alt="Moon" className="inline-block h-6 ml-2" /> 
          🌙✨ 𝐄𝐈𝐃 𝐇𝐎𝐋𝐈𝐃𝐀𝐘𝐒! 🏖️🎉 Wishing you joy and happiness!
        </p>
        <p className="inline-block pr-10">
          <img src={moon} alt="Moon" className="inline-block h-6 ml-2" /> 
          🕌🤲 عطلات العيد 🌙✨ نتمنى لكم السعادة والفرح! 🏖️🎉
        </p>
        <p className="inline-block pr-10">
          <img src={moon} alt="Moon" className="inline-block h-6 ml-2" /> 
          🎁🕊️ 𝐄𝐈𝐃 𝐇𝐎𝐋𝐈𝐃𝐀𝐘𝐒! 🌙✨ May your days be filled with peace and blessings!
        </p>
        <p className="inline-block pr-10">
          <img src={moon} alt="Moon" className="inline-block h-6 ml-2" /> 
          🎁🕊️ عطلات العيد 🌙✨ نتمنى لكم أيامًا مليئة بالسلام والبركات!
        </p>
      </div>
    </div>
  );
};

export default MarqueeBanner;
