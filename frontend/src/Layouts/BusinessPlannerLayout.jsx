import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TopHeaderBar from '../Header';

const BusinessPlanerLayout = () => {
  const user = useSelector((state) => state.Auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user exists and has role 'user' and designation 'CSS'
    if (!user || user.role !== "user" || user.designation !== "Business Planner") {
      navigate('/login'); // Redirect to login if conditions are not met
    }
  }, [user, navigate]);

  return (
    <>
      <TopHeaderBar /> {/* Add the top header bar */}
      <Outlet /> {/* Render the child routes */}
    </>
  );
};

export default BusinessPlanerLayout;
