import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TopHeaderBar from '../Header';
const UserLayout = () => {
  const user = useSelector((state) => state.Auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      switch (user.designation) {
        case 'CSS':
          navigate('/css');
          break;
        case 'Software Engineer':
          navigate('/software');
          break;
        case 'Business Planner':
          navigate('/businessplaner');
          break;
        case 'Trainer':
          navigate('/trainer');
          break;
        case 'Submission Specialist':
          navigate('/submission');
          break;
        default:
          navigate('/'); // Default case for unknown designations or other fallback
      }
    }
  }, [user, navigate]);
  
  
  return (
    <>
     <TopHeaderBar /> {/* Add the top header bar */}
      <Outlet />
    </>
  );
};

export default UserLayout;
