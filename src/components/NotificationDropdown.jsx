import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCheck, Trash2, X, AlertTriangle, Calendar, CheckCircle2, 
  Info, Volume2, ShieldCheck, ExternalLink, Sparkles 
} from 'lucide-react';
import { dbManager, notify } from '../services/db';
import { 
  generateSmartNotifications, 
  requestBrowserNotificationPermission, 
  sendBrowserPushNotification 
} from '../services/notificationService';

export default function NotificationDropdown({ onViewChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [browserPermission, setBrowserPermission] = useState(() => 
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const dropdownRef = useRef(null);
  const hasTriggeredInitialPush = useRef(false);

  // คำนวณการแจ้งเตือนจากข้อมูลการบ้านและสอบจริง
  const refreshNotifications = () => {
    const assignments = dbManager.getItem('assignments', []);
    const exams = dbManager.getItem('exams', []);
    const readIds = dbManager.getItem('read_notification_ids', []);
    const dismissedIds = dbManager.getItem('dismissed_notification_ids', []);

    // สร้างการแจ้งเตือนจากเดดไลน์จริง
    const smartList = generateSmartNotifications(assignments, exams);

    // กรองรายการที่ถูกกดลบออก และผูกสถานะอ่านแล้ว
    const activeList = smartList
      .filter(item => !dismissedIds.includes(item.id))
      .map(item => ({
        ...item,
        read: readIds.includes(item.id)
      }));

    setNotifications(activeList);

    // ยิง Push Notification สำหรับงานที่ครบกำหนดส่งวันนี้หรือเลยกำหนด (ยิงครั้งเดียวต่อเซสชัน)
    if (!hasTriggeredInitialPush.current && browserPermission === 'granted') {
      const urgentItems = activeList.filter(item => item.type === 'urgent' && !item.read);
      if (urgentItems.length > 0) {
        const topItem = urgentItems[0];
        sendBrowserPushNotification(
          topItem.title, 
          topItem.message, 
          () => {
            if (topItem.view && onViewChange) onViewChange(topItem.view);
          }
        );
        hasTriggeredInitialPush.current = true;
      }
    }
  };

  // โหลดการแจ้งเตือนเมื่อเปิดคอมโพเนนต์
  useEffect(() => {
    refreshNotifications();
  }, []);

  // เมื่อเปิด Dropdown ให้คำนวณข้อมูลใหม่สดๆ เสมอ
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const prevRead = dbManager.getItem('read_notification_ids', []);
    const updated = Array.from(new Set([...prevRead, ...allIds]));
    dbManager.setItem('read_notification_ids', updated);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notify.success('ทำเครื่องหมายอ่านแล้วทั้งหมด');
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    const prevDismissed = dbManager.getItem('dismissed_notification_ids', []);
    const updated = Array.from(new Set([...prevDismissed, ...allIds]));
    dbManager.setItem('dismissed_notification_ids', updated);
    setNotifications([]);
    notify.info('ล้างการแจ้งเตือนทั้งหมดแล้ว');
  };

  const handleItemClick = (notification) => {
    // บันทึกสถานะอ่านแล้ว
    const prevRead = dbManager.getItem('read_notification_ids', []);
    if (!prevRead.includes(notification.id)) {
      dbManager.setItem('read_notification_ids', [...prevRead, notification.id]);
    }

    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );

    // นำทางไปยังหน้าที่เกี่ยวข้อง
    if (notification.view && onViewChange) {
      onViewChange(notification.view);
      setIsOpen(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      notify.success('เปิดการแจ้งเตือนผ่านเบราว์เซอร์สำเร็จ');
      sendBrowserPushNotification(
        'Study Planner 🎓',
        'ระบบแจ้งเตือนเดดไลน์อัตโนมัติพร้อมทำงานแล้ว!',
        () => window.focus()
      );
    } else if (res === 'denied') {
      notify.info('คุณได้ปฏิเสธการแจ้งเตือน สามารถเปิดใหม่ได้ที่การตั้งค่าเบราว์เซอร์');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444' }} />;
      case 'warning':
        return <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b' }} />;
      case 'success':
        return <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981' }} />;
      default:
        return <Info style={{ width: 16, height: 16, color: 'var(--primary)' }} />;
    }
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className="btn btn-secondary btn-sm notify-bell-btn"
        id="btn-toggle-notify"
        title="การแจ้งเตือนเดดไลน์และตารางสอบ"
        onClick={() => setIsOpen(prev => !prev)}
        style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, position: 'relative' }}
      >
        <Bell style={{ width: 18, height: 18 }} />
        {unreadCount > 0 && (
          <span className="notify-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="notify-popover-card">
          {/* Header */}
          <div className="notify-card-header">
            <div className="notify-card-title">
              <Bell style={{ width: 16, height: 16, color: 'var(--primary)' }} />
              <span>การแจ้งเตือนอัตโนมัติ</span>
              {unreadCount > 0 && (
                <span className="notify-pill-tag">{unreadCount} ใหม่</span>
              )}
            </div>
            <button className="notify-icon-close" onClick={() => setIsOpen(false)}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Banner ขอสิทธิ์ Browser Push Notification (ถ้ายังไม่ได้เปิด) */}
          {browserPermission === 'default' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(79, 110, 247, 0.08), rgba(139, 92, 246, 0.08))',
              borderBottom: '1px solid var(--border-color)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.8rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                <strong>🔔 รับการแจ้งเตือนเดดไลน์</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  แจ้งเตือนงานด่วนเด้งที่หน้าจอ
                </div>

              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRequestPermission}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', flexShrink: 0 }}
              >
                เปิดแจ้งเตือน
              </button>
            </div>
          )}

          {/* Subheader Toolbar & Tabs */}
          <div className="notify-toolbar">
            <div className="notify-tabs">
              <button
                className={`notify-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                ทั้งหมด ({notifications.length})
              </button>
              <button
                className={`notify-tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                ด่วน / ยังไม่อ่าน ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="notify-action-links">
                {unreadCount > 0 && (
                  <button className="notify-link-btn" onClick={markAllAsRead} title="อ่านแล้วทั้งหมด">
                    <CheckCheck style={{ width: 14, height: 14 }} /> อ่านแล้ว
                  </button>
                )}
                <button className="notify-link-btn danger" onClick={clearAll} title="ล้างทั้งหมด">
                  <Trash2 style={{ width: 14, height: 14 }} /> ล้าง
                </button>
              </div>
            )}
          </div>

          {/* List Items */}
          <div className="notify-list-body">
            {filteredNotifications.length === 0 ? (
              <div className="notify-empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: '#10b981', margin: '0 auto 0.5rem', opacity: 0.8 }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>
                  ไม่มีงานค้างที่ต้องส่งด่วน!
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  การบ้านและการสอบทั้งหมดของคุณเรียบร้อยดี
                </span>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  className={`notify-item ${!item.read ? 'unread' : ''}`}
                  onClick={() => handleItemClick(item)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: item.type === 'urgent' ? '3px solid #ef4444' : item.type === 'warning' ? '3px solid #f59e0b' : 'none'
                  }}
                >
                  <div className="notify-item-icon">{getIcon(item.type)}</div>
                  <div className="notify-item-content" style={{ flex: 1 }}>
                    <div className="notify-item-title-row">
                      <span className="notify-item-title" style={{ fontWeight: item.read ? 600 : 700 }}>
                        {item.title}
                      </span>
                      <span className="notify-item-time" style={{
                        color: item.type === 'urgent' ? '#ef4444' : 'var(--text-dim)',
                        fontWeight: item.type === 'urgent' ? 700 : 500
                      }}>
                        {item.time}
                      </span>
                    </div>
                    <div className="notify-item-msg">{item.message}</div>
                  </div>
                  {!item.read && <div className="notify-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
