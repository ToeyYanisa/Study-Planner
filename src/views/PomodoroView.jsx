import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Play, Pause, SkipForward, Eye, Sliders, Headphones, Coffee, CloudRain, Waves, VolumeX, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbManager, notify } from '../services/db';

export default function PomodoroView() {
  const [mode, setMode] = useState('focus'); // 'focus', 'shortBreak', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSound, setActiveSound] = useState('lofi');
  const timerRef = useRef(null);

  const isBreak = mode !== 'focus';

  // Mode durations
  const modeDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

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
      notify.success('🎉 ครบรอบอ่านหนังสือ 25 นาทีแล้ว! ได้เวลาพักสายตา');
      const logs = dbManager.getItem('pomodoro_logs', []);
      logs.push({ duration: 25, timestamp: new Date().toISOString() });
      dbManager.setItem('pomodoro_logs', logs);
      switchMode('shortBreak');
    } else {
      notify.info('👁️ หมดเวลาพักสายตาแล้ว! พร้อมเริ่มเซสชันถัดไป');
      switchMode('focus');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    const dur = modeDurations[newMode];
    setTotalDuration(dur);
    setTimeLeft(dur);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
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

  // Ring stroke calculation
  const strokeDashoffset = 754 - (754 * (totalDuration - timeLeft)) / totalDuration;

  return (
    <div className="pomo-view-wrapper">
      <div className="pomo-page-header">
        <h1>จัดเวลาอ่านหนังสือ (Focus & Eye Rest Session)</h1>
        <p>สร้างสมาธิขั้นสูง พักสายตาเป็นช่วงตามกฎ 20-20-20 และบันทึกชั่วโมงเรียนอย่างเป็นระบบ</p>
      </div>

      <div className="pomo-grid-layout">
        <div className="pomo-main-card">
          <div className="pomo-mode-tabs">
            <button
              className={`pomo-mode-tab ${mode === 'focus' ? 'active' : ''}`}
              onClick={() => switchMode('focus')}
            >
              🧠 อ่านหนังสือ (25น.)
            </button>
            <button
              className={`pomo-mode-tab ${mode === 'shortBreak' ? 'break-active' : ''}`}
              onClick={() => switchMode('shortBreak')}
            >
              👁️ พักสายตา (5น.)
            </button>
            <button
              className={`pomo-mode-tab ${mode === 'longBreak' ? 'break-active' : ''}`}
              onClick={() => switchMode('longBreak')}
            >
              🌴 พักสายตายาว (15น.)
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
                {isBreak ? '☕ พักสายตาและผ่อนคลาย' : '🧠 เวลาอ่านหนังสือ'}
              </div>
            </div>
          </div>

          <div className="pomo-actions-row">
            <button className="pomo-icon-btn" onClick={resetTimer} title="รีเซ็ต">
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

          {isBreak && (
            <div className="eye-care-banner">
              <Eye style={{ width: 20, height: 20 }} />
              <div>
                <strong>💡 กฎพักสายตา 20-20-20:</strong> มองออกนอกหน้าต่างไปที่ระยะ 6 เมตร (20 ฟุต) กระพริบตาช้าๆ เพื่อผ่อนคลายกล้ามเนื้อตา
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="pomo-right-column">
          <div className="pomo-card">
            <div className="pomo-card-header">
              <Sliders style={{ width: 18, height: 18 }} />
              <span>ช่วงเวลาอ่าน (Intervals)</span>
            </div>

            <div>
              <div className="pomo-interval-row">
                <span>ระยะเวลาอ่านหนังสือ</span>
                <span className="pomo-interval-val">25 นาที</span>
              </div>
              <div className="pomo-progress-track">
                <div className="pomo-progress-bar" style={{ width: '100%' }}></div>
              </div>

              <div className="pomo-interval-row" style={{ marginTop: '0.8rem' }}>
                <span>พักสายตา</span>
                <span className="pomo-interval-val">5 นาที</span>
              </div>
              <div className="pomo-progress-track" style={{ marginBottom: 0 }}>
                <div className="pomo-progress-bar" style={{ width: '20%', background: '#10b981' }}></div>
              </div>
            </div>
          </div>

          <div className="pomo-card">
            <div className="pomo-card-header">
              <Headphones style={{ width: 18, height: 18 }} />
              <span>เสียงบรรยากาศ (Environment)</span>
            </div>

            <div className="pomo-env-grid">
              {[
                { id: 'lofi', label: 'ร้านกาแฟ Lo-Fi', icon: Coffee },
                { id: 'rain', label: 'เสียงฝนตก', icon: CloudRain },
                { id: 'waves', label: 'คลื่นทะเล', icon: Waves },
                { id: 'silent', label: 'เงียบสงบ', icon: VolumeX }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`pomo-env-tile ${activeSound === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSound(item.id);
                      notify.info(`เปลี่ยนเสียงบรรยากาศเป็น ${item.label}`);
                    }}
                  >
                    <div className="pomo-env-icon">
                      <Icon style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="pomo-env-label">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pomo-card">
            <div className="pomo-card-header">
              <Flag style={{ width: 18, height: 18 }} />
              <span>เป้าหมายประจำวัน (Daily Goal)</span>
            </div>

            <div className="pomo-goal-display">
              <div>
                <span className="pomo-goal-big">3.5</span>
                <span className="pomo-goal-unit">ชม.</span>
              </div>
              <div className="pomo-goal-target">จาก 4.0 ชม.</div>
            </div>

            <div className="pomo-goal-track">
              <div className="pomo-goal-fill"></div>
            </div>

            <div className="pomo-goal-stats-row">
              <div className="pomo-stat-block">
                <div className="pomo-stat-title">จำนวนรอบ</div>
                <div className="pomo-stat-num">7</div>
              </div>

              <div className="pomo-stat-block" style={{ alignItems: 'flex-end' }}>
                <div className="pomo-stat-title">อ่านต่อเนื่อง</div>
                <div className="pomo-stat-num">
                  4 <span style={{ fontSize: '0.95rem' }}>🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
