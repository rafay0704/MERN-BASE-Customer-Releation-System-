import React, { useEffect, useState } from 'react';
import { get, put } from '../services/ApiEndpoint';

const AdminCheckManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to calculate progress percentage based on the timestamps
  const calculateProgress = (item) => {
    let progress = 0;

    // For Commitments
    if (item.data && item.data.commitment) {
      if (!item.data.status || item.data.status === 'not done') {
        progress = 33; // Just added
      } else if (item.data.status === 'done' && !item.data.AdminCheck) {
        progress = 66; // Status done, AdminCheck pending
      } else if (item.data.status === 'done' && item.data.AdminCheck) {
        progress = 100; // AdminCheck complete
      }
    }

    // For Critical Highlights
    if (item.data && item.data.criticalHighlight) {
      if (!item.data.status || item.data.status === 'not catered') {
        progress = 33; // Just added
      } else if (item.data.status === 'catered' && !item.data.AdminCheck) {
        progress = 66; // Status catered, AdminCheck pending
      } else if (item.data.status === 'catered' && item.data.AdminCheck) {
        progress = 100; // AdminCheck complete
      }
    }

    return progress;
  };

  const fetchData = async () => {
    try {
      const response = await get('/api/admin/unchecked-highlights-commitments');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCheckUpdate = async (Mou_no, itemId, isCommitment) => {
    try {
      const url = isCommitment
        ? `/api/admin/client/${Mou_no}/commitments/${itemId}/admincheck`
        : `/api/admin/client/${Mou_no}/critical-highlight/${itemId}/admincheck`;

      const response = await put(url);

      if (response.data.success) {
        fetchData();
      } else {
        alert('Failed to update AdminCheck');
      }
    } catch (err) {
      console.error('Error updating AdminCheck:', err);
      alert('Error updating AdminCheck');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStageText = (highlightOrCommitment) => {
    if (highlightOrCommitment.AdminCheck) {
      return 'Admin Checked';
    }
    if (highlightOrCommitment.status === 'done' || highlightOrCommitment.status === 'catered') {
      return 'Status Done/Catered';
    }
    return 'Added';
  };

  return (
    <div className="admin-check-manager container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6 text-center text-blue-600">
        Unchecked Critical Highlights and Commitments
      </h1>

      {loading && (
        <div className="text-center text-lg text-gray-600">
          <span className="spinner-border animate-spin"></span> Loading data...
        </div>
      )}
      {error && <p className="text-center text-lg text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto shadow-lg rounded-lg bg-white">
          <table className="min-w-full table-auto text-gray-800">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mou No</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Customer Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">CSS</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Details</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item, index) => (
                <>
                  {/* Critical Highlights */}
                  {item.CriticalHighlights.map((highlight, highlightIndex) => (
                    <tr key={`highlight-${highlightIndex}`} className="hover:bg-blue-50 transition-all ease-in-out">
                      <td className="px-6 py-4 text-sm">{item.Mou_no}</td>
                      <td className="px-6 py-4 text-sm">{item.CustomerName}</td>
                      <td className="px-6 py-4 text-sm">{item.CSS}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          Critical Highlight
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            {highlight.criticalHighlight || 'No critical highlight info'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expiry Date: {highlight.expiryDate ? new Date(highlight.expiryDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative pt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${calculateProgress({ data: highlight }) === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${calculateProgress({ data: highlight })}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!highlight.AdminCheck && (
                          <button
                            onClick={() => handleAdminCheckUpdate(item.Mou_no, highlight._id, false)}
                            className="mt-2 text-blue-500"
                          >
                          Mark Verified
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Commitments */}
                  {item.Commitments.map((commitment, commitmentIndex) => (
                    <tr key={`commitment-${commitmentIndex}`} className="hover:bg-blue-50 transition-all ease-in-out">
                      <td className="px-6 py-4 text-sm">{item.Mou_no}</td>
                      <td className="px-6 py-4 text-sm">{item.CustomerName}</td>
                      <td className="px-6 py-4 text-sm">{item.CSS}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Commitment</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            {commitment.commitment || 'No commitment info'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Deadline: {commitment.deadline ? new Date(commitment.deadline).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative pt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${calculateProgress({ data: commitment }) === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${calculateProgress({ data: commitment })}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!commitment.AdminCheck && (
                          <button
                            onClick={() => handleAdminCheckUpdate(item.Mou_no, commitment._id, true)}
                            className="mt-2 text-blue-500"
                          >
                          Mark Verified
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCheckManager;
