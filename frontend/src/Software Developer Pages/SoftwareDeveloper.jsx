import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCode, FaLightbulb, FaProjectDiagram, FaTasks } from 'react-icons/fa';
import { GiProgression } from 'react-icons/gi';
import { MdWork, MdContactMail } from 'react-icons/md';

const SoftwareDeveloper = () => {
  const [greeting, setGreeting] = useState("Welcome, Abdul Rafay!");

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white flex flex-col items-center p-5">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-wide mb-2">{greeting}</h1>
        <p className="text-lg">Build, Innovate, and Lead the Future of Technology</p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <Link
          to="/projects"
          className="bg-white text-black p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
        >
          <FaProjectDiagram className="text-5xl mx-auto mb-4 text-blue-500" />
          <h2 className="text-2xl font-semibold text-center">My Projects</h2>
          <p className="text-center mt-2">
            Manage your ongoing and completed projects with ease.
          </p>
        </Link>

        <Link
          to="/tasks"
          className="bg-white text-black p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
        >
          <FaTasks className="text-5xl mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-semibold text-center">My Tasks</h2>
          <p className="text-center mt-2">
            Stay organized with a detailed view of your daily tasks.
          </p>
        </Link>

        <Link
          to="/progress"
          className="bg-white text-black p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
        >
          <GiProgression className="text-5xl mx-auto mb-4 text-purple-500" />
          <h2 className="text-2xl font-semibold text-center">Progress</h2>
          <p className="text-center mt-2">
            Track your professional growth and milestones.
          </p>
        </Link>

        <Link
          to="/learning"
          className="bg-white text-black p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
        >
          <FaLightbulb className="text-5xl mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-semibold text-center">Learning</h2>
          <p className="text-center mt-2">
            Explore learning resources and upgrade your skills.
          </p>
        </Link>

        <Link
          to="/team"
          className="bg-white text-black p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
        >
          <MdWork className="text-5xl mx-auto mb-4 text-pink-500" />
          <h2 className="text-2xl font-semibold text-center">Team</h2>
          <p className="text-center mt-2">
            Collaborate with your team and achieve goals together.
          </p>
        </Link>

        <Link
          to="/contact"
          className="bg-white text-black p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
        >
          <MdContactMail className="text-5xl mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-semibold text-center">Contact</h2>
          <p className="text-center mt-2">
            Reach out for support, feedback, or collaboration.
          </p>
        </Link>
      </main>

      
    </div>
  );
};

export default SoftwareDeveloper;
