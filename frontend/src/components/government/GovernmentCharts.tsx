import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface DonutItem {
  category: string;
  count: number;
  percentage?: number;
}

interface DonutChartProps {
  data: DonutItem[];
  centerLabel?: string;
  centerCount?: number | string;
  palette?: string[];
  emptyMessage?: string;
}

const DEFAULT_PALETTE = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b', '#06b6d4', '#f97316'];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  centerLabel = 'Total',
  centerCount,
  palette = DEFAULT_PALETTE,
  emptyMessage = 'No data available',
}) => {
  if (!data || data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 mb-2"></div>
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const total = centerCount !== undefined ? centerCount : data.reduce((sum, item) => sum + item.count, 0);

  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: palette.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / Number(total || 1)) * 100)}%)`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 my-2">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800">{total}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{centerLabel}</span>
        </div>
      </div>
      <div className="w-full mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: palette[idx % palette.length] }}
              />
              <span className="text-slate-600 truncate font-medium">{item.category}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-800 font-bold shrink-0">
              <span>{item.count}</span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({item.percentage !== undefined ? item.percentage : Math.round((item.count / Number(total || 1)) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BarItem {
  status: string;
  count: number;
}

interface StatusBarChartProps {
  data: BarItem[];
  color?: string;
  emptyMessage?: string;
}

export const StatusBarChart: React.FC<StatusBarChartProps> = ({
  data,
  color = '#3b82f6',
  emptyMessage = 'No data available',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
        <span>{emptyMessage}</span>
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.status),
    datasets: [
      {
        label: 'Count',
        data: data.map((d) => d.count),
        backgroundColor: [
          '#f59e0b', // Open - amber
          '#3b82f6', // In Progress - blue
          '#10b981', // Resolved - emerald
          '#ef4444', // Rejected - rose
          '#8b5cf6', // Under review - violet
        ].slice(0, data.length),
        borderRadius: 6,
        maxBarThickness: 36,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: { size: 10 },
          color: '#94a3b8',
        },
        grid: {
          color: '#f1f5f9',
        },
      },
      x: {
        ticks: {
          font: { size: 10, weight: 600 as const },
          color: '#64748b',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-52 w-full pt-2">
      <Bar data={chartData} options={options} />
    </div>
  );
};

interface TrendSeriesItem {
  date: string;
  count: number;
}

interface TrendLineChartProps {
  data: TrendSeriesItem[];
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No trend records found.
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Complaints',
        data: data.map((d) => d.count),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` Complaints: ${ctx.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, font: { size: 10 }, color: '#94a3b8' },
        grid: { color: '#f8fafc' },
      },
      x: {
        ticks: { font: { size: 10 }, color: '#64748b' },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-48 w-full pt-2">
      <Line data={chartData} options={options} />
    </div>
  );
};
