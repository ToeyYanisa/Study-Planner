import React, { useState, useEffect } from 'react';
import {
  User, Palette, Timer, Database, Info,
  ChevronRight, Check, Moon, Sun, Trash2, Download,
  Shield, Volume2, Languages, BookOpen, Target, Flag, Trophy
} from 'lucide-react';
import { dbManager, notify } from '../services/db';
import { useAuth } from '../context/AuthContext';


// ── Reusable sub-components ─────────────────────────────────────────────────
function SettingSection({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <Icon style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <div className="settings-section-title">{title}</div>
          {subtitle && <div className="settings-section-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="setting-row">
      <div className="setting-row-label">
        <span>{label}</span>
        {description && <span className="setting-row-desc">{description}</span>}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <label className="toggle-switch" htmlFor={id} style={{ cursor: 'pointer' }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <div className={`toggle-track ${checked ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </label>
  );
}

// ── Main Settings View ───────────────────────────────────────────────────────
export default function SettingsView({ theme, onToggleTheme }) {
  const { currentUser, updateUserProfile } = useAuth();

  // Profile state
  const [profile, setProfile] = useState(() => {
    const saved = dbManager.getItem('profile', null);
    if (saved) return saved;
    return {
      name: currentUser?.displayName || 'เพื่อนนักศึกษา',
      studentId: '6512345678',
      year: '2',
      faculty: 'วิทยาศาสตร์และเทคโนโลยี',
      major: 'วิทยาการคอมพิวเตอร์',
      gpaTarget: '3.50'
    };
  });

  useEffect(() => {
    if (currentUser?.displayName) {
      setProfile(prev => {
        if (!prev.name || prev.name === 'เพื่อนนักศึกษา' || prev.name === 'สมชาย วงศ์สว่าง') {
          return { ...prev, name: currentUser.displayName };
        }
        return prev;
      });
    }
  }, [currentUser]);

  // Pomodoro & Goal settings
  const [pomoSettings, setPomoSettings] = useState(() =>
    dbManager.getItem('pomo_settings', {
      focusMin: 25,
      shortBreak: 5,
      dailyGoalHours: 4.0,
      weeklyGoalHours: 20
    })
  );

  const [activeTab, setActiveTab] = useState('profile');

  const saveProfile = async () => {
    dbManager.setItem('profile', profile);
    if (currentUser && profile.name) {
      await updateUserProfile({ displayName: profile.name });
    }
    notify.success('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
  };


  const saveNotif = (key, val) => {
    const updated = { ...notifSettings, [key]: val };
    setNotifSettings(updated);
    dbManager.setItem('notif_settings', updated);
  };

  const savePomoSettings = (key, val) => {
    const updated = { ...pomoSettings, [key]: val };
    setPomoSettings(updated);
    dbManager.setItem('pomo_settings', updated);
  };

  const handleClearData = (key, label) => {
    if (window.confirm(`ยืนยันการลบ "${label}" ทั้งหมด?`)) {
      localStorage.removeItem(`study_planner_${key}`);
      notify.info(`ลบ ${label} เรียบร้อยแล้ว`);
    }
  };

  const handleExportData = () => {
    const data = {
      courses: dbManager.getItem('courses', []),
      assignments: dbManager.getItem('assignments', []),
      exams: dbManager.getItem('exams', []),
      todo: dbManager.getItem('todo', []),
      grades: dbManager.getItem('grades', []),
      profile: dbManager.getItem('profile', {}),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_planner_backup_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('ส่งออกข้อมูลเรียบร้อยแล้ว');
  };

  const tabs = [
    { id: 'profile', label: 'โปรไฟล์', icon: User },
    { id: 'pomodoro', label: 'จัดเวลาและเป้าหมายอ่านหนังสือ', icon: Timer },
    { id: 'about', label: 'เกี่ยวกับ', icon: Info },
  ];

  return (
    <div className="settings-wrapper">
      {/* Page Header */}
      <div className="settings-page-header">
        <h1 className="settings-page-title">ตั้งค่า</h1>
        <p className="settings-page-subtitle">จัดการโปรไฟล์ การแสดงผล และการตั้งค่าระบบ</p>
      </div>

      <div className="settings-layout">
        {/* ── Sidebar Tabs ─────────────────────────────── */}
        <nav className="settings-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon style={{ width: 16, height: 16 }} />
                <span>{tab.label}</span>
                {activeTab === tab.id && <ChevronRight style={{ width: 14, height: 14, marginLeft: 'auto', opacity: 0.5 }} />}
              </button>
            );
          })}
        </nav>

        {/* ── Content Area ──────────────────────────────── */}
        <div className="settings-content">

          {/* ────── PROFILE ────── */}
          {activeTab === 'profile' && (
            <SettingSection icon={User} title="ข้อมูลโปรไฟล์" subtitle="ข้อมูลส่วนตัวและเป้าหมายการเรียน">
              {/* Avatar */}
              <div className="settings-avatar-row">
                <div className="settings-avatar-circle">
                  {(profile.name || 'U').charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{profile.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    นักศึกษาปีที่ {profile.year} · {profile.major}
                  </div>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">ชื่อ-นามสกุล</label>
                  <input
                    className="form-control"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">รหัสนักศึกษา</label>
                  <input
                    className="form-control"
                    value={profile.studentId}
                    onChange={e => setProfile({ ...profile, studentId: e.target.value })}
                    placeholder="รหัสนักศึกษา"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ชั้นปี</label>
                  <select
                    className="form-control"
                    value={profile.year}
                    onChange={e => setProfile({ ...profile, year: e.target.value })}
                  >
                    {['1', '2', '3', '4', '5', '6'].map(y => (
                      <option key={y} value={y}>ปีที่ {y}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">เป้าหมาย GPA</label>
                  <div style={{ position: 'relative' }}>
                    <Target style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--primary)' }} />
                    <input
                      className="form-control"
                      style={{ paddingLeft: '2.2rem' }}
                      type="number"
                      min="0" max="4" step="0.01"
                      value={profile.gpaTarget}
                      onChange={e => setProfile({ ...profile, gpaTarget: e.target.value })}
                      placeholder="3.50"
                    />
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">คณะ</label>
                  <input
                    className="form-control"
                    value={profile.faculty}
                    onChange={e => setProfile({ ...profile, faculty: e.target.value })}
                    placeholder="คณะ"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">สาขาวิชา</label>
                  <input
                    className="form-control"
                    value={profile.major}
                    onChange={e => setProfile({ ...profile, major: e.target.value })}
                    placeholder="สาขาวิชา"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={saveProfile}>
                  <Check style={{ width: 16, height: 16 }} /> บันทึกโปรไฟล์
                </button>
              </div>
            </SettingSection>
          )}

          {/* ────── POMODORO / STUDY TIMER & GOALS ────── */}
          {activeTab === 'pomodoro' && (
            <SettingSection icon={Timer} title="ตั้งค่าเวลาและเป้าหมายอ่านหนังสือ" subtitle="ปรับแต่งระยะเวลาอ่านหนังสือ พักสายตา และกำหนดเป้าหมายประจำวัน/สัปดาห์">
              <div className="pomo-settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* 1. Focus Time */}
                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <BookOpen style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">เวลาอ่านหนังสือต่อรอบ</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('focusMin', Math.max(5, (pomoSettings.focusMin || 25) - 5))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.focusMin || 25}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('focusMin', Math.min(120, (pomoSettings.focusMin || 25) + 5))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">นาที</span>
                </div>

                {/* 2. Short Break */}
                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981' }}>
                    <Timer style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">เวลาพักสายตา</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('shortBreak', Math.max(1, (pomoSettings.shortBreak || 5) - 1))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.shortBreak || 5}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('shortBreak', Math.min(30, (pomoSettings.shortBreak || 5) + 1))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">นาที</span>
                </div>

                {/* 3. Daily Goal Hours */}
                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'rgba(245,158,11,0.10)', color: '#f59e0b' }}>
                    <Flag style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">เป้าหมายประจำวัน</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('dailyGoalHours', Math.max(0.5, Number(((pomoSettings.dailyGoalHours || 4) - 0.5).toFixed(1))))}>−</button>
                    <span className="pomo-setting-value">{(pomoSettings.dailyGoalHours || 4.0).toFixed(1)}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('dailyGoalHours', Math.min(16, Number(((pomoSettings.dailyGoalHours || 4) + 0.5).toFixed(1))))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">ชั่วโมง / วัน</span>
                </div>

                {/* 4. Weekly Goal Hours */}
                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'rgba(168,85,247,0.10)', color: '#a855f7' }}>
                    <Trophy style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">เป้าหมายประจำสัปดาห์</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('weeklyGoalHours', Math.max(1, (pomoSettings.weeklyGoalHours || 20) - 1))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.weeklyGoalHours || 20}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('weeklyGoalHours', Math.min(100, (pomoSettings.weeklyGoalHours || 20) + 1))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">ชั่วโมง / สัปดาห์</span>
                </div>
              </div>

              <div className="pomo-settings-summary" style={{ marginTop: '1.25rem' }}>
                <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span>
                  อ่านหนังสือครั้งละ {pomoSettings.focusMin || 25} นาที → พักสายตา {pomoSettings.shortBreak || 5} นาที | เป้าหมายวันละ {(pomoSettings.dailyGoalHours || 4.0).toFixed(1)} ชม. และสัปดาห์ละ {pomoSettings.weeklyGoalHours || 20} ชม.
                </span>
              </div>
            </SettingSection>
          )}

          {/* ────── ABOUT ────── */}
          {activeTab === 'about' && (
            <SettingSection icon={Info} title="เกี่ยวกับแอป" subtitle="ข้อมูลเวอร์ชันและผู้พัฒนา">
              <div className="about-app-card">
                <div className="about-app-logo">
                  <BookOpen style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                </div>
                <div className="about-app-name">Study Planner</div>
                <div className="about-app-version">เวอร์ชัน 2.0.0 · React Edition</div>
                <div className="about-app-desc">
                  แอปจัดการชีวิตการเรียนสำหรับนักศึกษา<br />
                  รวมตารางเรียน การบ้าน ตารางสอบ เกรด เอกสาร และ Pomodoro ในที่เดียว
                </div>
              </div>

              <div className="about-info-list">
                {[
                  { label: 'Framework', value: 'React 18 + Vite 6' },
                  { label: 'UI Library', value: 'Lucide React' },
                  { label: 'Charts', value: 'Chart.js + react-chartjs-2' },
                  { label: 'Storage', value: 'localStorage + IndexedDB' },
                  { label: 'Font', value: 'Inter · Kanit · Plus Jakarta Sans' },
                ].map(item => (
                  <div key={item.label} className="about-info-row">
                    <span className="about-info-label">{item.label}</span>
                    <span className="about-info-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </SettingSection>
          )}

        </div>
      </div>
    </div>
  );
}
