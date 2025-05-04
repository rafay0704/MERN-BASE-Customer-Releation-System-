import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { get, post, delet, put } from "../services/ApiEndpoint";

const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "pending",
  });
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [leaveDetails, setLeaveDetails] = useState(null);

  // Fetch leave bookings
  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await get("/api/auth/leaves");
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError("Failed to fetch leaves.");
    }
  };

  // Fetch users for the Name dropdown and filter out inactive users and Software Engineers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await get("/api/admin/getuser");
        const cssUsers = response.data.users
          .filter(
            (user) =>
              user.status !== "inactive" 
          )
          .map((user) => ({
            value: user.name,
            label: `${user.name} (${user.designation})`,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setUsers(cssUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate || !form.reason) {
      setError("Please fill in all the fields.");
      return;
    }
    try {
      await post("/api/auth/bookleaves", form);
      fetchLeaves(); // refresh the list after submission
    } catch (err) {
      console.error("Error creating leave:", err);
      setError("Failed to book leave.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await delet(`/api/auth/leaves/${id}`);
      fetchLeaves(); // refresh the list after deletion
    } catch (err) {
      console.error("Error deleting leave:", err);
      setError("Failed to delete leave.");
    }
  };

  // Update leave status via dropdown change
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await put(`/api/auth/leaves/${id}`, { status: newStatus });
      fetchLeaves(); // refresh the list after update
    } catch (err) {
      console.error("Error updating leave status:", err);
      setError("Failed to update leave status.");
    }
  };

  // Returns a CSS class for a calendar tile based on bookings and their statuses.
  const getTileClassName = (date) => {
    const bookingsForDate = leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return date >= start && date <= end;
    });
    if (bookingsForDate.length > 1) {
      return "bg-purple-200 text-purple-600"; // conflict: multiple bookings
    } else if (bookingsForDate.length === 1) {
      const status = bookingsForDate[0].status;
      if (status === "approved") return "bg-green-200 text-green-600";
      if (status === "pending") return "bg-yellow-200 text-yellow-600";
      if (status === "rejected") return "bg-red-200 text-red-600";
    }
    return "";
  };

  // Helper to set input background based on the selected date's booking (if any)
  const getInputDateStyle = (dateStr) => {
    if (!dateStr) return {};
    const date = new Date(dateStr);
    const bookings = leaves.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return date >= start && date <= end;
    });
    if (bookings.length === 0) return {};
    if (bookings.length > 1)
      return { backgroundColor: "#E0BBE4" }; // light purple for conflicts
    const status = bookings[0].status;
    if (status === "approved") return { backgroundColor: "#C6F6D5" }; // light green
    if (status === "pending") return { backgroundColor: "#FEFCBF" }; // light yellow
    if (status === "rejected") return { backgroundColor: "#FED7D7" }; // light red/pink
    return {};
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // When a date is clicked, display details for a leave covering that date (if any)
  const handleDateClick = (date) => {
    const booking = leaves.find((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return date >= start && date <= end;
    });
    if (booking) {
      setSelectedDate(date);
      setLeaveDetails(booking);
    } else {
      setLeaveDetails(null);
    }
  };

  // Check for date clashes – if a date has more than one booking.
  const getDateConflicts = () => {
    const dateMap = {};
    leaves.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toDateString();
        if (!dateMap[dateStr]) dateMap[dateStr] = [];
        dateMap[dateStr].push(leave);
      }
    });
    return Object.entries(dateMap).filter(
      ([, bookings]) => bookings.length > 1
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-semibold text-center mb-6 text-blue-600">
        Leave Calendar
      </h2>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      <div className="flex flex-col sm:flex-row justify-between mb-8 gap-6">
        {/* Leave Booking Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full sm:w-1/2 bg-white p-6 rounded-lg shadow-lg shadow-gray-300"
        >
          <h3 className="text-2xl font-semibold mb-4 text-blue-500">
            Book Leave
          </h3>
          <div className="mb-4">
            <select
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select Name
              </option>
              {users.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
              style={getInputDateStyle(form.startDate)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              style={getInputDateStyle(form.endDate)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Reason"
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            Book Leave
          </button>
        </form>

        {/* Calendar Component */}
        <div className="w-full sm:w-1/2">
          <Calendar
            className="border border-gray-300 rounded-lg w-full shadow-md"
            tileClassName={({ date }) => getTileClassName(date)}
            onClickDay={handleDateClick}
          />
        </div>
      </div>

      {/* Leave Details Display */}
      {leaveDetails && (
        <div className="bg-white shadow-lg rounded-lg p-4 mt-4 max-w-lg mx-auto">
          <h4 className="text-xl font-semibold mb-2 text-blue-500">
            Leave Details for {formatDate(selectedDate)}
          </h4>
          <p>
            <strong>Name:</strong> {leaveDetails.name}
          </p>
          <p>
            <strong>Reason:</strong> {leaveDetails.reason}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {leaveDetails.status.charAt(0).toUpperCase() +
              leaveDetails.status.slice(1)}
          </p>
          <p>
            <strong>Duration:</strong>{" "}
            {calculateLeaveDays(leaveDetails.startDate, leaveDetails.endDate)}{" "}
            days
          </p>
        </div>
      )}

      {/* List of Booked Leaves with Status Update Dropdown */}
      <ul className="bg-white shadow-lg rounded-lg p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4 text-blue-500">
          Booked Leaves
        </h3>
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <li
              key={leave._id}
              className="mb-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg shadow-md"
            >
              <div>
                <p className="font-semibold text-gray-800">{leave.name}</p>
                <p>
                  {formatDate(new Date(leave.startDate))} to{" "}
                  {formatDate(new Date(leave.endDate))}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2 sm:mt-0">
                {/* Dropdown to update leave status */}
                <select
                  value={leave.status}
                  onChange={(e) =>
                    handleStatusUpdate(leave._id, e.target.value)
                  }
                  className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => handleDelete(leave._id)}
                  className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        ) : (
          <p>No leaves booked yet.</p>
        )}
      </ul>

      {/* Conflict Display Section */}
      {getDateConflicts().length > 0 && (
        <div className="bg-red-100 border border-red-300 p-4 rounded-lg mt-6">
          <h3 className="text-xl font-semibold mb-2 text-red-600">
            Booking Clashes Detected
          </h3>
          {getDateConflicts().map(([dateStr, bookings]) => (
            <div key={dateStr} className="mb-2">
              <p className="font-semibold">{dateStr}:</p>
              {bookings.map((booking) => (
                <p key={booking._id} className="text-sm">
                  - {booking.name} (
                  {formatDate(new Date(booking.startDate))} to{" "}
                  {formatDate(new Date(booking.endDate))})
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;
