import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';

export default function TodoView({ onUpdateBadges }) {
  const [todos, setTodos] = useState(() => dbManager.getItem('todo', []));
  const [newText, setNewText] = useState('');

  const saveTodos = (updated) => {
    setTodos(updated);
    dbManager.setItem('todo', updated);
    if (onUpdateBadges) onUpdateBadges();
  };

  const handleToggle = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const updated = [...todos, { id: 't_' + Date.now(), text: newText.trim(), completed: false, priority: 'medium' }];
    saveTodos(updated);
    setNewText('');
    notify.success('เพิ่มรายการที่ต้องทำแล้ว');
  };

  const handleDelete = (id) => {
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
    notify.info('ลบรายการเรียบร้อยแล้ว');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 className="timetable-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        รายการที่ต้องทำ (To-Do List)
      </h2>

      {/* Input Form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-control"
          placeholder="เพิ่มสิ่งที่ต้องทำ..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">
          <Plus style={{ width: 18, height: 18 }} /> เพิ่ม
        </button>
      </form>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              ไม่มีสิ่งที่ต้องทำในขณะนี้ 🎉
            </div>
          ) : (
            todos.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.8rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-hover)'
                }}
              >
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => handleToggle(t.id)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.92rem',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    color: t.completed ? 'var(--text-dim)' : 'var(--text-main)'
                  }}
                >
                  {t.text}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
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
