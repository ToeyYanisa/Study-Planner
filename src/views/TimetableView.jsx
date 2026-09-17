import React, { useState } from 'react';
import { Plus, MapPin, User, Trash2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';

export default function TimetableView() {
  const [courses, setCourses] = useState(() => dbManager.getItem('courses', []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    instructor: '',
    room: '',
    day: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    color: '#6366f1'
  });

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) return;
    const updated = [...courses, { ...newCourse, id: 'c_' + Date.now() }];
    setCourses(updated);
    dbManager.setItem('courses', updated);
    notify.success('เพิ่มวิชาเรียนเรียบร้อยแล้ว');
    setIsModalOpen(false);
    setNewCourse({
      code: '',
      name: '',
      instructor: '',
      room: '',
      day: 'Monday',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      color: '#6366f1'
    });
  };

  const handleDeleteCourse = (id) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    dbManager.setItem('courses', updated);
    notify.info('ลบรายวิชาเรียบร้อยแล้ว');
  };

  return (
    <div>
      <div className="timetable-header-bar">
        <div>
          <h2 className="timetable-title">ตารางเรียน</h2>
          <div className="timetable-subtitle">ภาคเรียนที่ 1 / 2026</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus style={{ width: 18, height: 18 }} /> เพิ่มวิชา
        </button>
      </div>

      <div className="timetable-wrapper">
        <table className="timetable-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>เวลา</th>
              <th>จันทร์</th>
              <th>อังคาร</th>
              <th>
                <span className="timetable-day-pill active">พุธ</span>
              </th>
              <th>พฤหัสบดี</th>
              <th>ศุกร์</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.8rem' }}>08:00</td>
              <td>
                <div className="course-block course-block-purple">
                  <div className="course-block-title">Data Structures</div>
                  <div className="course-block-meta">
                    <MapPin style={{ width: 12, height: 12 }} /> Room 302
                  </div>
                  <div className="course-block-meta">
                    <User style={{ width: 12, height: 12 }} /> Dr. Alan Turing
                  </div>
                </div>
              </td>
              <td></td><td></td><td></td><td></td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.8rem' }}>09:00</td>
              <td></td><td></td>
              <td>
                <div className="course-block course-block-red">
                  <div className="course-block-title">Linear Algebra</div>
                  <div className="course-block-meta">
                    <MapPin style={{ width: 12, height: 12 }} /> Hall B
                  </div>
                  <div className="course-block-meta">
                    <User style={{ width: 12, height: 12 }} /> Prof. Lovelace
                  </div>
                </div>
              </td>
              <td></td><td></td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.8rem' }}>10:00</td>
              <td></td>
              <td>
                <div className="course-block course-block-green">
                  <div className="course-block-title">Organic Chem</div>
                  <div className="course-block-meta">
                    <MapPin style={{ width: 12, height: 12 }} /> Lab 4
                  </div>
                  <div className="course-block-meta">
                    <User style={{ width: 12, height: 12 }} /> Dr. Curie
                  </div>
                </div>
              </td>
              <td></td>
              <td>
                <div className="course-block course-block-green">
                  <div className="course-block-title">Organic Chem</div>
                  <div className="course-block-meta">
                    <MapPin style={{ width: 12, height: 12 }} /> Lab 4
                  </div>
                  <div className="course-block-meta">
                    <User style={{ width: 12, height: 12 }} /> Dr. Curie
                  </div>
                </div>
              </td>
              <td></td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.8rem' }}>12:00</td>
              <td colSpan="5" style={{ textAlign: 'center', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                🥪 พักรับประทานอาหารกลางวัน (Lunch Break)
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.8rem' }}>13:00</td>
              <td>
                <div className="course-block course-block-lavender">
                  <div className="course-block-title">Modern History</div>
                  <div className="course-block-meta">
                    <MapPin style={{ width: 12, height: 12 }} /> Room 101
                  </div>
                  <div className="course-block-meta">
                    <User style={{ width: 12, height: 12 }} /> Prof. Smith
                  </div>
                </div>
              </td>
              <td></td><td></td><td></td>
              <td>
                <div className="course-block course-block-lavender">
                  <div className="course-block-title">Modern History</div>
                  <div className="course-block-meta">
                    <MapPin style={{ width: 12, height: 12 }} /> Room 101
                  </div>
                  <div className="course-block-meta">
                    <User style={{ width: 12, height: 12 }} /> Prof. Smith
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dynamic Courses Cards */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>รายวิชาทั้งหมด ({courses.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {courses.map(c => (
            <div key={c.id} className="card" style={{ borderLeft: `4px solid ${c.color || '#6366f1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-primary">{c.code}</span>
                <div style={{ fontWeight: 700, marginTop: '0.4rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {c.room}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👨‍🏫 {c.instructor}</div>
              </div>
              <button
                onClick={() => handleDeleteCourse(c.id)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.4rem' }}
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
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>รหัสวิชา</label>
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
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>ชื่อวิชา</label>
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
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>ผู้สอน</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Dr. Alan Turing"
                  value={newCourse.instructor}
                  onChange={e => setNewCourse({ ...newCourse, instructor: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>ห้องเรียน</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Lab B, Tech Center"
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
    </div>
  );
}
