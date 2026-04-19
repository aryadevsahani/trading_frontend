import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler, // Background area fill karne ke liye
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler
);

const SimpleChart = ({ data }) => {
  const labels = Object.keys(data);
  const prices = Object.values(data).map((item) => item.lp || 0);

  // Helper: CSS Variable se color uthane ke liye
  const getThemeColor = (variable) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Price",
        data: prices,
        borderColor: "#0dcaf0", // Trade Pro Blue
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0, // Points hide karne ke liye clean look
        fill: true,
        // Halka gradient effect niche ki taraf
        backgroundColor: "rgba(13, 202, 240, 0.1)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Live updates ke liye animation off rakhein taki glitch na ho
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        display: false, // X-axis hide
      },
      y: {
        grid: {
          // Grid lines ka color theme ke hisaab se (CSS variable use karke)
          color: "rgba(128, 128, 128, 0.1)", 
        },
        ticks: {
          // Y-axis ke numbers ka color variable se aayega
          color: "gray", 
          font: { size: 10 }
        },
      },
    },
  };

  return (
    <div style={{ height: "250px", width: "100%" }} className="chart-container">
      <Line data={chartData} options={options} />
      
      <style>{`
        /* Chart container ka background theme variables se control hoga */
        .chart-container {
          background-color: var(--bg-black);
          padding: 10px;
          border-radius: 8px;
          transition: background 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default SimpleChart;