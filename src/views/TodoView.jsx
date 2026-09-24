import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Search, CheckCircle2, Circle } from 'lucide-react';
import { dbManager, notify } from '../services/db';

export default function TodoView({ onUpdateBadges }) {
  const [todos, setTodos] = useState(() => {
    const data = dbManager.getItem('todo', []);
    return Array.isArray(data) ? data : [];
  });
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const saveTodos = (updated) => {
    const safeUpdated = Array.isArray(updated) ? updated : [];
    setTodos(safeUpdated);
    dbManager.setItem('todo', safeUpdated);
    if (onUpdateBadges) onUpdateBadges();
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) {
      notify.info('กรุณากรอกข้อความสิ่งที่ต้องทำ');
      return;
    }
    const safeTodos = Array.isArray(todos) ? todos : [];
    const newItem = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      text: trimmed,
      completed: false,
      priority: newPriority || 'medium',
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...safeTodos];
    saveTodos(updated);
    setNewText('');
    notify.success('เพิ่มรายการที่ต้องทำเรียบร้อยแล้ว');
  };

  const handleToggle = (id) => {
    const safeTodos = Array.isArray(todos) ? todos : [];
    const updated = safeTodos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const handleDelete = (id) => {
    const safeTodos = Array.isArray(todos) ? todos : [];
    const updated = safeTodos.filter(t => t.id !== id);
    saveTodos(updated);
    notify.info('ลบรายการเรียบร้อยแล้ว');
  };

  const handleClearCompleted = () => {
    const safeTodos = Array.isArray(todos) ? todos : [];
    const updated = safeTodos.filter(t => !t.completed);
    saveTodos(updated);
    notify.info('ล้างรายการที่เสร็จแล้วเรียบร้อย');
  };

  const safeTodos = Array.isArray(todos) ? todos : [];
  const completedCount = safeTodos.filter(t => t.completed).length;
  const totalCount = safeTodos.length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodos = safeTodos.filter(t => {
    if (filterStatus === 'active' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (searchQuery.trim()) {
      return t.text.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>🔴 ด่วนมาก</span>;
      case 'high':
        return <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>🟠 สำคัญ</span>;
      case 'low':
        return <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>🟢 ทั่วไป</span>;
      case 'medium':
      default:
        return <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>🔵 ปานกลาง</span>;
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div className="timetable-header-bar" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="timetable-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare style={{ color: 'var(--primary)' }} /> รายการที่ต้องทำ (To-Do List)
          </h2>
          <div className="timetable-subtitle">วางแผนสิ่งที่คุณต้องทำ จดบันทึกสั้นๆ และติดตามความก้าวหน้าการเรียน</div>
        </div>
        {completedCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleClearCompleted}>
            <Trash2 style={{ width: 14, height: 14 }} /> ล้างที่เสร็จแล้ว ({completedCount})
          </button>
        )}
      </div>

      {/* Progress & Quick Stats Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
              ความก้าวหน้าทั้งหมด
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ทำเสร็จแล้ว {completedCount} จากทั้งหมด {totalCount} รายการ ({pendingCount} รายการที่ยังค้าง)
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
            {progressPercent}%
          </div>
        </div>
        <div className="progress-bar-bg" style={{ height: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Add New To-Do Form */}
      <form onSubmit={handleAdd} className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus style={{ width: 16, height: 16, color: 'var(--primary)' }} /> เพิ่มสิ่งที่ต้องทำใหม่
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="พิมพ์รายการสิ่งที่ต้องทำ... (เช่น อ่านหนังสือบทที่ 3, ทบทวนชีท)"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select
            className="form-control"
            value={newPriority}
            onChange={e => setNewPriority(e.target.value)}
            style={{ width: 130 }}
          >
            <option value="urgent">🔴 ด่วนมาก</option>
            <option value="high">🟠 สำคัญ</option>
            <option value="medium">🔵 ปานกลาง</option>
            <option value="low">🟢 ทั่วไป</option>
          </select>
          <button type="submit" className="btn btn-primary">
            <Plus style={{ width: 18, height: 18 }} /> เพิ่มรายการ
          </button>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('all')}
          >
            ทั้งหมด ({totalCount})
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('active')}
          >
            ยังไม่เสร็จ ({pendingCount})
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('completed')}
          >
            เสร็จแล้ว ({completedCount})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="ค้นหารายการ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2rem', fontSize: '0.82rem', height: 34 }}
          />
        </div>
      </div>

      {/* List Container */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filteredTodos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                {searchQuery ? 'ไม่พบรายการที่ตรงกับการค้นหา' : filterStatus === 'completed' ? 'ยังไม่มีรายการที่เสร็จแล้ว' : 'ไม่มีสิ่งที่ต้องทำในขณะนี้'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                {searchQuery ? 'ลองพิมพ์คำค้นหาอื่น' : 'พิมพ์สิ่งที่ต้องทำด้านบนแล้วกดปุ่มเพิ่มเพื่อเริ่มสร้างรายการของคุณ!'}
              </div>
            </div>
          ) : (
            filteredTodos.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  background: t.completed ? 'var(--bg-card)' : 'var(--bg-hover)',
                  opacity: t.completed ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                <button
                  onClick={() => handleToggle(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: t.completed ? '#10b981' : 'var(--text-dim)'
                  }}
                >
                  {t.completed ? (
                    <CheckCircle2 style={{ width: 22, height: 22, color: '#10b981' }} />
                  ) : (
                    <Circle style={{ width: 22, height: 22 }} />
                  )}
                </button>

                <span
                  style={{
                    flex: 1,
                    fontSize: '0.92rem',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    color: t.completed ? 'var(--text-dim)' : 'var(--text-main)',
                    fontWeight: t.completed ? 400 : 500
                  }}
                >
                  {t.text}
                </span>

                {getPriorityBadge(t.priority)}

                <button
                  onClick={() => handleDelete(t.id)}
                  title="ลบรายการ"
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

