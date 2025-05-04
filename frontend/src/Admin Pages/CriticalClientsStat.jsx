import React, { useEffect, useState } from "react";
import { get } from "../services/ApiEndpoint";

const CriticalClientsStat = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pictures, setPictures] = useState({}); // To store profile pictures

  const [selectedDate, setSelectedDate] = useState('');
  const [cssUser, setCssUser] = useState('');
  const [clients, setClients] = useState([]);

  // Fetch the critical clients stats and profile pictures
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await get("/api/admin/critical-stats");
        if (response.data.success) {
          setStats(response.data.stats);
          // Fetch profile pictures for each name
          await fetchProfilePictures(response.data.stats);
        } else {
          setError("Failed to fetch critical client stats.");
        }
      } catch (err) {
        setError("An error occurred while fetching stats.");
      } finally {
        setLoading(false);
      }
    };

    const fetchProfilePictures = async (stats) => {
      const names = stats.map((stat) => stat.name); // Extract the names for the API calls
      const fetchedPictures = {};
      
      const promises = names.map(async (name) => {
        try {
          const response = await get(`/api/auth/profile-picture/${name}`);
          if (response.data.success) {
            fetchedPictures[name] = `${import.meta.env.VITE_BACKEND_URL}${response.data.profilePicture}`;
          } else {
            console.error(`Failed to fetch profile picture for ${name}`);
          }
        } catch (error) {
          console.error(`Error fetching profile picture for ${name}:`, error);
        }
      });

      // Wait for all profile picture API calls to finish
      await Promise.all(promises);
      setPictures(fetchedPictures);
    };

    fetchStats();
  }, []);

  const fetchBatchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Send selectedDate and cssUser in the request body as a POST request
      const response = await fetch('/api/admin/batch-data-by-date-and-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedDate, cssUser }), // Send selectedDate and cssUser in the body
      });
      const data = await response.json();
  
      if (data.success) {
        setClients(data.clients);
      } else {
        setError('No data found for the selected date and CSS User');
      }
    } catch (err) {
      setError('An error occurred while fetching the batch data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleUserChange = (e) => setCssUser(e.target.value);

  // Use useEffect to fetch batch data when date or user changes
  useEffect(() => {
    if (selectedDate && cssUser) {
      fetchBatchData();
    }
  }, [selectedDate, cssUser]);

  // Handle loading state for both sections
  if (loading) return <div className="text-center text-lg text-gray-500 mt-6">Loading...</div>;

  // Handle error state
  if (error) return <div className="text-red-600 text-center text-lg mt-6">{error}</div>;

  return (
    <div className="container mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-semibold text-center text-gray-900 mb-6">Critical Clients Statistics</h2>

      <div className="overflow-x-auto rounded-lg shadow-2xl p-4">
        <table className="min-w-full table-auto bg-white rounded-lg shadow-md">
          <thead className="bg-indigo-600 text-white text-xs sm:text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Profile</th>
              <th className="px-6 py-4 text-left font-semibold">CSS User</th>
              <th className="px-6 py-4 text-left font-semibold">Total Critical Clients</th>
              <th className="px-6 py-4 text-left font-semibold">Current Batch Count</th>
              <th className="px-6 py-4 text-left font-semibold">Remaining Critical Clients</th>
              <th className="px-6 py-4 text-left font-semibold">Cycle Count</th>
              <th className="px-6 py-4 text-left font-semibold">Last Batch Date</th> {/* New column for Last Batch Date */}
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-indigo-100 transition-all duration-300 transform hover:scale-105`}
              >
                <td className="px-6 py-4">
                  {pictures[stat.name] ? (
                    <img
                      src={pictures[stat.name]} // Use the fetched profile picture URL
                      alt={`${stat.name}'s profile`}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300" />
                  )}
                </td>
                <td className="px-6 py-4 text-gray-700">{stat.name}</td>
                <td className="px-6 py-4 text-gray-700">{stat.totalClients}</td>
                <td className="px-6 py-4 text-gray-700">{stat.currentBatchCount}</td>
                <td className="px-6 py-4 text-gray-700">{stat.remainingClients}</td>
                <td className="px-6 py-4 text-gray-700">{stat.cycleCount}</td>
                <td className="px-6 py-4 text-gray-700">
                  {stat.lastBatchDate ? new Date(stat.lastBatchDate).toLocaleString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch Data Table */}
      {/* <div className="mt-8">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-4">Batch Data for Selected Date and CSS User</h2>
        <div className="flex space-x-4 mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border p-2"
          />
          <input
            type="text"
            placeholder="Enter CSS User"
            value={cssUser}
            onChange={handleUserChange}
            className="border p-2"
          />
          <button onClick={fetchBatchData} className="bg-blue-500 text-white p-2">Fetch Data</button>
        </div>

        <div>
          {clients.length > 0 ? (
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th>MOU No</th>
                  <th>Customer Name</th>
                  <th>Visa Category</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Latest Comment</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={index}>
                    <td>{client.Mou_no}</td>
                    <td>{client.CustomerName}</td>
                    <td>{client.VisaCategory}</td>
                    <td>{client.Phone}</td>
                    <td>{client.Email}</td>
                    <td>{client.Branch}</td>
                    <td>{client.LatestComment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>No clients found for the selected batch.</div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default CriticalClientsStat;
