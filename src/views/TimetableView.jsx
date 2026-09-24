import React, { useState, useRef } from 'react';
import { Plus, Download, MapPin, Clock, Trash2, User } from 'lucide-react';
import { dbManager, notify } from '../services/db';
import { exportElementToImage } from '../services/imageExport';
import ImagePreviewModal from '../components/ImagePreviewModal';


const DEFAULT_COURSES = [];

export default function TimetableView() {
  const [courses, setCourses] = useState(() => dbManager.getItem('courses', DEFAULT_COURSES));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const timetableRef = useRef(null);

  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    instructor: '',
    room: '',
    day: 'จันทร์',
    startTime: '08:00',
    endTime: '09:30',
    color: '#6366f1'
  });

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) return;

    const blockClasses = ['course-block-purple', 'course-block-red', 'course-block-green', 'course-block-lavender'];
    const randomClass = blockClasses[Math.floor(Math.random() * blockClasses.length)];

    const updated = [...courses, { ...newCourse, id: 'c_' + Date.now(), blockClass: randomClass }];
    setCourses(updated);
    dbManager.setItem('courses', updated);
    notify.success('เพิ่มวิชาเรียนเรียบร้อยแล้ว');
    setIsModalOpen(false);
    setNewCourse({
      code: '',
      name: '',
      instructor: '',
      room: '',
      day: 'จันทร์',
      startTime: '08:00',
      endTime: '09:30',
      color: '#6366f1'
    });
  };

  const handleDeleteCourse = (id) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    dbManager.setItem('courses', updated);
    notify.info('ลบรายวิชาเรียบร้อยแล้ว');
  };

  // Download image handler with mobile compatibility
  const handleDownloadImage = async () => {
    if (!timetableRef.current) return;
    setIsExporting(true);
    notify.info('กำลังสร้างรูปภาพตารางเรียน...');

    try {
      const res = await exportElementToImage(
        timetableRef.current,
        'ตารางเรียน_ภาคเรียนที่1_2026.png',
        'ตารางเรียน'
      );
      if (res?.dataUrl || res?.blobUrl) {
        // สำหรับมือถือ แสดงพรีวิวให้แตะค้างเซฟรูปได้ง่ายๆ
        if (res.isMobile) {
          setPreviewImage(res.blobUrl || res.dataUrl);
        }
      }
    } catch (err) {
      console.error('Failed to export image:', err);
      notify.info('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setIsExporting(false);
    }
  };


  const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
  const TIME_SLOTS = [
    { label: '08:00', timeVal: '08:00' },
    { label: '09:00', timeVal: '09:00' },
    { label: '10:00', timeVal: '10:00' },
    { label: '11:00', timeVal: '11:00' },
    { label: '12:00', timeVal: '12:00' },
    { label: '13:00', timeVal: '13:00' },
    { label: '14:00', timeVal: '14:00' },
    { label: '15:00', timeVal: '15:00' }
  ];

  return (
    <div>
      {/* Header Bar */}
      <div className="timetable-header-bar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="timetable-title">ตารางเรียน</h2>
          <div className="timetable-subtitle">ภาคเรียนที่ 1 / 2026</div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadImage}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download style={{ width: 18, height: 18 }} />
            <span>{isExporting ? 'กำลังสร้างรูปภาพ...' : 'ดาวน์โหลดรูปภาพ'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            <span>เพิ่มวิชา</span>
          </button>
        </div>
      </div>

      {/* Exportable Timetable Wrapper */}
      <div className="timetable-wrapper" ref={timetableRef} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
        {/* Title for Exported Image */}
        <div style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>ตารางเรียน (Timetable)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ภาคเรียนที่ 1 / 2026</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Study Planner App</span>
        </div>

        <table className="timetable-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>เวลา</th>
              {DAYS.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => {
              return (
                <tr key={slot.timeVal}>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {slot.label}
                  </td>
                  {DAYS.map(day => {
                    const matchedCourses = courses.filter(c => c.day === day && c.startTime.startsWith(slot.timeVal.slice(0, 2)));
                    return (
                      <td key={day + slot.timeVal}>
                        {matchedCourses.map(c => (
                          <div key={c.id} className={`course-block ${c.blockClass || 'course-block-purple'}`} style={{ marginBottom: '0.3rem' }}>
                            {/* 1. ชื่อวิชา */}
                            <div className="course-block-title">{c.name}</div>

                            {/* 2. ห้องที่เรียน */}
                            {c.room && (
                              <div className="course-block-meta">
                                <MapPin style={{ width: 12, height: 12 }} /> {c.room}
                              </div>
                            )}

                            {/* 3. เวลาเรียน */}
                            <div className="course-block-meta" style={{ marginTop: '0.15rem' }}>
                              <Clock style={{ width: 12, height: 12 }} /> {c.startTime} - {c.endTime}
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dynamic Courses List Cards */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
          รายวิชาทั้งหมด ({courses.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {courses.map(c => (
            <div key={c.id} className="card" style={{ borderLeft: `4px solid ${c.color || '#6366f1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-primary">{c.code}</span>
                <div style={{ fontWeight: 700, marginTop: '0.4rem', color: 'var(--text-main)' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>📍 {c.room || 'ไม่ระบุห้อง'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏰ {c.day} {c.startTime} - {c.endTime}</div>
              </div>
              <button
                onClick={() => handleDeleteCourse(c.id)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                title="ลบวิชา"
              >
                <Trash2 style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Course */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มรายวิชาใหม่</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddCourse} style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>รหัสวิชา</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น CS201"
                  value={newCourse.code}
                  onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>ชื่อวิชา</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Data Structures"
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>วันเรียน</label>
                <select
                  className="form-control"
                  value={newCourse.day}
                  onChange={e => setNewCourse({ ...newCourse, day: e.target.value })}
                >
                  <option value="จันทร์">จันทร์</option>
                  <option value="อังคาร">อังคาร</option>
                  <option value="พุธ">พุธ</option>
                  <option value="พฤหัสบดี">พฤหัสบดี</option>
                  <option value="ศุกร์">ศุกร์</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>เวลาเริ่ม</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น 08:00"
                    value={newCourse.startTime}
                    onChange={e => setNewCourse({ ...newCourse, startTime: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>เวลาสิ้นสุด</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น 09:30"
                    value={newCourse.endTime}
                    onChange={e => setNewCourse({ ...newCourse, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>ห้องเรียน</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Room 302"
                  value={newCourse.room}
                  onChange={e => setNewCourse({ ...newCourse, room: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึกวิชา</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal for Mobile / Direct Saving */}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage}
        filename="ตารางเรียน_ภาคเรียนที่1_2026.png"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
