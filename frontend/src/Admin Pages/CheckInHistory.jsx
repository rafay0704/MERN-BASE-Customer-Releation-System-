import React, { useState, useEffect, useMemo, useCallback } from "react";
import { get } from "../services/ApiEndpoint";
import { io } from "socket.io-client";
import ClipLoader from "react-spinners/ClipLoader";
import { FaRegClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const socket = io(import.meta.env.VITE_BACKEND_URL);

const CheckInHistory = () => {
  const [dates, setDates] = useState([new Date().toISOString().split("T")[0]]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper function to generate date range
  const getThisWeekDates = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday of this week
  
    const datesArray = [];
    for (let date = firstDayOfWeek; date <= today; date.setDate(date.getDate() + 1)) {
      // Exclude Sundays (day 0)
      if (date.getDay() !== 0) {
        datesArray.push(new Date(date).toISOString().split("T")[0]);
      }
    }
    return datesArray;
  };
  
  const getLastWeekDates = () => {
    const today = new Date();
    const firstDayOfLastWeek = new Date(today);
    firstDayOfLastWeek.setDate(today.getDate() - today.getDay() - 6); // Monday of last week
    const lastDayOfLastWeek = new Date(today);
    lastDayOfLastWeek.setDate(today.getDate() - today.getDay()); // Sunday of last week
  
    const datesArray = [];
    for (let date = firstDayOfLastWeek; date <= lastDayOfLastWeek; date.setDate(date.getDate() + 1)) {
      // Exclude Sundays (day 0)
      if (date.getDay() !== 0) {
        datesArray.push(new Date(date).toISOString().split("T")[0]);
      }
    }
    return datesArray;
  };
  
  const getThisMonthDates = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)); // First day of the current month (UTC+0)
    
    const datesArray = [];
    for (let date = firstDayOfMonth; date <= today; date.setDate(date.getDate() + 1)) {
      const localDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
      if (localDate.getDay() !== 0) { // Exclude Sundays
        datesArray.push(localDate.toISOString().split("T")[0]);
      }
    }
    return datesArray;
  };
  
  const getLastMonthDates = () => {
    const today = new Date();
    const firstDayOfLastMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, 1)); // First day of last month (UTC+0)
    const lastDayOfLastMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 0)); // Last day of last month (UTC+0)
    
    const datesArray = [];
    for (let date = firstDayOfLastMonth; date <= lastDayOfLastMonth; date.setDate(date.getDate() + 1)) {
      const localDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
      if (localDate.getDay() !== 0) { // Exclude Sundays
        datesArray.push(localDate.toISOString().split("T")[0]);
      }
    }
    return datesArray;
  };
  

  
  

  // Fetch check-ins for selected dates
  const fetchCheckIns = useCallback(async () => {
    setLoading(true);
    setError(""); // Clear previous errors
    let allCheckIns = {};

    try {
      await Promise.all(
        dates.map(async (date) => {
          try {
            const response = await get(`/api/admin/check-ins-by-date?date=${date}`);
            if (response.data.success) {
              response.data.data.forEach((entry) => {
                if (!allCheckIns[entry.userId]) {
                  allCheckIns[entry.userId] = { ...entry, checkIns: [...entry.checkIns] };
                } else {
                  allCheckIns[entry.userId].checkIns.push(...entry.checkIns);
                }
              });
            }
          } catch {
            console.error(`Failed to fetch check-ins for ${date}`);
          }
        })
      );

  // Ensure users are marked absent for dates with no check-ins
dates.forEach((date) => {
  Object.keys(allCheckIns).forEach((userId) => {
    if (!allCheckIns[userId].checkIns.some((checkIn) => new Date(checkIn.checkInTime).toISOString().split("T")[0] === date)) {
      // Add a missing check-in with "Absent" status for that date
      allCheckIns[userId].checkIns.push({ checkInTime: null, status: "Absent", date });
    }
  });
});

      // Convert object back to array
      setCheckIns(Object.values(allCheckIns));
    } catch {
      setError("Failed to fetch check-ins");
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const updateCheckIns = (data) => {
      if (dates.includes(new Date().toISOString().split("T")[0])) {
        setCheckIns((prev) => {
          const updatedCheckIns = prev.some((checkIn) => checkIn.userId === data.userId)
            ? prev.map((checkIn) => (checkIn.userId === data.userId ? data : checkIn))
            : [...prev, data];
          return updatedCheckIns;
        });
      }
    };

    socket.on("checkInStatusUpdated", updateCheckIns);
    return () => socket.off("checkInStatusUpdated", updateCheckIns);
  }, [dates]);

  // Memoized sorted check-ins
  const sortedCheckIns = useMemo(() => {
    return checkIns
      .map((checkIn) => ({
        ...checkIn,
        checkIns: checkIn.checkIns.sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime)),
      }))
      .sort((a, b) => new Date(a.checkIns[0]?.checkInTime) - new Date(b.checkIns[0]?.checkInTime));
  }, [checkIns]);

  // Handle date selection
  const handleDateChange = (event) => {
    const selectedDate = event.target.value;
    setDates((prevDates) =>
      prevDates.includes(selectedDate) ? prevDates.filter((d) => d !== selectedDate) : [...prevDates, selectedDate]
    );
  };

  // Handle shortcut filters
  const handleShortcutFilter = (filter) => {
    switch (filter) {
      case "thisWeek":
        setDates(getThisWeekDates());
        break;
      case "lastWeek":
        setDates(getLastWeekDates());
        break;
      case "thisMonth":
        setDates(getThisMonthDates());
        break;
      case "lastMonth":
        setDates(getLastMonthDates());
        break;
      case "clear":
        setDates([new Date().toISOString().split("T")[0]]);
        break;
      default:
        break;
    }
  };
  const formatDate = (date) => {
    const options = { 
      weekday: 'long', // Adds day of the week (e.g., "Monday")
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };
  
  return (
    <div className="p-6 bg-gradient-to-b from-green-60 to-blue-60 rounded-xl shadow-xl max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-center text-indigo-700">Check-In History</h1>
  
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <input
          type="date"
          onChange={handleDateChange}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-md w-40 focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={fetchCheckIns} className="px-6 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition">
          Refresh Check-ins
        </button>
  
        {/* Shortcut Filters */}
        <button onClick={() => handleShortcutFilter("thisWeek")} className="px-4 py-2 bg-green-500 text-white rounded-full">This Week</button>
        <button onClick={() => handleShortcutFilter("lastWeek")} className="px-4 py-2 bg-orange-500 text-white rounded-full">Last Week</button>
        <button onClick={() => handleShortcutFilter("thisMonth")} className="px-4 py-2 bg-purple-500 text-white rounded-full">This Month</button>
        <button onClick={() => handleShortcutFilter("lastMonth")} className="px-4 py-2 bg-blue-500 text-white rounded-full">
          Last Month
        </button>
  
        <button onClick={() => handleShortcutFilter("clear")} className="px-4 py-2 bg-red-500 text-white rounded-full">Clear Filter</button>
      </div>
  
      <p className="text-lg font-medium text-gray-700 text-center">
        Showing check-ins for:{" "}
        <span className="font-bold">
          {dates.map((date) => formatDate(date)).join(", ")}
        </span>
      </p>
  
      {loading && <ClipLoader color="#4b9cd3" loading={loading} size={50} className="block mx-auto my-4" />}
  
      {error && (
        <div className="text-red-500 text-center mb-4">
          <p>{error}</p>
          <button onClick={fetchCheckIns} className="text-blue-500 underline">
            Try Again
          </button>
        </div>
      )}
  
      {sortedCheckIns.length > 0 ? (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-4 text-left border-b">Profile</th>
                <th className="px-6 py-4 text-left border-b">Name</th>
                <th className="px-6 py-4 text-left border-b">Total Dates</th>
                <th className="px-6 py-4 text-left border-b">Present</th>
                <th className="px-6 py-4 text-left border-b">Absent</th>
                <th className="px-6 py-4 text-left border-b">Attendance %</th>
                <th className="px-6 py-4 text-left border-b">Check-In Time</th>
                <th className="px-6 py-4 text-left border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedCheckIns.map((checkIn, index) => {
                const totalDates = dates.length;
                const presentDays = checkIn.checkIns.filter((ci) => ci.status !== "Absent").length;
                const absentDays = totalDates - presentDays;
                const attendancePercentage = ((presentDays / totalDates) * 100).toFixed(2);
  
                return (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 border-b">
                      {checkIn.profilePicture ? (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}/uploads/profile/${checkIn.profilePicture.split("/").pop()}`}
                          alt={`${checkIn.name}'s profile`}
                          className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 border-b">{checkIn.name}</td>
                    <td className="px-6 py-4 border-b">{totalDates}</td>
                    <td className="px-6 py-4 border-b">{presentDays}</td>
                    <td className="px-6 py-4 border-b">{absentDays}</td>
                    <td className="px-6 py-4 border-b">{attendancePercentage}%</td>
  
                    <td className="px-6 py-4 border-b">
                      {checkIn.checkIns.map((time, idx) => {
                        // If no check-in time is present, mark the user as absent and show the formatted date
                        if (!time.checkInTime) {
                          return (
                            <div key={idx} className="text-red-500">{formatDate(time.date)}</div>
                          );
                        }
                        // If check-in time is present, show the formatted check-in time
                        return <div key={idx}>{new Date(time.checkInTime).toLocaleString()}</div>;
                      })}
                    </td>
  
                    <td className="px-6 py-4 border-b">
                      {checkIn.checkIns.map((time, idx) => {
                        if (time.status === "Absent") {
                          return <div key={idx} className="text-red-500">Absent</div>;
                        }
  
                        const { status, icon, lateTime } = compareCheckInTime(time.checkInTime);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            {icon}{" "}
                            <span className={status === "Late" ? "text-red-500" : "text-green-500"}>{status}</span>{" "}
                            {lateTime && <span className="text-red-500">{lateTime}</span>}
                          </div>
                        );
                      })}
                    </td>
  
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600">No check-ins available</p>
      )}
    </div>
  );
  
  
};



// Utility function to compare check-in time
const compareCheckInTime = (checkInTime) => {
  const time = new Date(checkInTime);
  const early = new Date(time).setHours(10, 0, 0, 0);
  const onTime = new Date(time).setHours(10, 15, 0, 0);

  if (time < early) return { status: "Early", icon: <FaCheckCircle className="text-green-500" /> };
  if (time <= onTime) return { status: "On Time", icon: <FaRegClock className="text-blue-500" /> };

  const diff = Math.floor((time - onTime) / 60000);
  return { status: "Late", icon: <FaTimesCircle className="text-red-500" />, lateTime: `${diff} min${diff > 1 ? "s" : ""}` };
};

export default CheckInHistory;
