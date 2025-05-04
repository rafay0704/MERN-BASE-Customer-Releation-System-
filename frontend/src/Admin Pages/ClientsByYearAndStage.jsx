import React, { useEffect, useState } from 'react';
import { get } from '../services/ApiEndpoint';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const predefinedColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(199, 199, 199, 1)',
  'rgba(83, 102, 255, 1)',
  'rgba(220, 159, 64, 1)',
  'rgba(100, 100, 100, 1)'
];

const ClientsByYearAndStage = () => {
  // State to hold the fetched data
  const [clientsData, setClientsData] = useState([]);
  const [invalidDateCount, setInvalidDateCount] = useState(0);
  const [invalidMouList, setInvalidMouList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the data when the component mounts
  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        setLoading(true);
        const response = await get('/api/admin/clients/by-year-and-stage');
        if (response.data.success) {
          setClientsData(response.data.data.clientsByYear);
          setInvalidDateCount(response.data.data.invalidDateCount);
          setInvalidMouList(response.data.data.invalidMouList);
        } else {
          setError('Failed to fetch client data');
        }
      } catch (err) {
        setError('An error occurred while fetching client data');
      } finally {
        setLoading(false);
      }
    };

    fetchClientsData();
  }, []);

  // Extract unique stages
  const uniqueStages = Array.from(
    new Set(clientsData.flatMap((item) => item.stageCounts.map((stage) => stage.stage)))
  );

  // Prepare data for the line chart
  const lineChartData = {
    labels: clientsData.map((item) => item.year),
    datasets: uniqueStages.map((stage, index) => ({
      label: stage,
      data: clientsData.map((item) => {
        const stageData = item.stageCounts.find((stageCount) => stageCount.stage === stage);
        return stageData ? stageData.count : 0;
      }),
      borderColor: predefinedColors[index % predefinedColors.length],
      backgroundColor: predefinedColors[index % predefinedColors.length].replace('1)', '0.2)'),
      tension: 0.4,
    })),
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Clients Overview by Year and Stage',
      },
    },
  };

  // Prepare data for the bar chart
  const barChartData = {
    labels: clientsData.map((item) => item.year),
    datasets: [
      {
        label: 'Total Clients',
        data: clientsData.map((item) => item.totalClients),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Total Clients per Year',
      },
    },
  };

  // Render loading state or error message
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-lg font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        {/* Charts */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Clients by Year and Stage</h1>

      {/* Valid Clients Data */}
      {clientsData.length === 0 ? (
        <p className="text-gray-600 text-center">No data available.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {clientsData.map((item) => (
            <div
              key={item.year}
              className="p-4 bg-white shadow-md rounded-lg border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-700">
                Year: <span className="text-gray-900">{item.year}</span>
              </h2>
              <p className="text-gray-600">
                Total Clients: <span className="font-semibold">{item.totalClients}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {item.stageCounts.map((stage, index) => (
                  <li
                    key={index}
                    className="text-gray-600 border-b border-gray-200 pb-1"
                  >
                    {stage.stage}: <span className="font-semibold">{stage.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Invalid Date Entries */}
      {invalidDateCount > 0 && (
        <div className="mt-8 p-4 bg-red-50 shadow-md rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold text-red-600">Invalid Date Entries</h2>
          <p className="text-gray-600">
            Total Invalid Dates: <span className="font-semibold">{invalidDateCount}</span>
          </p>
          <ul className="mt-4 space-y-2">
            {invalidMouList.map((item, index) => (
              <li key={index} className="text-gray-600">
                <span className="font-semibold">MOU:</span> {item.Mou_no},{' '}
                <span className="font-semibold">Date:</span> {item.Date}
              </li>
            ))}
          </ul>
        </div>
      )}

    
    </div>
  );
};

export default ClientsByYearAndStage;
