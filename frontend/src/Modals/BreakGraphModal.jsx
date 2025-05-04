import React from "react";
import { HiOutlineX } from "react-icons/hi";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register necessary Chart.js components including the plugin
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const BreakGraphModal = ({ showModal, handleClose, chartData }) => {
  if (!showModal) return null;

  const formatTime = (value) => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;
    return `${hours}h ${minutes}m ${seconds}s`; // Format in hours, minutes, seconds
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Total Break Duration',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return formatTime(tooltipItem.raw); // Show hours, minutes, seconds in tooltip
          },
        },
      },
      legend: {
        position: 'top',
      },
      datalabels: {
        display: true,
        color: 'black',
        font: {
          weight: 'bold',
        },
        formatter: (value) => {
          const minutes = Math.floor(value / 60); // Display only minutes in data labels
          return `${minutes} min`;
        },
        align: 'center',
        anchor: 'center',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatTime(value); // Show hours, minutes, seconds on y-axis
          },
        },
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Breaks Graph</h2>
          <button onClick={handleClose} className="text-gray-500">
            <HiOutlineX size={24} />
          </button>
        </div>
        <div className="mt-4">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default BreakGraphModal;
