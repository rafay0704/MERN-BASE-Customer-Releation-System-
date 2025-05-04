import React, { useState, useEffect } from "react";
import { post, get, put } from "../services/ApiEndpoint";
import moment from "moment";
import Confetti from "react-confetti";
import { toast } from 'react-toastify';

const CriticalClients = () => {
  const [batch, setBatch] = useState([]);
  const [batchDate, setBatchDate] = useState(null);
  const [clients, setClients] = useState([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [comments, setComments] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remainingClients, setRemainingClients] = useState(0);

  // Fetch the last critical batch data
  const fetchLastCriticalBatch = async () => {
    setLoadingFetch(true);
    setError("");
    try {
      const response = await get("/api/css/critical-batch/last");
      if (response.data.success) {
        setBatch(response.data.batch);
        setBatchDate(response.data.batchDate);
        setClients(response.data.clients);
        setRemainingClients(response.data.clients.length);  // Set remaining client count

        setSuccessMessage("Critical batch fetched successfully!");
      } else {
        setError("Failed to fetch the last critical batch.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch last critical batch");
    } finally {
      setLoadingFetch(false);
    }
  };

  // Fetch the last critical batch on component mount
  useEffect(() => {
    fetchLastCriticalBatch();
  }, []);

 
  

  // Fetch the user stats
  const fetchUserStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await get("/api/css/critical-client-stats");
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError("Failed to fetch critical client stats.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching stats.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchUserStats();
  }, []);

// Handle medium change for a specific client
const handleMediumChange = async (Mou_no, newMedium) => {
  try {
    const response = await put(`/api/css/critical-batch/update-medium/${Mou_no}`, { medium: newMedium });

    if (response.data.success) {
      // Update client medium in the state
      setClients(prevClients =>
        prevClients.map(client =>
          client.Mou_no === Mou_no ? { ...client, medium: newMedium } : client
        )
      );
      
      // Fetch the latest critical batch data after medium is updated
      await fetchLastCriticalBatch();
      
      toast.success("Medium updated successfully!");
    } else {
      console.error("API Error:", response.data); // Log the API response error
      toast.error("Failed to update medium.");
    }
  } catch (err) {
    console.error("Request Failed:", err); // Log the error in console
    toast.error(err.response?.data?.message || "Error updating medium.");
  }
};



  // Handle generation of new critical batch
  const handleGenerateBatch = async () => {
    setLoadingGenerate(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await post("/api/css/critical-batch/generate");
      const batchData = response.data.batch || [];
      setBatch(batchData);
      setBatchDate(new Date());
      setClients(batchData);
      setRemainingClients(batchData.length);  // Set remaining client count

      setSuccessMessage("Critical client batch generated successfully!");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      fetchLastCriticalBatch(); // Fetch the batch data again after generation
      fetchUserStats(); // Fetch the updated stats after generating the batch
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate critical client batch");
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Handle comment change for a specific client
  const handleCommentChange = (clientMouNo, value) => {
    setComments((prev) => ({ ...prev, [clientMouNo]: value }));
  };

  // Handle adding a comment for a specific client
  const handleAddComment = async (clientMouNo) => {
    const comment = comments[clientMouNo];
    if (!comment) return;

    try {
        const response = await post(`/api/css/client/${clientMouNo}/comment`, { comment });
        const updatedClient = response.data.client;

        // Remove the client from the state after commenting
        setClients(prevClients =>
            prevClients.filter(client => client.Mou_no !== updatedClient.Mou_no)
        );

        // Update the remaining client count
        setRemainingClients(prevCount => prevCount - 1);

        // Clear the input field for the comment
        setComments(prev => ({ ...prev, [clientMouNo]: "" }));

        // Show success toast notification
        toast.success("Comment added successfully! Client removed from list.");

    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to add comment");
    }
};

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">Critical Clients Batch</h1>

      {/* Button to generate new batch */}
      <div className="flex justify-center mb-4 space-x-2">
        <button
          onClick={handleGenerateBatch}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg shadow hover:shadow-xl hover:from-indigo-600 hover:to-blue-600 transition duration-300"
          disabled={loadingGenerate}
        >
          {loadingGenerate ? "Processing..." : "Generate New Batch"}
        </button>
      </div>

      {/* Success and error messages */}
      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
      {successMessage && <p className="text-green-600 text-center font-semibold">{successMessage}</p>}
      <div className="text-center mt-6">
  
  <p className="text-lg font-semibold text-blue-600">
    Remaining Clients to Comment: <span className="font-bold text-green-800">{remainingClients}</span>
  </p>
</div>



      {/* Display Stats Table */}
      {stats && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-2 text-left">Total Critical Clients</th>
                <th className="px-4 py-2 text-left">Current Batch Count</th>
                <th className="px-4 py-2 text-left">Remaining Critical Clients</th>
                <th className="px-4 py-2 text-left">Cycle Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2">{stats.totalClients}</td>
                <td className="px-4 py-2">{stats.currentBatchCount}</td>
                <td className="px-4 py-2">{stats.remainingClients}</td>
                <td className="px-4 py-2">{stats.cycleCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Display the fetched critical batch data */}
      {loadingFetch ? (
        <p className="text-blue-600 text-center">Loading data...</p>
      ) : (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-2 text-left">MOU No</th>
                <th className="px-4 py-2 text-left">Customer Name</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Visa Category</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Language</th>
                <th className="px-4 py-2 text-left">Latest Comment</th>
                <th className="px-4 py-2 text-left">Medium</th>
                <th className="px-4 py-2 text-left">Add Comment</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{client.Mou_no}</td>
                    <td className="px-4 py-2">{client.CustomerName}</td>
                    <td className="px-4 py-2">{moment(client.Date).format("MM/DD/YYYY")}</td>
                    <td className="px-4 py-2">{client.VisaCategory}</td>
                    <td className="px-4 py-2">{client.Phone}</td>
                    <td className="px-4 py-2">{client.Email}</td>
                    <td className="px-4 py-2">{client.Status}</td>
                    <td className="px-4 py-2">{client.Language}</td>
                    <td className="px-4 py-2">
                    {client.LatestComment || "No comment available"}<br />
                    <small className="text-gray-500">
                      <em>by {client.CommentBy || "Unknown"} on {client.CommentTimestamp 
        ? moment(client.CommentTimestamp).format('MM/DD/YYYY, hh:mm A') 
        : "No timestamp available"
      }</em>
                    </small>
                  </td>   
                    
                    <td className="px-2 py-1">
  <select
    value={client.Medium || 'Select Medium'}  // Use 'Select Medium' if medium is null or undefined
    onChange={(e) => handleMediumChange(client.Mou_no, e.target.value)}
    className="border border-gray-300 rounded-lg px-1 py-1 focus:ring-2 focus:ring-blue-500 transition duration-200"
  >
    <option value="Emailed">Emailed</option>
    <option value="Called & Emailed">Called & Emailed</option>
    <option value="Emailed But Call No Response">Emailed & Call No Response</option>
  </select>
</td>


                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={comments[client.Mou_no] || ""}
                        onChange={(e) => handleCommentChange(client.Mou_no, e.target.value)}
                        className="border p-2 rounded"
                        placeholder="Add a comment"
                      />
                      <button
                        onClick={() => handleAddComment(client.Mou_no)}
                        className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-4 py-2 text-center">No clients found in this batch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CriticalClients;
