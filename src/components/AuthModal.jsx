import React, { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { currentUser, login, signup, loginWithGoogle, logout } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานไปแล้ว');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" id="modal-firebase-auth" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {currentUser ? '👤 โปรไฟล์บัญชี' : '🔥 Firebase Account'}
          </h3>
          <button className="modal-close" id="btn-close-auth-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ padding: '1.2rem' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {currentUser ? (
            <div id="auth-signed-in-view" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                overflow: 'hidden'
              }}>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <User />
                )}
              </div>
              <h4 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem' }}>
                {currentUser.displayName || 'ผู้ใช้งาน'}
              </h4>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {currentUser.email}
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogout}
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', color: '#ef4444' }}
              >
                <LogOut style={{ width: 18, height: 18 }} /> ออกจากระบบและล้างแคชเครื่อง
              </button>
            </div>
          ) : (
            <div id="auth-signed-out-view">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                เข้าสู่ระบบด้วย Firebase เพื่อบันทึกและซิงค์ข้อมูลบน Cloud แบบ Realtime
              </p>

              <button
                type="button"
                className="btn btn-primary"
                id="btn-auth-google"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem' }}
              >
                <LogIn style={{ width: 18, height: 18 }} /> เข้าสู่ระบบด้วย Google Account
              </button>

              <div style={{ textAlign: 'center', margin: '1rem 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                หรือใช้อีเมล / รหัสผ่าน
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {isRegisterMode && (
                  <div>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>ชื่อแสดงผล</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น สมชาย ใจดี"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>อีเมล</label>
                  <input
                    type="email"
                    id="auth-email-input"
                    className="form-control"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>รหัสผ่าน</label>
                  <input
                    type="password"
                    id="auth-password-input"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {loading ? 'กำลังดำเนินการ...' : isRegisterMode ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
                  </button>
                </div>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                {isRegisterMode ? (
                  <span>
                    มีบัญชีอยู่แล้ว?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegisterMode(false); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      เข้าสู่ระบบ
                    </button>
                  </span>
                ) : (
                  <span>
                    ยังไม่มีบัญชี?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsRegisterMode(true); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      สมัครสมาชิกใหม่
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
