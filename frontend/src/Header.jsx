import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { post, get } from './services/ApiEndpoint'; // Assuming `get` and `post` API functions are defined
import { toast } from 'react-toastify';
import { Logout } from './redux/AuthSlice.jsx';
import { FaHome, FaTachometerAlt, FaUsers, FaTasks, FaSignOutAlt, FaUserCircle, FaCalendarCheck ,  } from 'react-icons/fa';
import { MdAssignment } from 'react-icons/md';
import { HiUserGroup, HiUserAdd } from 'react-icons/hi';
import {
  FcAssistant, FcHome, FcSalesPerformance, FcParallelTasks,
  FcOvertime, FcPortraitMode, FcIdea, FcApproval, FcBarChart , FcConferenceCall , FcCustomerSupport , FcHighPriority , FcPieChart ,FcAlarmClock , FcLowPriority , FcCalendar
} from "react-icons/fc";
import { FaBell } from 'react-icons/fa';
import { GiCoffeeCup } from 'react-icons/gi';


import BreakModal from './Modals/BreakModal.jsx';
import BellNotificationModal from './Modals/BellNotificationModal.jsx';

const TopHeaderBar = () => {
  const user = useSelector((state) => state.Auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false); // Add a state to track check-in status
  const [loadingCheckIn, setLoadingCheckIn] = useState(false); // Loading state for check-in button
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false); // State to control modal visibility
  const [unreadCount, setUnreadCount] = useState(0);


  const [breakStartTime, setBreakStartTime] = useState(null);
  const [loading, setLoading] = useState(false); // Define the loading state

  useEffect(() => {
    if (user?._id) {
      fetchCheckInStatus(user._id); // Check check-in status on page load or refresh
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      fetchBreakStatus(user._id);  // Check break status on page load or refresh
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        fetchAllNotifications();
      } else if (user.designation === 'CSS') {
        // Fetch notifications for users based on their name (which is their `cssValue`)
        fetchNotificationsByCssValue(user.name);
      }
    }
  }, [user]);


  // Fetch notifications based on user's `name` matching the `cssValue`
  const fetchNotificationsByCssValue = async (name) => {
    try {
      const response = await get(`/api/auth/notifications/${name}`); // Fetch notifications
      if (response.data.success) {
        const notifications = response.data.notifications;
        setNotifications(notifications);
        const unread = notifications.filter((notification) => !notification.read).length;
        setUnreadCount(unread);


      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch all notifications for admin
  const fetchAllNotifications = async () => {
    try {
      const response = await get('/api/auth/notifications');
      if (response.data.success) {
        const notifications = response.data.notifications;
        setNotifications(notifications);
        const unread = notifications.filter((notification) => !notification.read).length;
        setUnreadCount(unread);


      } else {
        console.error('Failed to fetch all notifications');
      }
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    }
  };

  // Toggle the modal visibility
  const toggleModal = () => {
    setModalOpen((prevState) => !prevState);
  };
  const getMenuLinkClass = (path) =>
    `flex items-center px-4 py-2 rounded-lg ${location.pathname === path ? 'bg-purple-900 text-white' : 'text-gray-200 hover:bg-purple-800 hover:text-white transition-colors'}`;
  
  const adminMenu = (
    <>
      <Link to="/admin" className={getMenuLinkClass('/admin')}><FcPieChart  className="mr-1" /> Dashboard</Link>
      <Link to="/admin/clientstatuses" className={getMenuLinkClass('/admin/clientstatuses')}><FcBarChart  className="mr-1" /> Statuses</Link>
      <Link to="/admin/allclients" className={getMenuLinkClass('/admin/allclients')}><FcConferenceCall  className="mr-1" /> Clients</Link>
      <Link to="/admin/cssbatch" className={getMenuLinkClass('/admin/cssbatch')}><FcCustomerSupport  className="mr-1" />Routine Client </Link>
      <Link to="/admin/criticalclientstat" className={getMenuLinkClass('/admin/criticalclientstat')}><FcHighPriority  className="mr-1" />Critical </Link>
      <Link to="/admin/admincheckmanager" className={getMenuLinkClass('/admin/admincheckmanager')}><FcApproval className="mr-1" /> Verification </Link>

      <Link to="/admin/adminbreak" className={getMenuLinkClass('/admin/adminbreak')}>
        <FcAlarmClock  className="mr-1" />  Breaks
      </Link>
      <Link to="/admin/checkin" className={getMenuLinkClass('/admin/checkin')}>
        <FcLowPriority  className="mr-1" /> Checkin
      </Link>
      <Link to="/admin/allusers" className={getMenuLinkClass('/admin/allusers')}><FcIdea className="mr-1" />  Users</Link>
      <Link to="/admin/calender" className={getMenuLinkClass('/admin/calender')}><FcCalendar className="mr-1" /> Calender</Link>
    </>
  );

  const CSSMenu = (
    <>
      <Link to="/css" className={getMenuLinkClass('/css')}><FcPieChart className="mr-2" /> Dashboard</Link>
      <Link to="/css/myclients" className={getMenuLinkClass('/css/myclients')}><FcConferenceCall  className="mr-2" /> My Clients</Link>
      <Link to="/css/dailyclients" className={getMenuLinkClass('/css/dailyclients')}><FcCustomerSupport  className="mr-2" />Routine Clients</Link>
      <Link to="/css/criticalclients" className={getMenuLinkClass('/css/criticalclients')}><FcHighPriority  className="mr-2" />Critical </Link>
    </>
  );

 


  const fetchCheckInStatus = async (userId) => {
    try {
      const response = await get(`/api/auth/check-in-status/${userId}`);
      if (response.data.success) {
        setHasCheckedIn(response.data.hasCheckedInToday);
      } else {
        toast.error('Failed to fetch check-in status.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching check-in status.');
    }
  };

  const handleStartCheckIn = async () => {
    try {
      setLoadingCheckIn(true);
      const response = await post('/api/auth/check-in', { userId: user._id });
      if (response.data.success) {
        toast.success('Check-in successful!');
        setHasCheckedIn(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error checking in.');
    } finally {
      setLoadingCheckIn(false);
    }
  };



  // Fetch break status from the server to determine if the user is on break
  const fetchBreakStatus = async (userId) => {
    try {
      const response = await get(`/api/auth/status/${userId}`);
      if (response.data.success) {
        if (response.data.breaks && response.data.breaks.length > 0) {
          const activeBreak = response.data.breaks.find((b) => !b.endTime);
          setIsOnBreak(!!activeBreak);
        } else {
          setIsOnBreak(false);
        }
      } else {
        toast.error('Failed to fetch break status.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching break status.');
    }
  };

  // Start a break
  const handleStartBreak = async () => {
    try {
      setLoading(true); // Set loading to true when starting the break
      const response = await post('/api/auth/startbreak', { userId: user._id });
      if (response.data.success) {
        toast.success('Break started!');
        setIsOnBreak(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error starting break.');
    } finally {
      setLoading(false); // Set loading to false once the request finishes
    }
  };

  // End a break
  const handleEndBreak = async () => {
    try {
      setLoading(true); // Set loading to true when ending the break
      const response = await post('/api/auth/endbreak', { userId: user._id });
      if (response.data.success) {
        toast.success('Break ended!');
        setIsOnBreak(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error ending break.');
    } finally {
      setLoading(false); // Set loading to false once the request finishes
    }
  };

  const handleLogout = async () => {
    try {
      const response = await post('/api/auth/logout');
      if (response.status === 200) {
        dispatch(Logout());
        navigate('/login');
        toast.info('Logged out successfully');
      }
    } catch (error) {
      toast.error('Failed to logout');
      console.log(error);
    }
  };


  const getMenu = () => {
    if (user?.role === 'admin') {
      return adminMenu;
    }

    switch (user?.designation) {
      case 'CSS':
        return CSSMenu;
          default:
        return <Link to="/" className="flex items-center text-gray-200 hover:text-gray-300 transition"><FaHome className="mr-2" /> Home</Link>;
    }
  };
  return (

    <div className="mt-[1%]">
<div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-900 text-white shadow-lg">
<div className="flex items-center space-x-6">
        {user ? getMenu() : (
          <Link to="/" className="flex items-center text-gray-200 hover:text-gray-300 transition-transform transform hover:scale-105">
            <FaHome className="mr-2 text-2xl" /> Home
          </Link>
        )}
      </div>


      <div className="flex items-center space-x-6">
        {/* Show break buttons only if user is not an admin */}
        {user && user.role !== 'admin' && (
          <button
            onClick={isOnBreak ? handleEndBreak : handleStartBreak}
            className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 ease-in-out ${isOnBreak ? 'bg-red-400 hover:bg-red-500' : 'bg-green-400 hover:bg-green-500'} text-white shadow-md transform hover:scale-105`}
          >
            {isOnBreak ? 'End Break' : 'Start Break'}
          </button>
        )}
        {user && user.role !== 'admin' && (
          <>
            <button
              onClick={handleStartCheckIn}
              className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 ease-in-out ${hasCheckedIn ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-400 hover:bg-blue-500'} text-white shadow-md transform hover:scale-105`}
              disabled={hasCheckedIn || loadingCheckIn}
            >
              {hasCheckedIn ? 'Checked In' : loadingCheckIn ? 'Checking In...' : 'Start Check-In'}
            </button>
          </>
        )}


        <span className="text-lg font-medium tracking-wide">Welcome Back, {user ? user.name : 'Guest'}</span>

        {/* Profile Picture */}
        {user && user.profilePicture && (
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}/uploads/profile/${user.profilePicture.split('/').pop()}`}
            alt="Profile"
            className="w-14 h-14 rounded-full border-4 border-white shadow-lg transition-transform transform hover:scale-110"
          />
        )}
        {user && (
          <button onClick={toggleModal} className="relative">
            <FaBell className="text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1">
                {unreadCount}
              </span>
            )}
          </button>
        )}


        {/* Logout Button */}
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-2 bg-red-400 text-white rounded-full shadow-lg hover:bg-red-500 transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            <FaSignOutAlt className="mr-2 text-lg" /> Logout
          </button>
        )}
      </div>
      <BreakModal isVisible={isOnBreak}  onEndBreak={handleEndBreak} username={user ? user.name : 'Guest'} />
      <BellNotificationModal isOpen={modalOpen} notifications={notifications} onClose={toggleModal} user={user} />

    </div>
    </div>
    
  );



};

export default TopHeaderBar;
