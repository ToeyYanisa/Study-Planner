import React from 'react';
import { Menu, LogIn, Sun, Moon } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';

export default function Header({ theme, onToggleTheme, onOpenAuthModal, onToggleMobileMenu, onViewChange }) {
  const { currentUser } = useAuth();

  const getInitials = (name, email) => {
    if (name) return name.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return 'SP';
  };

  return (
    <header className="top-header">
      <div className="header-left-group">
        <button
          className="mobile-menu-toggle"
          id="btn-toggle-mobile-menu"
          onClick={onToggleMobileMenu}
          aria-label="เปิดเมนู"
        >
          <Menu style={{ width: 22, height: 22 }} />
        </button>
      </div>

      <div className="header-actions">
        {/* ปุ่มสลับธีม สว่าง / มืด (แสดงทั้งบนมือถือและคอมพิวเตอร์) */}
        <button
          className="header-theme-toggle"
          id="btn-header-theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
          aria-label="เปลี่ยนโหมดสว่าง/มืด"
        >
          {theme === 'dark' ? (
            <Sun style={{ width: 19, height: 19, color: '#f59e0b' }} />
          ) : (
            <Moon style={{ width: 19, height: 19, color: '#6366f1' }} />
          )}
        </button>

        <NotificationDropdown onViewChange={onViewChange} />

        <div
          className="profile-pill"
          id="profile-pill-container"
          onClick={onOpenAuthModal}
          style={{ cursor: 'pointer' }}
          title={currentUser ? "คลิกเพื่อดูโปรไฟล์ / ออกจากระบบ" : "คลิกเพื่อเข้าสู่ระบบ"}
        >
          <div className="avatar-img" id="user-avatar" style={{ overflow: 'hidden' }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : currentUser ? (
              getInitials(currentUser.displayName, currentUser.email)
            ) : (
              <LogIn style={{ width: 16, height: 16 }} />
            )}
          </div>
          <div className="user-info-meta" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }} id="user-display-name">
              {currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : 'เข้าสู่ระบบ'}
            </span>
            <span style={{ fontSize: '0.72rem', color: currentUser ? '#10b981' : 'var(--text-dim)' }} id="user-status-text">
              {currentUser ? '● เชื่อมต่อ Cloud แล้ว' : 'คลิกเพื่อซิงค์ข้อมูล'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
