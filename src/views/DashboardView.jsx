import React, { useState } from 'react';
import { Clock, MapPin, Timer, Calendar, CheckSquare, Plus, CheckCircle2, Circle } from 'lucide-react';
import { dbManager, notify } from '../services/db';
import { useAuth } from '../context/AuthContext';

export default function DashboardView({ onViewChange }) {
  const { currentUser } = useAuth();
  const profile = dbManager.getItem('profile', {});
  const greetingName = currentUser?.displayName || profile?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'เพื่อนนักศึกษา');

  // Real Data from dbManager
  const courses = dbManager.getItem('courses', []);
  const assignments = dbManager.getItem('assignments', []);
  const exams = dbManager.getItem('exams', []);
  const pomoLogs = dbManager.getItem('pomodoro_logs', []);
  const grades = dbManager.getItem('grades', []);

  // To-Do State & Handlers
  const [todos, setTodos] = useState(() => {
    const data = dbManager.getItem('todo', []);
    return Array.isArray(data) ? data : [];
  });
  const [newTodoText, setNewTodoText] = useState('');

  const handleQuickAddTodo = (e) => {
    e.preventDefault();
    const trimmed = newTodoText.trim();
    if (!trimmed) {
      notify.info('กรุณากรอกข้อความสิ่งที่ต้องทำ');
      return;
    }
    const safeTodos = Array.isArray(todos) ? todos : [];
    const newItem = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: trimmed,
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...safeTodos];
    setTodos(updated);
    dbManager.setItem('todo', updated);
    setNewTodoText('');
    notify.success('เพิ่มรายการที่ต้องทำเรียบร้อยแล้ว');
  };

  const handleToggleTodo = (id) => {
    const safeTodos = Array.isArray(todos) ? todos : [];
    const updated = safeTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    dbManager.setItem('todo', updated);
  };

  // 1. Calculate Today's Classes
  const daysOfWeekThai = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const daysOfWeekEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIdx = new Date().getDay();
  const todayThai = daysOfWeekThai[todayIdx];
  const todayEng = daysOfWeekEng[todayIdx];

  const todayClasses = Array.isArray(courses) ? courses.filter(c => {
    if (!c.day) return false;
    const dayLower = String(c.day).trim().toLowerCase();
    return (
      dayLower === todayThai.toLowerCase() ||
      dayLower === todayEng.toLowerCase() ||
      dayLower.includes(todayThai.toLowerCase()) ||
      dayLower.includes(todayEng.toLowerCase())
    );
  }) : [];

  // Fallback display if no classes match today
  const displayClasses = todayClasses.length > 0 ? todayClasses : (Array.isArray(courses) ? courses.slice(0, 2) : []);

  // 2. Focus Time Calculations
  const pomoSettings = dbManager.getItem('pomo_settings', { focusMin: 25, shortBreak: 5, dailyGoalHours: 4.0, weeklyGoalHours: 20 });
  const totalPomoMinutes = Array.isArray(pomoLogs) ? pomoLogs.reduce((acc, log) => acc + (log.duration || 0), 0) : 0;
  const weeklyHours = (totalPomoMinutes / 60).toFixed(1);
  const pomoGoalHours = Number(pomoSettings.weeklyGoalHours) || 20;
  const pomoPercent = Math.min(100, Math.round((parseFloat(weeklyHours) / pomoGoalHours) * 100));

  // 3. Nearest Upcoming Exam Calculation
  const now = new Date();
  const validExams = Array.isArray(exams) ? exams.filter(e => e.examDate || e.date) : [];
  const sortedExams = [...validExams].sort((a, b) => new Date(a.examDate || a.date) - new Date(b.examDate || b.date));
  const futureExams = sortedExams.filter(e => new Date(e.examDate || e.date) >= now);
  const nearestExam = futureExams[0] || sortedExams[0] || null;

  let daysToExam = 0;
  let formattedExamDate = '';
  if (nearestExam) {
    const examTime = new Date(nearestExam.examDate || nearestExam.date);
    const diffTime = examTime - now;
    daysToExam = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    if (!isNaN(examTime.getTime())) {
      formattedExamDate = examTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  // 4. GPA Calculation
  let totalCredits = 0, totalPoints = 0;
  if (Array.isArray(grades) && grades.length > 0) {
    grades.forEach(g => {
      const credits = Number(g.credits) || 3;
      const score = Number(g.totalScore) ?? ((Number(g.midtermScore) || 0) + (Number(g.finalScore) || 0) + (Number(g.assignmentScore) || 0));
      let point = 4.0;
      if (score < 50) point = 0;
      else if (score < 60) point = 1.5;
      else if (score < 70) point = 2.5;
      else if (score < 80) point = 3.5;
      totalCredits += credits;
      totalPoints += point * credits;
    });
  }
  const currentGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

  return (
    <div className="dashboard-container">
      <div>
        <h2 className="dash-welcome-title">ยินดีต้อนรับกลับ, {greetingName} 👋</h2>
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
            {displayClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                ไม่มีคลาสเรียนสำหรับวันนี้ 🎉
              </div>
            ) : (
              displayClasses.map((c, idx) => (
                <div key={c.id || idx} className="dash-today-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="dash-time-box">
                      {c.startTime || '09:00 AM'}<br />
                      <span style={{ color: 'var(--text-dim)' }}>{c.endTime || '10:30 AM'}</span>
                    </div>
                    <div>
                      <div className="dash-course-title">{c.name || c.subject || 'ชื่อวิชา'}</div>
                      <div className="dash-course-loc">
                        <MapPin style={{ width: 14, height: 14 }} /> {c.room || c.location || 'ห้องเรียน'}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-primary" style={{ backgroundColor: c.color }}>
                    {c.code || 'วิชา'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Focus Time */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-title" style={{ marginBottom: '0.3rem' }}>
              <Timer style={{ color: 'var(--primary)', width: 18, height: 18 }} />
              <span>เวลาอ่านหนังสือ (Focus Time)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ความก้าวหน้าสะสม</div>
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
                style={{ width: `${pomoPercent}%` }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              <span>เป้าหมาย: {pomoGoalHours} ชม.</span>
              <span>{pomoPercent}%</span>
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
            {nearestExam && <span className="badge badge-warning">อีก {daysToExam} วัน</span>}
          </div>
          {nearestExam ? (
            <>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {nearestExam.subject || nearestExam.name || 'การสอบ'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                📍 {nearestExam.location || nearestExam.room || 'ไม่ระบุสถานที่'}
                {formattedExamDate && ` | 🕒 ${formattedExamDate}`}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              ยังไม่มีรายการสอบในขณะนี้
            </div>
          )}
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

      {/* Card 5: To-Do List Quick Access */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <CheckSquare style={{ color: 'var(--primary)', width: 18, height: 18 }} />
            <span>รายการที่ต้องทำ (To-Do List)</span>
          </div>
          <button
            onClick={() => onViewChange('todo')}
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            จัดการรายการทั้งหมด ({todos.filter(t => !t.completed).length}) &rarr;
          </button>
        </div>

        <form onSubmit={handleQuickAddTodo} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="เพิ่มสิ่งที่ต้องทำด่วน..."
            value={newTodoText}
            onChange={e => setNewTodoText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Plus style={{ width: 16, height: 16 }} /> เพิ่ม
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {todos.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              ไม่มีรายการที่ต้องทำในขณะนี้ 🎉
            </div>
          ) : (
            todos.slice(0, 4).map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 8,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <button
                  onClick={() => handleToggleTodo(t.id)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: t.completed ? '#10b981' : 'var(--text-dim)' }}
                >
                  {t.completed ? <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981' }} /> : <Circle style={{ width: 18, height: 18 }} />}
                </button>
                <span style={{ flex: 1, fontSize: '0.88rem', textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-dim)' : 'var(--text-main)' }}>
                  {t.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


