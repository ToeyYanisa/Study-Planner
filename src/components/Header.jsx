import React from 'react';
import { Search, Bell } from 'lucide-react';
import { notify } from '../services/db';

export default function Header({ onOpenAuthModal }) {
  const handleNotifyClick = () => {
    notify.info('เปิดการแจ้งเตือนเรียบร้อยแล้ว');
  };

  return (
    <header className="top-header">
      <div className="header-search-bar">
        <Search style={{ width: 16, height: 16, color: 'var(--text-dim)' }} />
        <input type="text" placeholder="ค้นหาบทเรียน งาน หรือเอกสาร..." />
      </div>

      <div className="header-actions">
        <button
          className="btn btn-secondary btn-sm"
          id="btn-toggle-notify"
          title="การแจ้งเตือน"
          onClick={handleNotifyClick}
          style={{ borderRadius: '50%', width: 40, height: 40, padding: 0 }}
        >
          <Bell style={{ width: 18, height: 18 }} />
        </button>

        <div
          className="profile-pill"
          id="profile-pill-container"
          onClick={onOpenAuthModal}
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar-img" id="user-avatar">
            สช
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }} id="user-display-name">
              สมชาย วงศ์สว่าง
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }} id="user-status-text">
              นักศึกษาปี 2
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
