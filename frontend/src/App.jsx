import React, { useEffect } from 'react';
// import './App.css'; // Adjust the path to your CSS file
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Admin from './Admin Pages/Admin.jsx';
import CSS from './CSS Pages/CSS.jsx';
import AdminLayout from './Layouts/AdminLayout.jsx';
import UserLayout from './Layouts/UserLayout.jsx';
import PublicLayout from './Layouts/PublicLayout.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from './redux/AuthSlice.jsx';
import AdminDashboard from './Admin Pages/AdminDashboard.jsx';
import AllClients from './Admin Pages/AllClients.jsx';
import AllUsers from './Admin Pages/AllUsers.jsx';
import MyClients from './CSS Pages/MyClients.jsx';
import TaskAssign from './CSS Pages/TaskAssign.jsx';
import CssDashboard from './CSS Pages/CssDashboard.jsx';
import Client from './Admin Pages/Client.jsx';
import AllTasks from './Admin Pages/AllTasks.jsx';
import DailyClients from './CSS Pages/DailyClients.jsx';
import CSSBatch from './Admin Pages/CSSBatch.jsx';
import AdminBreakManager from './Admin Pages/AdminBreakManager.jsx';
import CheckInHistory from './Admin Pages/CheckInHistory.jsx';
import SoftwareEngineerLayout from './Layouts/SoftwareEnginnerLayout.jsx';
import SubmissionLayout from './Layouts/SubmissionLayout.jsx';
import CSSLayout from './Layouts/CSSLayout.jsx';
import BusinessPlanerLayout from './Layouts/BusinessPlannerLayout.jsx';
import TrainerLayout from './Layouts/TrainerLayout.jsx';
import CommitmentNotifications from './Modals/CommitmentNotifications.jsx';
import CriticalClients from './CSS Pages/CriticalClients.jsx';
import CriticalClientsStat from './Admin Pages/CriticalClientsStat.jsx';
import AdminCheckManager from './Admin Pages/AdminCheckManager.jsx';
import ClientStatuses from './Admin Pages/ClientStatuses.jsx';
import LeaveCalendar from './Admin Pages/LeaveCalendar.jsx';
import MarqueeBanner from './MarqueeBanner.jsx'

const App = () => {
  const user = useSelector((state) => state.Auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updateUser());
  }, [user, dispatch]);

  return (
    <>
      <BrowserRouter>

      
        <Routes>



          <Route path='/' element={<UserLayout />}>
            
          </Route>
         
          <Route path='/' element={<PublicLayout />}>
            <Route path='login' element={<Login />} />
            <Route path='register' element={<Register />} />
          </Route>
                                            {/* Admin LAYOUT */}

          <Route path='/admin' element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path='allclients' element={<AllClients />} />
            <Route path='admindashboard' element={<AdminDashboard />} />
            <Route path='allusers' element={<AllUsers />} />
            <Route path='client/:id' element={<Client userType="admin" />} />
            <Route path='alltasks' element={<AllTasks />} />
            <Route path='adminbreak' element={<AdminBreakManager />} />
            <Route path='cssbatch' element={<CSSBatch />} />
            <Route path='checkin' element={<CheckInHistory />} />
            <Route path='criticalclientstat' element={<CriticalClientsStat />} />
            <Route path='admincheckmanager' element={<AdminCheckManager />} />
            <Route path='clientstatuses' element={<ClientStatuses />} />
            <Route path='calender' element={<LeaveCalendar />} />
          </Route>
                  <Route path='/css' element={<CSSLayout />}>
          <Route index element={<CssDashboard />} />
          <Route path='myclients' element={<MyClients />} />
          <Route path='client/:id' element={<Client userType="css" />} />
          <Route path='dailyclients' element={<DailyClients/>} />
          <Route path='taskassign' element={<TaskAssign />} />
          <Route path='alltasks' element={<AllTasks />} />
          <Route path='criticalclients' element={<CriticalClients />} />

        
          
          
        </Routes>
      </BrowserRouter>
      <CommitmentNotifications/>
      <ToastContainer />
    </>
  );
};

export default App;
