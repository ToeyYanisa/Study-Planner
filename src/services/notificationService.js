/* ==========================================================================
   Study Planner - Smart Notification & Browser Web Push Service
   ========================================================================== */

/**
 * คำนวณความต่างของจำนวนวันระหว่างวันที่เป้าหมายกับปัจจุบัน
 */
function getDayDiff(targetDateStr) {
  if (!targetDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * สร้างรายการแจ้งเตือนอัตโนมัติจากการบ้านและตารางสอบจริง
 */
export function generateSmartNotifications(assignments = [], exams = []) {
  const notifs = [];

  // 1. ตรวจสอบการบ้าน (Assignments)
  assignments.forEach((item) => {
    if (item.status === 'completed' || !item.dueDate) return;

    const diffDays = getDayDiff(item.dueDate);
    if (diffDays === null) return;

    if (diffDays < 0) {
      notifs.push({
        id: `assign_overdue_${item.id}`,
        title: '⚠️ งานเลยกำหนดส่งแล้ว!',
        message: `"${item.title}" (${item.subject || 'วิชาเรียน'}) เลยกำหนดส่งมาแล้ว ${Math.abs(diffDays)} วัน`,
        time: `เลยกำหนด ${Math.abs(diffDays)} วัน`,
        type: 'urgent',
        view: 'assignments',
        urgencyScore: 100 + Math.abs(diffDays)
      });
    } else if (diffDays === 0) {
      notifs.push({
        id: `assign_today_${item.id}`,
        title: '🚨 งานครบกำหนดส่งวันนี้!',
        message: `"${item.title}" ต้องส่งภายในวันนี้ กรุณาตรวจสอบความเรียบร้อย`,
        time: 'วันนี้',
        type: 'urgent',
        view: 'assignments',
        urgencyScore: 90
      });
    } else if (diffDays <= 3) {
      notifs.push({
        id: `assign_soon_${item.id}`,
        title: '⏳ งานใกล้ถึงกำหนดส่ง',
        message: `"${item.title}" (${item.subject || ''}) ครบกำหนดส่งในอีก ${diffDays} วัน`,
        time: `อีก ${diffDays} วัน`,
        type: 'warning',
        view: 'assignments',
        urgencyScore: 50 - diffDays
      });
    }
  });

  // 2. ตรวจสอบตารางสอบ (Exams)
  exams.forEach((exam) => {
    if (!exam.examDate) return;
    const diffDays = getDayDiff(exam.examDate);
    if (diffDays === null) return;

    if (diffDays === 0) {
      notifs.push({
        id: `exam_today_${exam.id}`,
        title: '🎯 คุณมีสอบวันนี้!',
        message: `วิชา "${exam.subject}" ${exam.location ? `ที่ห้อง ${exam.location}` : ''} ${exam.seatNumber ? `(ที่นั่ง ${exam.seatNumber})` : ''}`,
        time: 'วันนี้',
        type: 'urgent',
        view: 'exams',
        urgencyScore: 95
      });
    } else if (diffDays > 0 && diffDays <= 5) {
      notifs.push({
        id: `exam_soon_${exam.id}`,
        title: '📖 เตรียมตัวสอบ',
        message: `สอบวิชา "${exam.subject}" ในอีก ${diffDays} วัน ${exam.note ? `(โน้ต: ${exam.note})` : ''}`,
        time: `อีก ${diffDays} วัน`,
        type: diffDays <= 2 ? 'urgent' : 'warning',
        view: 'exams',
        urgencyScore: 60 - diffDays
      });
    }
  });

  // เรียงลำดับความด่วนมากไปหาน้อย
  notifs.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0));

  return notifs;
}

/**
 * ตรวจสอบและขอสิทธิ์การแจ้งเตือนผ่านเบราว์เซอร์
 */
export async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Notification permission request error:', e);
    return 'denied';
  }
}

/**
 * ส่งแจ้งเตือนผ่านเบราว์เซอร์ (Web Push Popup)
 */
export function sendBrowserPushNotification(title, body, onClick = null) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }
  try {
    const notification = new Notification(title, {
      body: body,
      icon: '/vite.svg', // หรือ icon โลโก้แอป
      badge: '/vite.svg',
      tag: 'study-planner-deadline',
      renotify: true
    });

    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
    return notification;
  } catch (e) {
    console.error('Error firing browser notification:', e);
    return null;
  }
}
