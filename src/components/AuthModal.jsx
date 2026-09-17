import React from 'react';
import { LogIn, LogOut } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" id="modal-firebase-auth" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            🔥 Firebase Account
          </h3>
          <button className="modal-close" id="btn-close-auth-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ padding: '1.2rem' }}>
          <div id="auth-signed-out-view">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              เข้าสู่ระบบด้วย Firebase เพื่อซิงค์ตารางเรียน การบ้าน และเกรดข้ามอุปกรณ์แบบ Realtime
            </p>

            <button
              className="btn btn-primary"
              id="btn-auth-google"
              style={{ width: '100%', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem' }}
            >
              <LogIn style={{ width: 18, height: 18 }} /> เข้าสู่ระบบด้วย Google Account
            </button>

            <div style={{ textAlign: 'center', margin: '1rem 0', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              หรือใช้อีเมล/รหัสผ่าน
            </div>

            <form
              id="form-email-auth"
              onSubmit={(e) => e.preventDefault()}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>อีเมล</label>
                <input
                  type="email"
                  id="auth-email-input"
                  className="form-control"
                  placeholder="student@example.com"
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
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  id="btn-auth-register"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  สมัครสมาชิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
