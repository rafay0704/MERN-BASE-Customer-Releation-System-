import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { get } from "../services/ApiEndpoint.jsx";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { setBreakNotifications } from "../redux/AuthSlice";
import {
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineX,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi";
import BreakGraphModal from "../Modals/BreakGraphModal.jsx";
import ClipLoader from 'react-spinners/ClipLoader';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const AdminBreakManager = () => {
  const dispatch = useDispatch();
  const [userBreaks, setUserBreaks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [startDate, setStartDate] = useState(""); // New state for start date
  const [endDate, setEndDate] = useState("");   // New state for end date

  useEffect(() => {
    // Fetch today's breaks by default
    const today = new Date().toISOString().split("T")[0];
    getBreaksByDate(today, today); // Fetch for today's range by default
  
    socket.on("breakUpdated", (data) => {
      updateBreakEntries(data);
      if (data.data.isOnBreak) {
        dispatch(setBreakNotifications((prev) => [...prev, data.data]));
        toast.success(`${data.data.name} started a break.`);
      }
    });
  
    const interval = setInterval(() => {
      setUserBreaks((prevBreaks) => {
        return prevBreaks.map((user) => {
          if (user.isOnBreak && user.breaks.length > 0) {
            const ongoingBreak = user.breaks[user.breaks.length - 1];
            const currentDuration = calculateRealTimeBreakDuration(ongoingBreak.startTime);
            return { ...user, ongoingBreakDuration: currentDuration };
          }
          return user;
        });
      });
    }, 1000); 
  
    return () => clearInterval(interval);
  }, [dispatch]);

  const getBreaksByDate = async (start, end) => {
    setLoading(true);
    try {
      const response = await get(`/api/admin/breaks-by-date?startDate=${start}&endDate=${end}`);
      if (response.data.success) {
        setUserBreaks(response.data.data);
      } else {
        toast.error("Failed to fetch breaks.");
      }
    } catch (error) {
      toast.error("Error fetching breaks.");
    } finally {
      setLoading(false);
    }
  };

  

  const handleStartDateChange = (e) => {
    const selectedStartDate = e.target.value;
    setStartDate(selectedStartDate);
    if (selectedStartDate && endDate) {
      getBreaksByDate(selectedStartDate, endDate);
    }
  };

  const handleEndDateChange = (e) => {
    const selectedEndDate = e.target.value;
    setEndDate(selectedEndDate);
    if (startDate && selectedEndDate) {
      getBreaksByDate(startDate, selectedEndDate);
    }
  };

  const updateBreakEntries = (data) => {
    setUserBreaks((prevBreaks) => {
      const userIndex = prevBreaks.findIndex((u) => u.userId === data.userId);
      if (userIndex !== -1) {
        // Update only the specific user's breaks, do not overwrite the entire list
        const updatedBreaks = [...prevBreaks];
        updatedBreaks[userIndex] = { 
          ...updatedBreaks[userIndex], 
          breaks: data.data.breaks,  // Update breaks data only for the user
          isOnBreak: data.data.isOnBreak, // Update status
        };
        return updatedBreaks;
      } else {
        // If user not found, simply append new data
        return [...prevBreaks, data.data];
      }
    });
  };
  


  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    const today = new Date().toISOString().split("T")[0];
    getBreaksByDate(today, today); // Reset to today's range
  };
  const toggleExpand = (userId) => {
    setExpandedUserId((prevId) => (prevId === userId ? null : userId));
  };

  const calculateRealTimeBreakDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const duration = Math.floor((now - start) / 1000); // Duration in seconds
  
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
  
    let durationString = "";
  
    // Conditionally add hours
    if (hours > 0) {
      durationString += `${hours}h `;
    }
  
    // Conditionally add minutes
    if (minutes > 0 || hours > 0) { // Include minutes if hours exist
      durationString += `${minutes}m `;
    }
  
    // Always show seconds
    durationString += `${seconds}s`;
  
    return durationString;
  };
  
const calculateBreakDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  // For ongoing breaks, use the current time
  const end = endTime ? new Date(endTime) : new Date(); 

  // Prevent negative duration by checking if the end time is earlier than the start time
  const durationInSeconds = Math.max(Math.floor((end - start) / 1000), 0); // Ensure duration is not negative
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  let durationString = "";
  
  // Conditionally add hours
  if (hours > 0) {
    durationString += `${hours}h `;
  }
  
  // Conditionally add minutes
  if (minutes > 0 || hours > 0) {
    durationString += `${minutes}m `;
  }
  
  // Always show seconds
  durationString += `${seconds}s`;

  return durationString;
};

  
  const calculateTotalDuration = (breaks) => {
    const totalSeconds = breaks.reduce((total, breakEntry) => {
      if (breakEntry.endTime || breakEntry.startTime) {
        const start = new Date(breakEntry.startTime);
        const end = breakEntry.endTime ? new Date(breakEntry.endTime) : new Date(); // Handle ongoing break
        total += Math.floor((end - start) / 1000); // Add duration in seconds
      }
      return total;
    }, 0);
  
    if (totalSeconds === 0) return "0h 0m 0s";
  
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    let totalDurationString = "";
  
    // Conditionally add hours
    if (hours > 0) {
      totalDurationString += `${hours}h `;
    }
  
    // Conditionally add minutes
    if (minutes > 0 || hours > 0) { // Include minutes if hours exist
      totalDurationString += `${minutes}m `;
    }
  
    // Always show seconds
    totalDurationString += `${seconds}s`;
  
    return totalDurationString;
  };
  
  const sortedUserBreaks = userBreaks
    .filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.isOnBreak - a.isOnBreak);

  const handleViewGraphClick = () => {
    setShowGraphModal(true);
  };

  const handleCloseGraphModal = () => {
    setShowGraphModal(false);
  }
  
    const chartData = {
      labels: userBreaks
        .map((user) => user.name)
        .sort((a, b) => {
          const totalDurationA = userBreaks.find((user) => user.name === a).breaks.reduce((total, breakEntry) => {
            if (breakEntry.endTime) {
              const start = new Date(breakEntry.startTime);
              const end = new Date(breakEntry.endTime);
              total += Math.floor((end - start) / 1000); // Calculate duration in seconds
            }
            return total;
          }, 0);
    
          const totalDurationB = userBreaks.find((user) => user.name === b).breaks.reduce((total, breakEntry) => {
            if (breakEntry.endTime) {
              const start = new Date(breakEntry.startTime);
              const end = new Date(breakEntry.endTime);
              total += Math.floor((end - start) / 1000); // Calculate duration in seconds
            }
            return total;
          }, 0);
    
          return totalDurationB - totalDurationA; // Sort by descending duration
        }),
    
      datasets: [
        {
          label: "Total Break Duration",
          data: userBreaks
            .sort((a, b) => {
              const totalDurationA = a.breaks.reduce((total, breakEntry) => {
                if (breakEntry.endTime) {
                  const start = new Date(breakEntry.startTime);
                  const end = new Date(breakEntry.endTime);
                  total += Math.floor((end - start) / 1000); // Duration in seconds
                }
                return total;
              }, 0);
    
              const totalDurationB = b.breaks.reduce((total, breakEntry) => {
                if (breakEntry.endTime) {
                  const start = new Date(breakEntry.startTime);
                  const end = new Date(breakEntry.endTime);
                  total += Math.floor((end - start) / 1000); // Duration in seconds
                }
                return total;
              }, 0);
    
              return totalDurationB - totalDurationA; // Sort by descending duration
            })
            .map((user) => {
              const totalDuration = user.breaks.reduce((total, breakEntry) => {
                if (breakEntry.endTime) {
                  const start = new Date(breakEntry.startTime);
                  const end = new Date(breakEntry.endTime);
                  total += Math.floor((end - start) / 1000); // Duration in seconds
                }
                return total;
              }, 0);
              return totalDuration; // Return the total duration in seconds
            }),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          fill: true,
        },
      ],
    };
    const groupBreaksByDate = (breaks) => {
      const grouped = {};
    
      breaks.forEach((breakEntry) => {
        const startDate = new Date(breakEntry.startTime).toLocaleDateString();
    
        if (!grouped[startDate]) {
          grouped[startDate] = [];
        }
    
        grouped[startDate].push(breakEntry);
      });
    
      return Object.keys(grouped).map((date) => ({
        date,
        breaks: grouped[date],
      }));
    };
     

  return (
    <div className=" p-6 bg-gradient-to-b from-blue-30 to-white rounded-xl shadow-xl max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-blue-700">Manage Breaks</h1>
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <HiOutlineSearch className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
            />
          </div>
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <HiOutlineCalendar className="text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:ring focus:ring-blue-300"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="border border-gray-300 rounded-md px-4 py-2 focus:ring focus:ring-blue-300"
            />
            {(startDate || endDate) && (
              <HiOutlineX
                onClick={clearDateFilter}
                className="text-red-500 cursor-pointer"
              />
            )}
          </div>
          <button
        onClick={handleViewGraphClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
      >
        View Graph
      </button>
        </div>
      
      </div>
     
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 bg-white shadow rounded-lg text-center">
          <p className="text-gray-600 font-medium">Total Break Users</p>
          <p className="text-2xl font-bold">{userBreaks.length}</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg text-center">
          <p className="text-gray-600 font-medium">Currently On Break</p>
          <p className="text-2xl font-bold">
            {userBreaks.filter((user) => user.isOnBreak).length}
          </p>
        </div>
      </div>
      <div className="mb-6 text-center">
  <p className="text-lg text-gray-600">
    {startDate && endDate
      ? `Showing breaks from ${new Date(startDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })} to ${new Date(endDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`
      : `Showing breaks for ${new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`}
  </p>
</div>



      {/* Breaks Table */}
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <ClipLoader color="#4b9cd3" loading={loading} size={50} />
          </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full table-auto">
          <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Profile</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Total Breaks</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Total Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              
            {sortedUserBreaks.map((user) => (
  <React.Fragment key={user.userId}>
    <tr
      className={`hover:bg-gray-50 ${user.isOnBreak ? "bg-green-100" : ""}`}
    >
      <td className="px-6 py-4 text-center">
        {user.profilePicture ? (
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}/uploads/profile/${user.profilePicture.split('/').pop()}`}
            alt={`${user.name}'s profile`}
            className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-md"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300" />
        )}
      </td>
      <td className="px-6 py-4">{user.name}</td>
      <td className="px-6 py-4">
  {user.isOnBreak ? (
    <span className="text-red-600">{`${user.ongoingBreakDuration } (On Break)`}</span>
  ) : (
    <span className="text-green-600">Not on Break</span>
  )}
</td>

      <td className="px-6 py-4">{user.breaks.length}</td>
      <td className="px-6 py-4">
        {/* Display Total Duration for the User */}
        <span>{calculateTotalDuration(user.breaks)}</span>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => toggleExpand(user.userId)}
          className="text-blue-600 hover:text-blue-800"
        >
          {expandedUserId === user.userId ? <HiChevronUp /> : <HiChevronDown />}
        </button>
      </td>
     
    </tr>

    {expandedUserId === user.userId && (
  <tr>
    <td colSpan="6" className="px-6 py-4 bg-gray-50">
      <div className="space-y-8">
        {/* Grouping breaks by date */}
        {groupBreaksByDate(user.breaks).map((dateGroup, index) => {
          const date = new Date(dateGroup.date);
          const totalDuration = calculateTotalDuration(dateGroup.breaks);

          return (
            <div key={index} className="w-full">
              {/* Display Date and Total Duration */}
              <div className="text-2xl font-semibold text-gray-800 mb-4">
                {date.toLocaleDateString()} - 
                <span className="text-blue-600"> Total Duration: {totalDuration}</span>
              </div>

              {/* Separator line */}
              <div className="border-t-2 border-gray-300 mb-6" />

              {/* Display the individual breaks for this date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {dateGroup.breaks.map((breakEntry, idx) => {
                  const startTime = new Date(breakEntry.startTime);
                  const endTime = breakEntry.endTime ? new Date(breakEntry.endTime) : null;
                  const duration = calculateBreakDuration(breakEntry.startTime, breakEntry.endTime);

                  return (
                    <div
                      key={idx}
                      className="bg-white p-6 shadow-md rounded-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <div className="text-xl font-semibold text-gray-800 mb-2">Break {idx + 1}</div>
                      <div className="flex items-center text-sm text-gray-700 mb-2">
                        <i className="fa fa-clock mr-2 text-gray-500"></i>
                        <strong>Start: </strong>{startTime.toLocaleString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-700 mb-2">
                        <i className="fa fa-clock mr-2 text-gray-500"></i>
                        <strong>End: </strong>{endTime ? endTime.toLocaleString() : "Ongoing"}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <i className="fa fa-hourglass-half mr-2 text-gray-500"></i>
                        <strong>Duration: </strong>{duration}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Separator line after each date group */}
              <div className="border-t-2 border-gray-300 mt-6" />
            </div>
          );
        })}
      </div>
    </td>
  </tr>
)}





  </React.Fragment>
))}

            </tbody>
          </table>
        </div>
      )}


<BreakGraphModal
        showModal={showGraphModal}
        handleClose={handleCloseGraphModal}
        chartData={chartData}
      />
    
      
    </div>
  );
};

export default AdminBreakManager;
