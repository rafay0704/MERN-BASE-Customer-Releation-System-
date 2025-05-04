import React, { useState, useEffect, useMemo, useCallback } from "react";
import { get } from "../services/ApiEndpoint";
import { FaUser, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const AdminDashboardComponent = () => {
  const [clients, setClients] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [criticalHighlights, setCriticalHighlights] = useState([]);
  const [commitmentsPage, setCommitmentsPage] = useState(1);
  const [criticalHighlightsPage, setCriticalHighlightsPage] = useState(1);
  const [commitmentFilters, setCommitmentFilters] = useState({ status: "not done", name: "", clientName: "", mouNo: "" });
  const [criticalHighlightFilters, setCriticalHighlightFilters] = useState({ status: "not catered", highlight: "", clientName: "", mouNo: "" });

  // Fetch clients and related data
  const fetchClients = useCallback(async () => {
    try {
      const response = await get("/api/admin/allclients");
      const clientsData = response.data.clients;
      setClients(clientsData);

      const commitmentsData = [];
      const criticalHighlightsData = [];

      // Process data once and store
      clientsData.forEach(client => {
        if (client.Commitments?.length) {
          commitmentsData.push(...client.Commitments.map(commitment => ({
            ...commitment,
            clientName: client.CustomerName,
            Mou_no: client.Mou_no,
            CSS: client.CSS
          })));
        }
        if (client.CriticalHighlights?.length) {
          criticalHighlightsData.push(...client.CriticalHighlights.map(highlight => ({
            ...highlight,
            clientName: client.CustomerName,
            Mou_no: client.Mou_no,
            CSS: client.CSS
          })));
        }
      });

      setCommitments(commitmentsData);
      setCriticalHighlights(criticalHighlightsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const calculateRemainingTime = useCallback((deadline) => {
    const timeLeft = new Date(deadline) - new Date();
    if (timeLeft <= 0) return "Expired";
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const hours = Math.floor((timeLeft / 1000 / 60 / 60) % 24);
    const days = Math.floor(timeLeft / 1000 / 60 / 60 / 24);
    return `${days > 0 ? days + "d " : ""}${hours > 0 ? hours + "h " : ""}${minutes}m`;
  }, []);

  const filteredCommitments = useMemo(() => commitments.filter(commitment => (
    (!commitmentFilters.status || commitment.status.toLowerCase() === commitmentFilters.status.toLowerCase()) &&
    (!commitmentFilters.name || commitment.commitment.toLowerCase().includes(commitmentFilters.name.toLowerCase())) &&
    (!commitmentFilters.clientName || commitment.clientName.toLowerCase().includes(commitmentFilters.clientName.toLowerCase())) &&
    (!commitmentFilters.mouNo || commitment.Mou_no.toLowerCase().includes(commitmentFilters.mouNo.toLowerCase()))
  )), [commitments, commitmentFilters]);

  const filteredCriticalHighlights = useMemo(() => criticalHighlights.filter(highlight => (
    (!criticalHighlightFilters.status || highlight.status === criticalHighlightFilters.status) &&
    (!criticalHighlightFilters.highlight || highlight.criticalHighlight.includes(criticalHighlightFilters.highlight)) &&
    (!criticalHighlightFilters.clientName || highlight.clientName === criticalHighlightFilters.clientName) &&
    (!criticalHighlightFilters.mouNo || highlight.Mou_no === criticalHighlightFilters.mouNo)
  )), [criticalHighlights, criticalHighlightFilters]);

  // Paginate the filtered data
  const paginatedCommitments = useMemo(() => filteredCommitments.slice((commitmentsPage - 1) * 4, commitmentsPage * 4), [filteredCommitments, commitmentsPage]);
  const paginatedCriticalHighlights = useMemo(() => filteredCriticalHighlights.slice((criticalHighlightsPage - 1) * 4, criticalHighlightsPage * 4), [filteredCriticalHighlights, criticalHighlightsPage]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commitments Section */}
        <div className="bg-white p-3 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">All Commitments</h3>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              placeholder="Filter by Commitment"
              className="p-2 border border-gray-300 rounded-md w-full text-sm"
              onChange={(e) => setCommitmentFilters({ ...commitmentFilters, name: e.target.value })}
            />
            <select
              className="p-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => setCommitmentFilters({ ...commitmentFilters, status: e.target.value })}
              value={commitmentFilters.status} // Ensure default value is "not done"
            >
              <option value="not done">Not Done</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="space-y-4">
            {paginatedCommitments.map((commitment, index) => (
              <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm shadow-sm">
                {/* First Row - Client Name, Mou, and CSS */}
                <div className="flex items-center justify-between text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-gray-500" />
                    <span className="font-medium">{commitment.clientName} <Link to={`/admin/client/${commitment.Mou_no}`} className="text-blue-600 hover:underline">
                      ({commitment.Mou_no})
                    </Link></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="ml-4 font-medium">CSS:</span>
                    <span className="text-gray-600">{commitment.CSS}</span>
                  </div>
                </div>

                {/* Second Row - Commitment */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <strong className="font-medium text-gray-700">Commitment:</strong> 
                    <span className="ml-1">{commitment.commitment}</span>
                  </span>
                </div>

                {/* Third Row - Deadline and Status */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center">
                    <FaClock className="text-gray-500 mr-1" />
                    <strong className="font-medium text-gray-700">Deadline:</strong> 
                    <span className="ml-1">{new Date(commitment.deadline).toLocaleString()}</span>
                    <span className="ml-1">({calculateRemainingTime(commitment.deadline)}) For {commitment.name}</span>
                  </span>
                  <span className="flex items-center">
                    {commitment.status === "done" ? (
                      <FaCheckCircle className="text-green-500 mr-1" />
                    ) : (
                      <FaExclamationCircle className="text-red-500 mr-1" />
                    )}
                    <strong className="font-medium text-gray-700">Status:</strong> 
                    <span className="ml-1">{commitment.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3">
            <button
              className="px-3 py-1 bg-gray-300 rounded-md text-sm hover:bg-gray-400"
              onClick={() => setCommitmentsPage(prev => Math.max(prev - 1, 1))}
              disabled={commitmentsPage === 1}
            >
              &lt; Prev
            </button>
            <button
              className="px-3 py-1 bg-gray-300 rounded-md text-sm hover:bg-gray-400"
              onClick={() => setCommitmentsPage(prev => prev + 1)}
              disabled={commitmentsPage * 4 >= filteredCommitments.length}
            >
              Next &gt;
            </button>
          </div>
        </div>

        {/* Critical Highlights Section */}
        <div className="bg-white p-3 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Critical Highlights</h3>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              placeholder="Filter by Highlight"
              className="p-2 border border-gray-300 rounded-md w-full text-sm"
              onChange={(e) => setCriticalHighlightFilters({ ...criticalHighlightFilters, highlight: e.target.value })}
            />
            <select
              className="p-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => setCriticalHighlightFilters({ ...criticalHighlightFilters, status: e.target.value })}
              value={criticalHighlightFilters.status} // Ensure default value is "not catered"
            >
              <option value="not catered">Not Catered</option>
              <option value="catered">Catered</option>
            </select>
          </div>
          <div className="space-y-4">
            {paginatedCriticalHighlights.map((highlight, index) => (
              <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm shadow-sm">
                {/* First Row - Client Name, Mou, and CSS */}
                <div className="flex items-center justify-between text-gray-700 mb-3">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-gray-500" />
                    <span className="font-medium">{highlight.clientName} <Link to={`/admin/client/${highlight.Mou_no}`} className="text-blue-600 hover:underline">
                      ({highlight.Mou_no})
                    </Link></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="ml-4 font-medium">CSS:</span>
                    <span className="text-gray-600">{highlight.CSS}</span>
                  </div>
                </div>

                {/* Second Row - Highlight */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <strong className="font-medium text-gray-700">Highlight:</strong> 
                    <span className="ml-1">{highlight.criticalHighlight}</span>
                  </span>
                </div>

                {/* Third Row - Expiry and Status */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center">
                    <strong className="font-medium text-gray-700">Expiry:</strong> 
                    <span className="ml-1">{new Date(highlight.expiryDate).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center">
                    {highlight.status === "catered" ? (
                      <FaCheckCircle className="text-green-500 mr-1" />
                    ) : (
                      <FaExclamationCircle className="text-red-500 mr-1" />
                    )}
                    <strong className="font-medium text-gray-700">Status:</strong> 
                    <span className="ml-1">{highlight.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3">
            <button
              className="px-3 py-1 bg-gray-300 rounded-md text-sm hover:bg-gray-400"
              onClick={() => setCriticalHighlightsPage(prev => Math.max(prev - 1, 1))}
              disabled={criticalHighlightsPage === 1}
            >
              &lt; Prev
            </button>
            <button
              className="px-3 py-1 bg-gray-300 rounded-md text-sm hover:bg-gray-400"
              onClick={() => setCriticalHighlightsPage(prev => prev + 1)}
              disabled={criticalHighlightsPage * 4 >= filteredCriticalHighlights.length}
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardComponent;
