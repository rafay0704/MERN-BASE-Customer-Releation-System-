import React, { useEffect, useState, useMemo } from "react";
import { get } from "../services/ApiEndpoint";
import Select from "react-select";
import { Loader } from 'react-feather';
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary chart elements
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ClientStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [uniqueStatusesPerCSS, setUniqueStatusesPerCSS] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  const predefinedStatuses = useMemo(() => [
    "Orientation Not Done",  "Orientation Done", "CV & Questionnaire Received", "Business Plan Required", "BP Initial Draft Created",
    "BP Initial Draft Review Done", "BP Initial Draft Updated 1", "BP Initial Draft Review Verification Done",
    "BP Initial Draft Sent To Client", "BP Initial Draft Client Feedback", "BP Initial Draft Updated 2",
    "BP Initial Draft Approved By Client", "Supporting Documents Received", "BP Final Draft Created", "BP Final Draft Review Done",
    "BP Final Draft Updated 3", "BP Final Draft Review Verification Done", "BP Final Draft Sent To Client",
    "BP Final Draft Client Feedback", "BP Final Draft Updated 4", "BP Final Draft Approved By Client", 
    "Training Sessions Completed", "Need To Submit Documents Received", "Endorsement Application Submitted",
    "Endorsement Application Rejected", "Endorsement Application Appeal", "Unresponsive", "Switching In Progress", 
    "Under Investment", "Other"
  ], []);

  useEffect(() => {
    fetchClientStatuses();
  }, []);

  const fetchClientStatuses = async () => {
    setLoading(true);
    try {
      const response = await get("/api/admin/clients/statuses");
      const { data } = response.data;
      setStatuses(data);
      setUniqueStatusesPerCSS(response.data.uniqueStatusesPerCSS);
    } catch (error) {
      console.error("Error fetching client statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (selectedOptions) => {
    setSelectedStatuses(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const statusOptions = useMemo(() => statuses.map(status => ({
    value: status._id,
    label: status._id,
  })), [statuses]);

  const filteredStatuses = useMemo(() => selectedStatuses.length
    ? statuses.filter(status => selectedStatuses.includes(status._id))
    : statuses, [statuses, selectedStatuses]);

  const filteredUniqueStatusesPerCSS = useMemo(() => selectedStatuses.length
    ? uniqueStatusesPerCSS.map(item => ({
        ...item,
        uniqueStatuses: item.uniqueStatuses.filter(status => selectedStatuses.includes(status.status)),
      })).filter(item => item.uniqueStatuses.length > 0)
    : uniqueStatusesPerCSS, [uniqueStatusesPerCSS, selectedStatuses]);

  const calculateTotalForCSS = (uniqueStatuses, statusId) => {
    const foundStatus = uniqueStatuses.find(status => status.status === statusId);
    return foundStatus ? foundStatus.count : 0;
  };

  const calculateTotalClientsPerStatus = (statusId) => {
    return uniqueStatusesPerCSS.reduce((total, css) => {
      const foundStatus = css.uniqueStatuses.find(status => status.status === statusId);
      return total + (foundStatus ? foundStatus.count : 0);
    }, 0);
  };

  const sortStatuses = (statuses) => {
    const predefinedOrderMap = predefinedStatuses.reduce((acc, status, index) => {
      acc[status] = index;
      return acc;
    }, {});

    return statuses.sort((a, b) => {
      const aOrder = predefinedOrderMap[a._id] ?? Number.MAX_VALUE;
      const bOrder = predefinedOrderMap[b._id] ?? Number.MAX_VALUE;
      return aOrder - bOrder;
    });
  };

  const sortedStatuses = useMemo(() => sortStatuses(filteredStatuses), [filteredStatuses]);

  const colorPalette = [
    'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 
    'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)', 
    'rgba(231, 76, 60, 0.5)', 'rgba(46, 204, 113, 0.5)', 'rgba(52, 152, 219, 0.5)', 
    'rgba(241, 196, 15, 0.5)'
  ];

  const chartData = useMemo(() => ({
    labels: sortedStatuses.map(status => status._id),
    datasets: uniqueStatusesPerCSS.map((css, index) => ({
      label: css._id,
      data: sortedStatuses.map(status => calculateTotalForCSS(css.uniqueStatuses, status._id)),
      backgroundColor: colorPalette[index % colorPalette.length],
    })),
  }), [sortedStatuses, uniqueStatusesPerCSS]);

  const chartOptions = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Client Statuses Distribution' },
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">Client Statuses Overview</h2>

      <div className="flex justify-center items-center space-x-4 mb-6">
        <label htmlFor="statusFilter" className="text-lg font-medium text-gray-700">Filter by Status:</label>
        <Select
          id="statusFilter"
          isMulti
          value={statusOptions.filter(option => selectedStatuses.includes(option.value))}
          onChange={handleStatusFilterChange}
          options={statusOptions}
          className="w-80"
          placeholder="Select statuses"
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center py-4">
          <Loader className="animate-spin text-blue-500" size={40} />
          <span className="ml-3 text-xl text-gray-600">Loading data...</span>
        </div>
      )}

      {/* Table Displaying Status Counts */}
      <div className="overflow-x-auto shadow-lg rounded-lg bg-white">
        <div className="max-h-80 overflow-y-auto">
          <table className="min-w-full table-auto">
            <thead className="sticky top-0 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                {filteredUniqueStatusesPerCSS.map(css => (
                  <th key={css._id} className="px-6 py-3 text-left text-sm font-medium">{css._id}</th>
                ))}
                <th className="px-6 py-3 text-left text-sm font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedStatuses.map((status) => (
                <tr key={status._id} className="hover:bg-gray-100 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{status._id}</td>
                  {filteredUniqueStatusesPerCSS.map(css => (
                    <td key={css._id} className="px-6 py-4 text-sm">{calculateTotalForCSS(css.uniqueStatuses, status._id)}</td>
                  ))}
                  <td className="px-6 py-4 font-bold text-sm text-blue-600">{calculateTotalClientsPerStatus(status._id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="my-8">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {filteredStatuses.length === 0 && !loading && (
        <div className="text-center py-4 text-xl text-gray-500">
          No data available for the selected statuses.
        </div>
      )}
    </div>
  );
};

export default ClientStatuses;
