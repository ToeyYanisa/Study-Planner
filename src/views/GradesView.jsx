import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Plus, Trash2, GraduationCap, BookOpen, Award, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper for CSS Variables
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Grade Points Mapping
const GRADE_POINTS = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0,
  'W': null,
  'S': null,
  'U': null
};

const DEFAULT_SEMESTERS = [];

export default function GradesView() {
  const [semesters, setSemesters] = useState(() => {
    return dbManager.getItem('semesters_data', DEFAULT_SEMESTERS);
  });

  const [activeSemId, setActiveSemId] = useState(() => {
    const saved = dbManager.getItem('semesters_data', DEFAULT_SEMESTERS);
    return saved.length > 0 ? saved[0].id : '';
  });

  const [newSemName, setNewSemName] = useState('');
  const [showAddSemModal, setShowAddSemModal] = useState(false);

  // Theme listener for Chart
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey(k => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Save to LocalStorage whenever semesters state changes
  useEffect(() => {
    dbManager.setItem('semesters_data', semesters);
  }, [semesters]);

  // If activeSemId gets out of sync when deleting
  useEffect(() => {
    if (semesters.length > 0 && !semesters.some(s => s.id === activeSemId)) {
      setActiveSemId(semesters[0].id);
    }
  }, [semesters, activeSemId]);

  // Helper calculation for single semester
  const calcSemesterStats = (sem) => {
    let totalCredits = 0;
    let totalPoints = 0;
    (sem.courses || []).forEach(c => {
      const cr = parseFloat(c.credit) || 0;
      const pt = GRADE_POINTS[c.grade];
      if (pt !== null && pt !== undefined && cr > 0) {
        totalCredits += cr;
        totalPoints += cr * pt;
      }
    });
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    return { totalCredits, totalPoints, gpa: parseFloat(gpa) };
  };

  // Overall Cumulative GPAX calculation
  const calcOverallStats = () => {
    let grandCredits = 0;
    let grandPoints = 0;
    semesters.forEach(s => {
      const stats = calcSemesterStats(s);
      grandCredits += stats.totalCredits;
      grandPoints += stats.totalPoints;
    });
    const gpax = grandCredits > 0 ? (grandPoints / grandCredits).toFixed(2) : '0.00';
    return { grandCredits, grandPoints, gpax: parseFloat(gpax) };
  };

  const activeSem = semesters.find(s => s.id === activeSemId) || semesters[0];
  const activeSemStats = activeSem ? calcSemesterStats(activeSem) : { totalCredits: 0, totalPoints: 0, gpa: 0 };
  const overallStats = calcOverallStats();

  // Handlers for Semester Management
  const handleAddSemester = (e) => {
    e.preventDefault();
    if (!newSemName.trim()) return;
    const newSem = {
      id: `sem-${Date.now()}`,
      name: newSemName.trim(),
      courses: [
        { id: `c-${Date.now()}-1`, name: 'รายวิชาใหม่', credit: 3, grade: 'A' }
      ]
    };
    const updated = [...semesters, newSem];
    setSemesters(updated);
    setActiveSemId(newSem.id);
    setNewSemName('');
    setShowAddSemModal(false);
    notify.success(`เพิ่มภาคเรียน "${newSem.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteSemester = (semId, semName) => {
    if (semesters.length <= 1) {
      notify.info('ต้องมีอย่างน้อย 1 ภาคเรียนในระบบ');
      return;
    }
    if (window.confirm(`คุณต้องการลบ "${semName}" และรายวิชาทั้งหมดในเทอมนี้หรือไม่?`)) {
      const updated = semesters.filter(s => s.id !== semId);
      setSemesters(updated);
      notify.success(`ลบภาคเรียน "${semName}" แล้ว`);
    }
  };

  // Handlers for Courses in Active Semester
  const handleAddCourse = () => {
    if (!activeSem) return;
    const newCourse = {
      id: `c-${Date.now()}`,
      name: '',
      credit: 3,
      grade: 'A'
    };
    const updated = semesters.map(s => {
      if (s.id === activeSem.id) {
        return { ...s, courses: [...s.courses, newCourse] };
      }
      return s;
    });
    setSemesters(updated);
  };

  const handleUpdateCourse = (courseId, field, value) => {
    if (!activeSem) return;
    const updated = semesters.map(s => {
      if (s.id === activeSem.id) {
        const newCourses = s.courses.map(c => {
          if (c.id === courseId) {
            return { ...c, [field]: field === 'credit' ? Math.max(1, parseFloat(value) || 1) : value };
          }
          return c;
        });
        return { ...s, courses: newCourses };
      }
      return s;
    });
    setSemesters(updated);
  };

  const handleDeleteCourse = (courseId) => {
    if (!activeSem) return;
    const updated = semesters.map(s => {
      if (s.id === activeSem.id) {
        return { ...s, courses: s.courses.filter(c => c.id !== courseId) };
      }
      return s;
    });
    setSemesters(updated);
  };

  // Chart configuration
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textMain = cssVar('--text-main') || '#111827';
  const textMuted = cssVar('--text-muted') || '#6b7280';
  const borderLight = cssVar('--border-color') || '#e5e7eb';
  const primaryColor = '#4f6ef7';
  const cardBg = cssVar('--bg-card') || '#ffffff';

  const lineChartData = {
    labels: semesters.map(s => s.name),
    datasets: [
      {
        label: 'GPA ประจำเทอม',
        data: semesters.map(s => calcSemesterStats(s).gpa),
        borderColor: primaryColor,
        borderWidth: 2.5,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 240);
          gradient.addColorStop(0, isDark ? 'rgba(79, 110, 247, 0.3)' : 'rgba(79, 110, 247, 0.15)');
          gradient.addColorStop(1, 'rgba(79, 110, 247, 0.00)');
          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointBackgroundColor: cardBg,
        pointBorderColor: primaryColor,
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: textMuted,
          font: { family: 'Kanit, Inter, sans-serif', size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1c2333' : '#ffffff',
        titleColor: textMain,
        bodyColor: textMuted,
        borderColor: borderLight,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (context) => ` GPA: ${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 4.0,
        ticks: {
          stepSize: 0.5,
          color: textMuted,
          font: { family: 'Kanit, sans-serif', size: 11 }
        },
        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
      },
      x: {
        ticks: {
          color: textMuted,
          font: { family: 'Kanit, sans-serif', size: 11 }
        },
        grid: { display: false }
      }
    }
  };

  // Badge text for GPAX
  const getGpaxStatusBadge = (gpax) => {
    if (gpax >= 3.5) return { text: 'เกียรตินิยม / Excellent', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (gpax >= 3.0) return { text: 'ดีมาก / Very Good', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (gpax >= 2.0) return { text: 'ผ่านเกณฑ์ / Good', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
    return { text: 'เฝ้าระวัง / Warning', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  };

  const gpaxBadge = getGpaxStatusBadge(overallStats.gpax);

  return (
    <div className="analytics-page-wrapper" key={themeKey}>
      {/* Page Header */}
      <div className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>เครื่องคำนวณเกรดเฉลี่ย (GPA & GPAX)</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            คำนวณเกรดรายภาคเรียนและสรุปเกรดเฉลี่ยสะสมจากเกรดตัวอักษรโดยตรง
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddSemModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={16} />
          <span>เพิ่มภาคเรียน</span>
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="analytics-top-grid">
        {/* Card 1: GPAX */}
        <div className="analytics-card">
          <div>
            <div className="analytics-card-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <GraduationCap size={15} color="var(--primary)" />
              <span>เกรดเฉลี่ยสะสมรวม (GPAX)</span>
            </div>
            <div className="analytics-card-val" style={{ color: 'var(--primary)', marginTop: '0.4rem' }}>
              {overallStats.gpax.toFixed(2)}
            </div>
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: gpaxBadge.color,
                background: gpaxBadge.bg
              }}
            >
              {gpaxBadge.text}
            </span>
          </div>
        </div>

        {/* Card 2: Cumulative Credits */}
        <div className="analytics-card">
          <div>
            <div className="analytics-card-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BookOpen size={15} color="#8b5cf6" />
              <span>หน่วยกิตสะสมรวม</span>
            </div>
            <div className="analytics-card-val" style={{ marginTop: '0.4rem' }}>
              {overallStats.grandCredits} <span className="analytics-card-unit">หน่วยกิต</span>
            </div>
          </div>
          <div className="analytics-subtext" style={{ textAlign: 'left', marginTop: '0.8rem' }}>
            คำนวณจากทั้งหมด {semesters.length} ภาคเรียน
          </div>
        </div>

        {/* Card 3: Active Term GPA */}
        <div className="analytics-card">
          <div>
            <div className="analytics-card-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Award size={15} color="#10b981" />
              <span>GPA เทอมที่เลือก ({activeSem?.name || '-'})</span>
            </div>
            <div className="analytics-card-val" style={{ marginTop: '0.4rem' }}>
              {activeSemStats.gpa.toFixed(2)}
            </div>
          </div>
          <div className="analytics-subtext" style={{ textAlign: 'left', marginTop: '0.8rem' }}>
            เรียนในเทอมนี้ {activeSemStats.totalCredits} หน่วยกิต
          </div>
        </div>
      </div>

      {/* Semester Tabs Navigation */}
      <div className="gpa-semester-tabs-bar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.4rem 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {semesters.map(sem => {
          const isActive = sem.id === activeSemId;
          const stats = calcSemesterStats(sem);
          return (
            <button
              key={sem.id}
              onClick={() => setActiveSemId(sem.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: '1px solid',
                borderColor: isActive ? 'var(--primary)' : 'transparent',
                borderBottomColor: isActive ? 'var(--bg-card)' : 'transparent',
                background: isActive ? 'var(--bg-card)' : 'var(--bg-hover)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                marginBottom: '-1px'
              }}
            >
              <Calendar size={14} />
              <span>{sem.name}</span>
              <span style={{
                background: isActive ? 'var(--primary-light)' : 'var(--border-light)',
                color: isActive ? 'var(--primary)' : 'var(--text-dim)',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {stats.gpa.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Semester Editor Table */}
      {activeSem && (
        <div className="analytics-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                ตารางรายวิชา: {activeSem.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                {activeSem.courses.length} วิชา
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={handleAddCourse}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                <Plus size={14} />
                <span>เพิ่มรายวิชา</span>
              </button>
              <button
                className="btn"
                onClick={() => handleDeleteSemester(activeSem.id, activeSem.name)}
                title="ลบภาคเรียนนี้"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.82rem'
                }}
              >
                <Trash2 size={14} />
                <span>ลบเทอมนี้</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '45px' }}>#</th>
                  <th style={{ padding: '0.75rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>ชื่อวิชา / รหัสวิชา</th>
                  <th style={{ padding: '0.75rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '130px' }}>จำนวนหน่วยกิต</th>
                  <th style={{ padding: '0.75rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '130px' }}>เกรดที่ได้</th>
                  <th style={{ padding: '0.75rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '110px' }}>แต้มรวม</th>
                  <th style={{ padding: '0.75rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '60px', textAlign: 'center' }}>ลบ</th>
                </tr>
              </thead>
              <tbody>
                {activeSem.courses.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                      ยังไม่มีรายวิชาในเทอมนี้ กดปุ่ม <strong>"+ เพิ่มรายวิชา"</strong> เพื่อเริ่มกรอก
                    </td>
                  </tr>
                ) : (
                  activeSem.courses.map((course, idx) => {
                    const weight = GRADE_POINTS[course.grade];
                    const rowPoints = weight !== null && weight !== undefined ? (course.credit * weight).toFixed(1) : '-';
                    return (
                      <tr key={course.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.65rem 0.8rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '0.65rem 0.8rem' }}>
                          <input
                            type="text"
                            value={course.name}
                            onChange={(e) => handleUpdateCourse(course.id, 'name', e.target.value)}
                            placeholder="ระบุชื่อวิชา..."
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.7rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.88rem',
                              fontFamily: 'inherit'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.65rem 0.8rem' }}>
                          <select
                            value={course.credit}
                            onChange={(e) => handleUpdateCourse(course.id, 'credit', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.88rem',
                              fontFamily: 'inherit',
                              fontWeight: 600
                            }}
                          >
                            <option value={1}>1 หน่วยกิต</option>
                            <option value={2}>2 หน่วยกิต</option>
                            <option value={3}>3 หน่วยกิต</option>
                            <option value={4}>4 หน่วยกิต</option>
                            <option value={6}>6 หน่วยกิต</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.65rem 0.8rem' }}>
                          <select
                            value={course.grade}
                            onChange={(e) => handleUpdateCourse(course.id, 'grade', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.88rem',
                              fontFamily: 'inherit',
                              fontWeight: 700
                            }}
                          >
                            <option value="A">A (4.0)</option>
                            <option value="B+">B+ (3.5)</option>
                            <option value="B">B (3.0)</option>
                            <option value="C+">C+ (2.5)</option>
                            <option value="C">C (2.0)</option>
                            <option value="D+">D+ (1.5)</option>
                            <option value="D">D (1.0)</option>
                            <option value="F">F (0.0)</option>
                            <option value="W">W (ถอน)</option>
                            <option value="S">S (ผ่าน)</option>
                            <option value="U">U (ไม่ผ่าน)</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.65rem 0.8rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {rowPoints}
                        </td>
                        <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                            title="ลบวิชานี้"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary of Active Term */}
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px dashed var(--border-color)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'var(--bg-hover)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>หน่วยกิตรวมเทอมนี้</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeSemStats.totalCredits} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>หน่วยกิต</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>แต้มรวมสะสมเทอมนี้</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeSemStats.totalPoints.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>แต้ม</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>เกรดเฉลี่ยประจำเทอม (GPA)</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {activeSemStats.gpa.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPA Trend Line Chart */}
      <div className="analytics-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingUp size={18} color="var(--primary)" />
          <h2 className="analytics-card-title" style={{ margin: 0 }}>แนวโน้มเกรดเฉลี่ยแต่ละภาคการศึกษา</h2>
        </div>
        <div className="chart-container-line" style={{ height: 260 }}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      {/* Modal: Add New Semester */}
      {showAddSemModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '420px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              เพิ่มภาคเรียนใหม่
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ระบุชื่อภาคการศึกษา เช่น "ภาคเรียนที่ 2/2567" หรือ "ภาคเรียนฤดูร้อน 2567"
            </p>

            <form onSubmit={handleAddSemester}>
              <input
                type="text"
                value={newSemName}
                onChange={(e) => setNewSemName(e.target.value)}
                placeholder="ชื่อภาคการศึกษา..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  marginBottom: '1.2rem'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddSemModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newSemName.trim()}
                >
                  ตกลงเพิ่มภาคเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
