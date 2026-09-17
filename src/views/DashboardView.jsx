import React from 'react';
import { Clock, MapPin, Timer, Calendar, CheckSquare } from 'lucide-react';
import { dbManager } from '../services/db';

export default function DashboardView({ onViewChange }) {
  const courses = dbManager.getItem('courses', []);
  const assignments = dbManager.getItem('assignments', []);
  const exams = dbManager.getItem('exams', []);
  const pomoLogs = dbManager.getItem('pomodoro_logs', []);
  const grades = dbManager.getItem('grades', []);

  const upcomingExams = [...exams].sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
  const nearestExam = upcomingExams[0] || { subject: 'Linear Algebra Midterm', examDate: '2026-09-10T09:00' };
  const diffTime = Math.max(0, new Date(nearestExam.examDate || '2026-09-10') - new Date());
  const daysToExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 12;

  const totalPomoMinutes = pomoLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const weeklyHours = totalPomoMinutes > 0 ? (totalPomoMinutes / 60).toFixed(1) : "14.5";

  let totalCredits = 0, totalPoints = 0;
  grades.forEach(g => {
    const credits = g.credits || 3;
    const score = (g.midtermScore || 0) + (g.finalScore || 0) + (g.assignmentScore || 0);
    let point = 4.0;
    if (score < 50) point = 0;
    else if (score < 60) point = 1.5;
    else if (score < 70) point = 2.5;
    else if (score < 80) point = 3.5;
    totalCredits += credits;
    totalPoints += point * credits;
  });
  const currentGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "3.84";

  return (
    <div className="dashboard-container">
      <div>
        <h2 className="dash-welcome-title">ยินดีต้อนรับกลับ, สมชาย 👋</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          ภาพรวมการเรียนและเป้าหมายประจำสัปดาห์ของคุณ
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Card 1: Today's Classes */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock style={{ color: 'var(--primary)', width: 18, height: 18 }} />
              <span>คลาสเรียนวันนี้ (Today's Classes)</span>
            </div>
            <button
              onClick={() => onViewChange('timetable')}
              style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ดูตารางเรียนทั้งหมด &rarr;
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div className="dash-today-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="dash-time-box">
                  09:00 AM<br />
                  <span style={{ color: 'var(--text-dim)' }}>10:30 AM</span>
                </div>
                <div>
                  <div className="dash-course-title">Advanced Linear Algebra</div>
                  <div className="dash-course-loc">
                    <MapPin style={{ width: 14, height: 14 }} /> Room 302, Science Building
                  </div>
                </div>
              </div>
              <span className="badge badge-primary">MATH301</span>
            </div>
            <div className="dash-today-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="dash-time-box">
                  11:00 AM<br />
                  <span style={{ color: 'var(--text-dim)' }}>12:30 PM</span>
                </div>
                <div>
                  <div className="dash-course-title">Data Structures</div>
                  <div className="dash-course-loc">
                    <MapPin style={{ width: 14, height: 14 }} /> Lab B, Tech Center
                  </div>
                </div>
              </div>
              <span className="badge badge-primary">CS201</span>
            </div>
          </div>
        </div>

        {/* Card 2: Focus Time */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ marginBottom: '0.3rem' }}>
              <Timer style={{ color: 'var(--primary)', width: 18, height: 18 }} />
              <span>เวลาอ่านหนังสือ (Focus Time)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ความก้าวหน้าในสัปดาห์นี้</div>
            <div
              style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: '1rem 0 0.5rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {weeklyHours} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dim)' }}>ชม.</span>
            </div>
          </div>
          <div>
            <div className="progress-bar-bg" style={{ height: 10, marginBottom: '0.5rem' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (parseFloat(weeklyHours) / 20) * 100)}%` }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              <span>เป้าหมาย: 20 ชม.</span>
              <span>{( (parseFloat(weeklyHours) / 20) * 100 ).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2 */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        {/* Card 3: Upcoming Exam */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar style={{ color: 'var(--primary)', width: 18, height: 18 }} />
              <span>การสอบถัดไป (Next Exam)</span>
            </div>
            <span className="badge badge-warning">อีก {daysToExam} วัน</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            {nearestExam.subject}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            📍 {nearestExam.location || 'Hall B, Science Building'}
          </div>
        </div>

        {/* Card 4: GPA Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ marginBottom: '0.3rem' }}>
              <span>GPA เฉลี่ยมุ่งสู่เป้าหมาย</span>
            </div>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#10b981',
                margin: '0.5rem 0',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {currentGPA} <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>/ 4.00</span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onViewChange('grades')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            ดูการวิเคราะห์การเรียน &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
