'use client';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

function readVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v?.trim() || fallback;
}

const baseOptions = () => {
  const grid = readVar('--border', 'rgba(148,163,184,0.18)');
  const ticks = readVar('--text-muted', '#94a3b8');
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: ticks, boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: { grid: { color: grid }, ticks: { color: ticks } },
      y: { grid: { color: grid }, ticks: { color: ticks }, beginAtZero: true },
    },
  };
};

export function StatusBreakdownDonut({ statusBreakdown }) {
  const labels = Object.keys(statusBreakdown || {});
  const values = labels.map((k) => statusBreakdown[k] || 0);
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(148,163,184,0.6)',
          'rgba(96,165,250,0.7)',
          'rgba(129,140,248,0.7)',
          'rgba(251,113,133,0.7)',
          'rgba(52,211,153,0.75)',
        ],
        borderWidth: 0,
      },
    ],
  };
  return (
    <div className="h-56">
      <Doughnut
        data={data}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: readVar('--text-muted', '#94a3b8'), font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}

export function WeeklyPerformanceBar({ weeklyPerformance }) {
  const labels = weeklyPerformance?.map((w) => w.week) || [];
  const completed = weeklyPerformance?.map((w) => w.completedTasks) || [];
  const impact = weeklyPerformance?.map((w) => w.avgImpact || 0) || [];

  const data = {
    labels,
    datasets: [
      { label: 'Completed', data: completed, backgroundColor: 'rgba(34,211,238,0.75)', borderRadius: 6 },
      { label: 'Avg Impact', data: impact, backgroundColor: 'rgba(129,140,248,0.55)', borderRadius: 6 },
    ],
  };
  return (
    <div className="h-56">
      <Bar data={data} options={baseOptions()} />
    </div>
  );
}

export function GrowthLine({ history = [] }) {
  const labels = history.map((p) => p.date);
  const promotion = history.map((p) => p.promotion);
  const visibility = history.map((p) => p.visibility);
  const data = {
    labels,
    datasets: [
      {
        label: 'Promotion score',
        data: promotion,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.18)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Visibility score',
        data: visibility,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.18)',
        fill: true,
        tension: 0.35,
      },
    ],
  };
  return (
    <div className="h-56">
      <Line data={data} options={baseOptions()} />
    </div>
  );
}

export function PriorityBreakdownBar({ priorityBreakdown }) {
  const labels = ['low', 'medium', 'high', 'critical'];
  const values = labels.map((k) => priorityBreakdown?.[k] || 0);
  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks by priority',
        data: values,
        backgroundColor: ['rgba(148,163,184,0.6)', 'rgba(96,165,250,0.7)', 'rgba(251,191,36,0.75)', 'rgba(251,113,133,0.85)'],
        borderRadius: 6,
      },
    ],
  };
  return (
    <div className="h-56">
      <Bar data={data} options={baseOptions()} />
    </div>
  );
}

export function AdminTaskTrendLine({ tasksByDay = [] }) {
  const labels = tasksByDay.map((d) => d.date);
  const created = tasksByDay.map((d) => d.created);
  const completed = tasksByDay.map((d) => d.completed);
  const data = {
    labels,
    datasets: [
      {
        label: 'Created',
        data: created,
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129,140,248,0.18)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Completed',
        data: completed,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.18)',
        fill: true,
        tension: 0.35,
      },
    ],
  };
  return (
    <div className="h-60">
      <Line data={data} options={baseOptions()} />
    </div>
  );
}
