import React, { useState } from 'react';
import {
  User, Bell, Palette, Timer, Database, Info,
  ChevronRight, Check, Moon, Sun, Trash2, Download,
  Shield, Volume2, Languages, BookOpen, Target
} from 'lucide-react';
import { dbManager, notify } from '../services/db';

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
  // Profile state
  const [profile, setProfile] = useState(() =>
    dbManager.getItem('profile', {
      name: 'สมชาย วงศ์สว่าง',
      studentId: '6512345678',
      year: '2',
      faculty: 'วิทยาศาสตร์และเทคโนโลยี',
      major: 'วิทยาการคอมพิวเตอร์',
      gpaTarget: '3.50'
    })
  );

  // Notifications state
  const [notifSettings, setNotifSettings] = useState(() =>
    dbManager.getItem('notif_settings', {
      assignmentReminder: true,
      examReminder: true,
      pomodoroSound: true,
      dailySummary: false
    })
  );

  // Pomodoro settings
  const [pomoSettings, setPomoSettings] = useState(() =>
    dbManager.getItem('pomo_settings', {
      focusMin: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLong: 4
    })
  );

  const [activeTab, setActiveTab] = useState('profile');

  const saveProfile = () => {
    dbManager.setItem('profile', profile);
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
      courses:     dbManager.getItem('courses', []),
      assignments: dbManager.getItem('assignments', []),
      exams:       dbManager.getItem('exams', []),
      todo:        dbManager.getItem('todo', []),
      grades:      dbManager.getItem('grades', []),
      profile:     dbManager.getItem('profile', {}),
      exportedAt:  new Date().toISOString()
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
    { id: 'profile',       label: 'โปรไฟล์',       icon: User },
    { id: 'appearance',    label: 'การแสดงผล',     icon: Palette },
    { id: 'notifications', label: 'การแจ้งเตือน',  icon: Bell },
    { id: 'pomodoro',      label: 'Pomodoro',        icon: Timer },
    { id: 'data',          label: 'ข้อมูล',          icon: Database },
    { id: 'about',         label: 'เกี่ยวกับ',       icon: Info },
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
                  {profile.name.charAt(0)}
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
                    {['1','2','3','4','5','6'].map(y => (
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

          {/* ────── APPEARANCE ────── */}
          {activeTab === 'appearance' && (
            <SettingSection icon={Palette} title="การแสดงผล" subtitle="ธีม สี และรูปแบบของแอป">
              <SettingRow label="โหมดแสดงผล" description="สลับระหว่างโหมดสว่างและโหมดมืด">
                <div className="theme-selector">
                  <button
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => theme !== 'light' && onToggleTheme()}
                  >
                    <Sun style={{ width: 16, height: 16 }} />
                    <span>สว่าง</span>
                  </button>
                  <button
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => theme !== 'dark' && onToggleTheme()}
                  >
                    <Moon style={{ width: 16, height: 16 }} />
                    <span>มืด</span>
                  </button>
                </div>
              </SettingRow>

              <div className="setting-divider" />

              <SettingRow label="ภาษาแสดงผล" description="ภาษาของอินเตอร์เฟซ">
                <select className="form-control" style={{ width: 160 }}>
                  <option value="th">🇹🇭 ภาษาไทย</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </SettingRow>

              <div className="setting-divider" />

              <SettingRow label="ฟอนต์หลัก" description="รูปแบบตัวอักษร">
                <select className="form-control" style={{ width: 160 }}>
                  <option>Inter + Kanit</option>
                  <option>Kanit only</option>
                  <option>Sarabun</option>
                </select>
              </SettingRow>

              {/* Color preview strip */}
              <div className="settings-color-preview">
                <div className="color-chip" style={{ background: 'var(--primary)' }} title="Primary" />
                <div className="color-chip" style={{ background: 'var(--accent-purple)' }} title="Purple" />
                <div className="color-chip" style={{ background: 'var(--accent-cyan)' }} title="Cyan" />
                <div className="color-chip" style={{ background: 'var(--accent-emerald)' }} title="Emerald" />
                <div className="color-chip" style={{ background: 'var(--accent-amber)' }} title="Amber" />
                <div className="color-chip" style={{ background: 'var(--accent-rose)' }} title="Rose" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '0.25rem' }}>สีธีมปัจจุบัน</span>
              </div>
            </SettingSection>
          )}

          {/* ────── NOTIFICATIONS ────── */}
          {activeTab === 'notifications' && (
            <SettingSection icon={Bell} title="การแจ้งเตือน" subtitle="ปรับแต่งการแจ้งเตือนต่างๆ">
              <SettingRow label="แจ้งเตือนกำหนดส่งงาน" description="แจ้งเตือนก่อนกำหนดส่ง 1 วัน">
                <Toggle
                  id="notif-assignment"
                  checked={notifSettings.assignmentReminder}
                  onChange={e => saveNotif('assignmentReminder', e.target.checked)}
                />
              </SettingRow>
              <div className="setting-divider" />
              <SettingRow label="แจ้งเตือนวันสอบ" description="แจ้งเตือนก่อนสอบ 3 วันและวันที่สอบ">
                <Toggle
                  id="notif-exam"
                  checked={notifSettings.examReminder}
                  onChange={e => saveNotif('examReminder', e.target.checked)}
                />
              </SettingRow>
              <div className="setting-divider" />
              <SettingRow label="เสียง Pomodoro" description="เปิดเสียงเมื่อหมดเวลาและพักเสร็จ">
                <Toggle
                  id="notif-pomo"
                  checked={notifSettings.pomodoroSound}
                  onChange={e => saveNotif('pomodoroSound', e.target.checked)}
                />
              </SettingRow>
              <div className="setting-divider" />
              <SettingRow label="สรุปรายวัน" description="รับสรุปภาพรวมการเรียนทุกเย็น">
                <Toggle
                  id="notif-daily"
                  checked={notifSettings.dailySummary}
                  onChange={e => saveNotif('dailySummary', e.target.checked)}
                />
              </SettingRow>
            </SettingSection>
          )}

          {/* ────── POMODORO ────── */}
          {activeTab === 'pomodoro' && (
            <SettingSection icon={Timer} title="ตั้งค่า Pomodoro" subtitle="ปรับช่วงเวลาโฟกัสและพักผ่อน">
              <div className="pomo-settings-grid">
                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <BookOpen style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">เวลาโฟกัส</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('focusMin', Math.max(5, pomoSettings.focusMin - 5))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.focusMin}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('focusMin', Math.min(90, pomoSettings.focusMin + 5))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">นาที</span>
                </div>

                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981' }}>
                    <Timer style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">พักสั้น</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('shortBreak', Math.max(1, pomoSettings.shortBreak - 1))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.shortBreak}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('shortBreak', Math.min(30, pomoSettings.shortBreak + 1))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">นาที</span>
                </div>

                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'rgba(245,158,11,0.10)', color: '#f59e0b' }}>
                    <Timer style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">พักยาว</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('longBreak', Math.max(5, pomoSettings.longBreak - 5))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.longBreak}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('longBreak', Math.min(60, pomoSettings.longBreak + 5))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">นาที</span>
                </div>

                <div className="pomo-setting-card">
                  <div className="pomo-setting-icon" style={{ background: 'rgba(124,92,232,0.10)', color: 'var(--accent-purple)' }}>
                    <Target style={{ width: 20, height: 20 }} />
                  </div>
                  <label className="pomo-setting-label">รอบก่อนพักยาว</label>
                  <div className="pomo-setting-value-row">
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('sessionsBeforeLong', Math.max(1, pomoSettings.sessionsBeforeLong - 1))}>−</button>
                    <span className="pomo-setting-value">{pomoSettings.sessionsBeforeLong}</span>
                    <button className="pomo-adj-btn" onClick={() => savePomoSettings('sessionsBeforeLong', Math.min(8, pomoSettings.sessionsBeforeLong + 1))}>+</button>
                  </div>
                  <span className="pomo-setting-unit">รอบ</span>
                </div>
              </div>

              <div className="pomo-settings-summary">
                <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span>
                  โฟกัส {pomoSettings.focusMin} นาที → พักสั้น {pomoSettings.shortBreak} นาที (ทำซ้ำ {pomoSettings.sessionsBeforeLong} รอบ) → พักยาว {pomoSettings.longBreak} นาที
                </span>
              </div>
            </SettingSection>
          )}

          {/* ────── DATA ────── */}
          {activeTab === 'data' && (
            <SettingSection icon={Database} title="จัดการข้อมูล" subtitle="ส่งออกหรือล้างข้อมูลในแอป">
              <SettingRow label="ส่งออกข้อมูลทั้งหมด" description="บันทึกข้อมูลทุกอย่างเป็นไฟล์ JSON">
                <button className="btn btn-secondary btn-sm" onClick={handleExportData}>
                  <Download style={{ width: 15, height: 15 }} /> Export JSON
                </button>
              </SettingRow>
              <div className="setting-divider" />
              <div className="settings-danger-zone">
                <div className="danger-zone-title">
                  <Shield style={{ width: 15, height: 15 }} />
                  <span>โซนอันตราย</span>
                </div>
                {[
                  { key: 'assignments', label: 'การมอบหมายงาน' },
                  { key: 'exams', label: 'ตารางสอบ' },
                  { key: 'todo', label: 'รายการที่ต้องทำ' },
                  { key: 'courses', label: 'รายวิชา' },
                  { key: 'grades', label: 'ข้อมูลเกรด' },
                ].map(item => (
                  <div key={item.key} className="danger-row">
                    <span className="danger-row-label">ล้าง{item.label}ทั้งหมด</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleClearData(item.key, item.label)}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} /> ล้างข้อมูล
                    </button>
                  </div>
                ))}
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
                  { label: 'Framework',   value: 'React 18 + Vite 6' },
                  { label: 'UI Library',  value: 'Lucide React' },
                  { label: 'Charts',      value: 'Chart.js + react-chartjs-2' },
                  { label: 'Storage',     value: 'localStorage + IndexedDB' },
                  { label: 'Font',        value: 'Inter · Kanit · Plus Jakarta Sans' },
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
