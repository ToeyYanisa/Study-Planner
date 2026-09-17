import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';

export default function ExamsView({ onUpdateBadges }) {
  const [exams, setExams] = useState(() => dbManager.getItem('exams', []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    subject: '',
    location: '',
    examDate: '',
    seatNumber: '',
    note: ''
  });

  const saveExams = (updated) => {
    setExams(updated);
    dbManager.setItem('exams', updated);
    if (onUpdateBadges) onUpdateBadges();
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newExam.subject) return;
    const updated = [...exams, { ...newExam, id: 'e_' + Date.now() }];
    saveExams(updated);
    notify.success('เพิ่มตารางสอบใหม่เรียบร้อยแล้ว');
    setIsModalOpen(false);
    setNewExam({ subject: '', location: '', examDate: '', seatNumber: '', note: '' });
  };

  const handleDelete = (id) => {
    const updated = exams.filter(e => e.id !== id);
    saveExams(updated);
    notify.info('ลบรายการสอบเรียบร้อยแล้ว');
  };

  return (
    <div>
      <div className="timetable-header-bar">
        <div>
          <h2 className="timetable-title">ตารางสอบ (Exams)</h2>
          <div className="timetable-subtitle">นาฬิกานับถอยหลังถึงวันสอบและเลขที่นั่งสอบ</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus style={{ width: 18, height: 18 }} /> เพิ่มตารางสอบ
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {exams.map(e => (
          <div key={e.id} className="card" style={{ position: 'relative' }}>
            <button
              onClick={() => handleDelete(e.id)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              title="ลบตารางสอบ"
            >
              <Trash2 style={{ width: 16, height: 16 }} />
            </button>
            <span className="badge badge-primary">{e.subject}</span>
            <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {e.location || 'ไม่ระบุสถานที่'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              🪑 ที่นั่งสอบ: <strong>{e.seatNumber || '-'}</strong>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.7rem 0.9rem', background: 'var(--primary)', color: '#fff', borderRadius: 10, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
              📅 {e.examDate ? e.examDate.replace('T', ' เวลา ') : 'ยังไม่ระบุวันเวลา'}
            </div>
          </div>
        ))}
      </div>

      {/* Add Exam Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มรายการสอบใหม่</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>วิชา / การสอบ</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น MATH301 Midterm Exam"
                  value={newExam.subject}
                  onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>สถานที่สอบ</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Hall B, Science Bldg"
                  value={newExam.location}
                  onChange={e => setNewExam({ ...newExam, location: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>วันและเวลาสอบ</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={newExam.examDate}
                  onChange={e => setNewExam({ ...newExam, examDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>เลขที่นั่งสอบ</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น B-42"
                  value={newExam.seatNumber}
                  onChange={e => setNewExam({ ...newExam, seatNumber: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึกตารางสอบ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
