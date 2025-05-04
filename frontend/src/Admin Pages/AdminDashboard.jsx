import React, { useState, useEffect } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { get } from "../services/ApiEndpoint";
import ChartDataLabels from "chartjs-plugin-datalabels";
import ClientsByYearAndStage from "./ClientsByYearAndStage";
import AdminDashboardComponnet from './AdminDashboardComponnet'
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const AdminDashboard = () => {
  const [chartsData, setChartsData] = useState({
    flagCounts: { labels: [], datasets: [] },
    branchLocation: { labels: [], datasets: [] },
    stageDistribution: { labels: [], datasets: [] },
    submittedEB: { labels: [], datasets: [] },
    cssDistribution: { labels: [], datasets: [] },
  });

  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    submissionNeeded: 0,
    businessPlanRequired: 0,
    submittedToEB: 0,
    endorsementFailed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await get("/api/admin/clients");
      const { clientsStats } = response.data;

      const processedChartsData = {
        flagCounts: processChartData(clientsStats.flagCounts, "Flag Distribution"),
        branchLocation: processChartData(clientsStats.branchLocation, "Branch Distribution"),
        stageDistribution: processChartData(clientsStats.stageDistribution, "Stage Distribution"),
        submittedEB: processChartData(clientsStats.submittedEB, "Submitted EB"),
        cssDistribution: processChartData(clientsStats.cssDistribution, "CSS Distribution"),
      };

      setChartsData(processedChartsData);

      setStatusCounts({
        total: clientsStats.activeClients || 0,
        submissionNeeded: clientsStats.submissionNeeded || 0,
        businessPlanRequired: clientsStats.businessPlanRequired || 0,
        submittedToEB: clientsStats.submittedToEB || 0,
        endorsementFailed: clientsStats.endorsementFailed || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const processChartData = (data, label) => {
    const labels = data.map(item => item._id || "Unknown");
    const counts = data.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label,
          data: counts,
          backgroundColor: generateColors(counts.length),
        },
      ],
    };
  };

  const generateColors = count =>
    Array.from({ length: count }, (_, i) => `hsl(${(i * 40) % 360}, 70%, 60%)`);

  const renderStatCard = (title, value, bgColor) => (
    <div className={`${bgColor} p-4 rounded-lg shadow-md text-white`}>
      <h3 className="text-lg">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {renderStatCard("Active Clients", statusCounts.total, "bg-indigo-600")}
        {renderStatCard("Need To Submit Documents Received", statusCounts.submissionNeeded, "bg-cyan-600")}
        {renderStatCard("Business Plan Required", statusCounts.businessPlanRequired, "bg-green-600")}
        {renderStatCard("Endorsement Application Submitted", statusCounts.submittedToEB, "bg-orange-500")}
        {renderStatCard("Endorsement Application Rejected", statusCounts.endorsementFailed, "bg-red-500")}
      </div>
      <AdminDashboardComponnet/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartCard title="Flag Distribution" data={chartsData.flagCounts} type="pie" />
        <ChartCard title="Branch Distribution" data={chartsData.branchLocation} type="doughnut" />
        <ChartCard title="Stage Distribution" data={chartsData.stageDistribution} type="pie" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <ChartCard title="Submitted EB" data={chartsData.submittedEB} type="bar" />
        <ChartCard title="CSS Distribution" data={chartsData.cssDistribution} type="bar" />
      </div>
      <ClientsByYearAndStage />
    </div>
  );
};

const ChartCard = ({ title, data, type = "doughnut" }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
    {type === "bar" ? (
      <Bar data={data} options={chartOptions} />
    ) : type === "pie" ? (
      <Pie data={data} options={chartOptions} />
    ) : (
      <Doughnut data={data} options={chartOptions} />
    )}
  </div>
);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
    tooltip: {
      callbacks: {
        label: context => `${context.dataset.label}: ${context.raw}`,
      },
    },
    datalabels: {
      color: "#fff",
      font: { weight: "bold" },
    },
  },
};

export default AdminDashboard;
