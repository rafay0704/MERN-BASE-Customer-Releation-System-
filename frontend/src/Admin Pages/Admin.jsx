import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Logout } from '../redux/AuthSlice.jsx';
import { post } from '../services/ApiEndpoint.jsx';

const Admin = () => {
  const user = useSelector((state) => state.Auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await post('/api/auth/logout');
      if (response.status === 200) {
        dispatch(Logout());
        navigate('/login');
      }
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome {user ? user.name : 'Guest'}!</h1>

      {user && (
  <div className="flex flex-col items-center mb-4">
    {/* Display user profile picture */}
    {user.profilePicture && (
      <img 
        src={`${import.meta.env.VITE_BACKEND_URL}${user.profilePicture}`} 
        alt="Profile" 
        className="w-32 h-32 rounded-full mb-4"
      />
    )}
    <p className="text-lg font-semibold">Name: {user.name}</p>
    <p className="text-lg">Email: {user.email}</p>
    <p className="text-lg">Designation: {user.designation}</p>
  </div>
)}


      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Logout
      </button>
    </div>
  );
};

export default Admin;