import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Play, Pause, SkipForward, Sliders, Flag, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbManager, notify } from '../services/db';

export default function PomodoroView() {
  const [pomoSettings, setPomoSettings] = useState(() =>
    dbManager.getItem('pomo_settings', { focusMin: 25, shortBreak: 5 })
  );

  const [logs, setLogs] = useState(() => {
    const data = dbManager.getItem('pomodoro_logs', []);
    return Array.isArray(data) ? data : [];
  });

  const [mode, setMode] = useState('focus');
  const focusSeconds = (pomoSettings.focusMin || 25) * 60;

  const [timeLeft, setTimeLeft] = useState(focusSeconds);
  const [totalDuration, setTotalDuration] = useState(focusSeconds);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef(null);
  const isBreak = mode === 'shortBreak';

  useEffect(() => {
    const handleStorage = () => {
      const updated = dbManager.getItem('pomo_settings', { focusMin: 25, shortBreak: 5 });
      setPomoSettings(updated);
      const updatedLogs = dbManager.getItem('pomodoro_logs', []);
      setLogs(Array.isArray(updatedLogs) ? updatedLogs : []);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      const dur = mode === 'focus' ? (pomoSettings.focusMin || 25) * 60 : (pomoSettings.shortBreak || 5) * 60;
      setTotalDuration(dur);
      setTimeLeft(dur);
    }
  }, [mode, pomoSettings.focusMin, pomoSettings.shortBreak]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const onTimerComplete = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    if (mode === 'focus') {
      notify.success(`🎉 อ่านหนังสือครบ ${pomoSettings.focusMin} นาทีแล้ว! ได้เวลาพักสายตา`);
      const currentLogs = dbManager.getItem('pomodoro_logs', []);
      const safeLogs = Array.isArray(currentLogs) ? currentLogs : [];
      const newLogs = [...safeLogs, { duration: pomoSettings.focusMin, timestamp: new Date().toISOString() }];
      setLogs(newLogs);
      dbManager.setItem('pomodoro_logs', newLogs);
      switchMode('shortBreak');
    } else {
      notify.info('👁️ หมดเวลาพักสายตาแล้ว! พร้อมเริ่มอ่านหนังสือเซสชันถัดไป');
      switchMode('focus');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    const dur = newMode === 'focus' ? (pomoSettings.focusMin || 25) * 60 : (pomoSettings.shortBreak || 5) * 60;
    setTotalDuration(dur);
    setTimeLeft(dur);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const dur = mode === 'focus' ? (pomoSettings.focusMin || 25) * 60 : (pomoSettings.shortBreak || 5) * 60;
    setTotalDuration(dur);
    setTimeLeft(dur);
    notify.info('รีเซ็ตเวลาแล้ว');
  };

  const skipTimer = () => {
    setIsRunning(false);
    if (mode === 'focus') switchMode('shortBreak');
    else switchMode('focus');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Streak Calculation
  const getStreakDays = (allLogs) => {
    if (!Array.isArray(allLogs) || allLogs.length === 0) return 0;
    const activeDates = new Set(
      allLogs.map(log => {
        const d = new Date(log.timestamp);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      }).filter(Boolean)
    );

    let streak = 0;
    let curr = new Date();
    let currStr = curr.toISOString().split('T')[0];
    if (!activeDates.has(currStr)) {
      curr.setDate(curr.getDate() - 1);
      currStr = curr.toISOString().split('T')[0];
    }

    while (activeDates.has(currStr)) {
      streak++;
      curr.setDate(curr.getDate() - 1);
      currStr = curr.toISOString().split('T')[0];
    }

    return streak;
  };

  // Today Stats Calculations
  const todayStr = new Date().toDateString();
  const safeLogs = Array.isArray(logs) ? logs : [];
  const todayLogs = safeLogs.filter(log => {
    const d = new Date(log.timestamp);
    return !isNaN(d.getTime()) && d.toDateString() === todayStr;
  });

  const todayMinutes = todayLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const todayHours = (todayMinutes / 60).toFixed(1);
  const dailyTargetHours = Number(pomoSettings.dailyGoalHours) || 4.0;
  const goalPercent = Math.min(100, Math.round((todayMinutes / (dailyTargetHours * 60)) * 100));
  const todaySessions = todayLogs.length;
  const streakDays = getStreakDays(safeLogs);

  const strokeDashoffset = 754 - (754 * (totalDuration - timeLeft)) / totalDuration;

  return (
    <div className="pomo-view-wrapper">
      <div className="pomo-page-header">
        <h1>จัดเวลาอ่านหนังสือ (Study & Eye Rest)</h1>
        <p>สร้างสมาธิอ่านหนังสือ สลับกับพักสายตาผ่อนคลายกล้ามเนื้อตา (สามารถปรับเปลี่ยนเวลาได้ในหน้าตั้งค่า)</p>
      </div>

      <div className="pomo-grid-layout">
        <div className="pomo-main-card">
          <div className="pomo-mode-tabs" style={{ width: '100%', maxWidth: '360px', justifyContent: 'center' }}>
            <button
              className={`pomo-mode-tab ${mode === 'focus' ? 'active' : ''}`}
              onClick={() => switchMode('focus')}
              style={{ flex: 1, textAlign: 'center' }}
            >
              🧠 อ่านหนังสือ ({pomoSettings.focusMin}น.)
            </button>
            <button
              className={`pomo-mode-tab ${mode === 'shortBreak' ? 'break-active' : ''}`}
              onClick={() => switchMode('shortBreak')}
              style={{ flex: 1, textAlign: 'center' }}
            >
              👁️ พักสายตา ({pomoSettings.shortBreak}น.)
            </button>
          </div>

          <div className="pomo-gauge-box">
            <svg className="pomo-gauge-svg" viewBox="0 0 280 280">
              <circle className="pomo-ring-track" fill="none" cx="140" cy="140" r="120" />
              <circle
                className={`pomo-ring-fill ${isBreak ? 'break-mode' : ''}`}
                fill="none"
                cx="140"
                cy="140"
                r="120"
                style={{ strokeDashoffset }}
              />
            </svg>

            <div className="pomo-center-content">
              <div className="pomo-digits-text" id="pomo-display">
                {formatTime(timeLeft)}
              </div>
              <div className="pomo-label-text" id="pomo-status-text">
                {isBreak ? '👁️ เวลาพักสายตาและผ่อนคลาย' : '🧠 เวลาอ่านหนังสือ'}
              </div>
            </div>
          </div>

          <div className="pomo-actions-row">
            <button className="pomo-icon-btn" onClick={resetTimer} title="รีเซ็ตเวลา">
              <RotateCcw style={{ width: 18, height: 18 }} />
            </button>

            <button className={`pomo-start-btn ${isBreak ? 'break-mode' : ''}`} onClick={toggleTimer}>
              {isRunning ? <Pause style={{ width: 18, height: 18 }} /> : <Play style={{ width: 18, height: 18 }} />}
              <span>
                {isRunning ? (isBreak ? 'หยุดพักสายตาก่อน' : 'พักชั่วคราว') : (isBreak ? 'เริ่มพักสายตา' : 'เริ่มอ่านหนังสือ')}
              </span>
            </button>

            <button className="pomo-icon-btn" onClick={skipTimer} title="ข้ามเซสชัน">
              <SkipForward style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="pomo-right-column">
          <div className="pomo-card">
            <div className="pomo-card-header">
              <Sliders style={{ width: 18, height: 18 }} />
              <span>ช่วงเวลาที่กำหนดไว้ (Intervals)</span>
            </div>

            <div>
              <div className="pomo-interval-row">
                <span>🧠 ระยะเวลาอ่านหนังสือ</span>
                <span className="pomo-interval-val">{pomoSettings.focusMin} นาที</span>
              </div>
              <div className="pomo-progress-track">
                <div className="pomo-progress-bar" style={{ width: '100%' }}></div>
              </div>

              <div className="pomo-interval-row" style={{ marginTop: '0.8rem' }}>
                <span>👁️ พักสายตา</span>
                <span className="pomo-interval-val">{pomoSettings.shortBreak} นาที</span>
              </div>
              <div className="pomo-progress-track" style={{ marginBottom: 0 }}>
                <div className="pomo-progress-bar" style={{ width: '30%', background: '#10b981' }}></div>
              </div>
            </div>
          </div>

          <div className="pomo-card">
            <div className="pomo-card-header">
              <Flag style={{ width: 18, height: 18 }} />
              <span>เป้าหมายประจำวัน (Daily Goal)</span>
            </div>

            <div className="pomo-goal-display">
              <div>
                <span className="pomo-goal-big">{todayHours}</span>
                <span className="pomo-goal-unit">ชม.</span>
              </div>
              <div className="pomo-goal-target">จาก {dailyTargetHours.toFixed(1)} ชม.</div>
            </div>

            <div className="pomo-goal-track">
              <div className="pomo-goal-fill" style={{ width: `${goalPercent}%` }}></div>
            </div>

            <div className="pomo-goal-stats-row">
              <div className="pomo-stat-block">
                <div className="pomo-stat-title">จำนวนรอบ</div>
                <div className="pomo-stat-num">{todaySessions}</div>
              </div>

              <div className="pomo-stat-block" style={{ alignItems: 'flex-end' }}>
                <div className="pomo-stat-title">อ่านต่อเนื่อง</div>
                <div className="pomo-stat-num">
                  {streakDays} <span style={{ fontSize: '0.95rem' }}>🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

