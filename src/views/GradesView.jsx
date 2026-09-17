import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { dbManager } from '../services/db';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper: read a CSS variable from the document root
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function GradesView() {
  const grades = dbManager.getItem('grades', []);

  // Re-render charts when theme changes
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey(k => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Resolved theme colors (read at render time from CSS variables)
  const textMain   = cssVar('--text-main')   || '#111827';
  const textMuted  = cssVar('--text-muted')  || '#6b7280';
  const textDim    = cssVar('--text-dim')    || '#9ca3af';
  const borderLight = cssVar('--border-color') || '#e5e7eb';
  const primaryColor = '#4f6ef7';
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const cardBg = cssVar('--bg-card') || '#ffffff';

  // ── GPA Line Chart ──────────────────────────────────────────────────────
  const gpaData = {
    labels: ['Fall 21', 'Spr 22', 'Fall 22', 'Spr 23', 'Fall 23', 'Spr 24', 'Current'],
    datasets: [
      {
        label: 'GPA',
        data: [3.40, 3.50, 3.44, 3.70, 3.80, 3.82, 3.84],
        borderColor: primaryColor,
        borderWidth: 2.5,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, isDark ? 'rgba(79, 110, 247, 0.25)' : 'rgba(79, 110, 247, 0.15)');
          gradient.addColorStop(1, 'rgba(79, 110, 247, 0.00)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointBackgroundColor: cardBg,
        pointBorderColor: primaryColor,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const gpaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          color: textMuted,
          font: { family: 'Inter, Kanit, sans-serif', size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1c2333' : '#ffffff',
        titleColor: textMain,
        bodyColor: textMuted,
        borderColor: borderLight,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10
      }
    },
    scales: {
      y: {
        min: 3.0,
        max: 4.0,
        ticks: {
          stepSize: 0.1,
          color: textMuted,
          font: { family: 'Inter, sans-serif', size: 11 }
        },
        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
      },
      x: {
        ticks: {
          color: textMuted,
          font: { family: 'Inter, sans-serif', size: 11 }
        },
        grid: { display: false }
      }
    }
  };

  // ── Grade Doughnut Chart ─────────────────────────────────────────────────
  const donutData = {
    labels: ['A', 'A-', 'B+', 'B', 'Other'],
    datasets: [
      {
        data: [45, 30, 15, 7, 3],
        backgroundColor: ['#4f6ef7', '#7c5ce8', '#60a5fa', '#93c5fd', isDark ? '#2d3748' : '#e0e7ff'],
        borderWidth: 2,
        borderColor: cardBg
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          color: textMain,
          font: { family: 'Inter, sans-serif', size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1c2333' : '#ffffff',
        titleColor: textMain,
        bodyColor: textMuted,
        borderColor: borderLight,
        borderWidth: 1,
        cornerRadius: 10
      }
    }
  };

  // ── Study Hours Bar Chart ────────────────────────────────────────────────
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'วิชาหลัก',
        data: [2.0, 1.5, 3.0, 2.0, 1.0, 4.0, 3.0],
        backgroundColor: primaryColor,
        borderRadius: 4,
        borderSkipped: false
      },
      {
        label: 'อ่านเพิ่มเติม',
        data: [1.0, 2.5, 1.0, 3.0, 2.0, 2.0, 4.0],
        backgroundColor: '#7c5ce8',
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 10,
          color: textMuted,
          font: { family: 'Inter, sans-serif', size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1c2333' : '#ffffff',
        titleColor: textMain,
        bodyColor: textMuted,
        borderColor: borderLight,
        borderWidth: 1,
        cornerRadius: 10
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: textMuted, font: { family: 'Inter, sans-serif', size: 11 } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        min: 0,
        max: 7,
        ticks: { stepSize: 1, color: textMuted, font: { family: 'Inter, sans-serif', size: 11 } },
        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
      }
    }
  };

  return (
    <div className="analytics-page-wrapper" key={themeKey}>
      <div className="analytics-header">
        <h1>ภาพรวมการวิเคราะห์</h1>
      </div>

      <div className="analytics-top-grid">
        <div className="analytics-card">
          <div className="analytics-card-label">เกรดเฉลี่ยสะสม</div>
          <div className="analytics-card-val">3.84</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-label">หน่วยกิตทั้งหมด</div>
          <div className="analytics-card-val">
            86 <span className="analytics-card-unit">/ 120</span>
          </div>
          <div className="analytics-bar-track">
            <div className="analytics-bar-fill" style={{ width: '71.6%' }}></div>
          </div>
          <div className="analytics-subtext">70% ถึงจบการศึกษา</div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-label">ชั่วโมงเรียนสัปดาห์นี้</div>
          <div className="analytics-card-val">24.5</div>
        </div>
      </div>

      <div className="analytics-card">
        <div className="analytics-card-title">แนวโน้มเกรดเฉลี่ยตลอดภาคการศึกษา</div>
        <div className="chart-container-line" style={{ height: 260 }}>
          <Line data={gpaData} options={gpaOptions} />
        </div>
      </div>

      <div className="analytics-bottom-grid">
        <div className="analytics-card">
          <div className="analytics-card-title">เกรดโดยเฉลี่ย</div>
          <div className="donut-chart-box" style={{ height: 200, position: 'relative' }}>
            <Doughnut data={donutData} options={donutOptions} />
          </div>
          <div className="grade-stats-row">
            <div className="grade-stat-box">
              <div className="grade-stat-lbl">Top Grade</div>
              <div className="grade-stat-val">A</div>
            </div>
            <div className="grade-stat-box">
              <div className="grade-stat-lbl">Most Frequent</div>
              <div className="grade-stat-val">A-</div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">ชั่วโมงเรียน (14 วันที่ผ่านมา)</div>
          <div className="bar-chart-box" style={{ height: 200, position: 'relative' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
