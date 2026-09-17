import React from 'react';
import { 
  GraduationCap, 
  LayoutGrid, 
  Calendar, 
  FileText, 
  HelpCircle, 
  CheckSquare, 
  LineChart, 
  Folder, 
  Timer, 
  Settings, 
  Moon, 
  SunMoon 
} from 'lucide-react';

export default function Sidebar({ currentView, onViewChange, badgeCounts, onToggleTheme }) {
  const navItems = [
    { id: 'dashboard', label: 'หน้าหลัก', icon: LayoutGrid },
    { id: 'timetable', label: 'ตารางเวลา', icon: Calendar },
    { id: 'assignments', label: 'การมอบหมายงาน', icon: FileText, badgeKey: 'assignments' },
    { id: 'exams', label: 'สอบ', icon: HelpCircle, badgeKey: 'exams' },
    { id: 'todo', label: 'รายการที่ต้องทำ', icon: CheckSquare, badgeKey: 'todo' },
    { id: 'grades', label: 'การวิเคราะห์', icon: LineChart },
    { id: 'documents', label: 'คลังเอกสาร', icon: Folder },
    { id: 'pomodoro', label: 'จัดเวลาอ่านหนังสือ', icon: Timer },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-icon-box">
          <GraduationCap style={{ width: 26, height: 26 }} />
        </div>
        <div>
          <div className="brand-title">Study Planner</div>
          <div className="brand-subtitle">Smart Student Assistant</div>
        </div>
      </div>

      <ul className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0;

          return (
            <li
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon style={{ width: 18, height: 18 }} />
              <span>{item.label}</span>
              {item.badgeKey && (
                <span className="nav-badge" id={`badge-count-${item.badgeKey}`}>
                  {badgeCount}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button className="theme-toggle-btn" id="btn-toggle-theme" onClick={onToggleTheme}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Moon style={{ width: 16, height: 16 }} /> โหมดสว่าง/มืด
          </span>
          <SunMoon style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </aside>
  );
}
