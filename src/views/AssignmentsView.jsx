import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';

export default function AssignmentsView({ onUpdateBadges }) {
  const [assignments, setAssignments] = useState(() => dbManager.getItem('assignments', []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAssign, setNewAssign] = useState({
    title: '',
    subject: '',
    dueDate: '',
    status: 'pending',
    priority: 'high',
    note: ''
  });

  const saveAssignments = (updated) => {
    setAssignments(updated);
    dbManager.setItem('assignments', updated);
    if (onUpdateBadges) onUpdateBadges();
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAssign.title) return;
    const updated = [...assignments, { ...newAssign, id: 'a_' + Date.now() }];
    saveAssignments(updated);
    notify.success('เพิ่มการบ้านใหม่เรียบร้อยแล้ว');
    setIsModalOpen(false);
    setNewAssign({ title: '', subject: '', dueDate: '', status: 'pending', priority: 'high', note: '' });
  };

  const handleDelete = (id) => {
    const updated = assignments.filter(a => a.id !== id);
    saveAssignments(updated);
    notify.info('ลบงานเรียบร้อยแล้ว');
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = assignments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    saveAssignments(updated);
    notify.success('อัปเดตสถานะงานเรียบร้อยแล้ว');
  };

  const pending = assignments.filter(a => a.status === 'pending');
  const progress = assignments.filter(a => a.status === 'progress');
  const completed = assignments.filter(a => a.status === 'completed');

  return (
    <div>
      <div className="timetable-header-bar">
        <div>
          <h2 className="timetable-title">การมอบหมายงาน (Assignments)</h2>
          <div className="timetable-subtitle">กระดาน Kanban ติดตามสถานะงานและกำหนดวันส่ง</div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus style={{ width: 18, height: 18 }} /> เพิ่มการบ้านใหม่
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Column */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--status-pending)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🔴 ยังไม่ทำ ({pending.length})
          </h3>
          {pending.map(a => (
            <div key={a.id} style={{ background: 'var(--bg-hover)', padding: '0.9rem', borderRadius: 10, marginBottom: '0.8rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.title}</div>
                <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                วิชา: {a.subject || 'ทั่วไป'} | ส่ง: {a.dueDate || 'ไม่ระบุ'}
              </div>
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(a.id, 'progress')}>
                  👉 ย้ายไปกำลังทำ
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Column */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--status-progress)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🔵 กำลังทำ ({progress.length})
          </h3>
          {progress.map(a => (
            <div key={a.id} style={{ background: 'var(--bg-hover)', padding: '0.9rem', borderRadius: 10, marginBottom: '0.8rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.title}</div>
                <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                วิชา: {a.subject || 'ทั่วไป'} | ส่ง: {a.dueDate || 'ไม่ระบุ'}
              </div>
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(a.id, 'completed')}>
                  ✓ ย้ายไปเสร็จแล้ว
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Completed Column */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--status-completed)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🟢 เสร็จแล้ว ({completed.length})
          </h3>
          {completed.map(a => (
            <div key={a.id} style={{ background: 'var(--bg-hover)', padding: '0.9rem', borderRadius: 10, marginBottom: '0.8rem', border: '1px solid var(--border-color)', opacity: 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: 'line-through', color: 'var(--text-dim)' }}>{a.title}</div>
                <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                วิชา: {a.subject || 'ทั่วไป'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มการบ้าน / งานใหม่</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>หัวข้องาน</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น รายงานวิชา CS201"
                  value={newAssign.title}
                  onChange={e => setNewAssign({ ...newAssign, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>วิชา</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น Data Structures"
                  value={newAssign.subject}
                  onChange={e => setNewAssign({ ...newAssign, subject: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>กำหนดส่ง</label>
                <input
                  type="date"
                  className="form-control"
                  value={newAssign.dueDate}
                  onChange={e => setNewAssign({ ...newAssign, dueDate: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึกงาน</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
