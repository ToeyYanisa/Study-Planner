import React from 'react';
import { Lock, Cloud, ShieldCheck, Smartphone, Sparkles, ArrowRight } from 'lucide-react';

export default function LockedViewPrompt({ featureName, description, onOpenAuthModal, onBackToDashboard }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      padding: '1.5rem',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Top Accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, var(--primary), #8b5cf6, #ec4899)'
        }} />

        {/* Lock Icon Box with Glow */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(79, 110, 247, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid rgba(79, 110, 247, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'var(--primary)'
        }}>
          <Lock style={{ width: 34, height: 34 }} />
        </div>

        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.8rem',
          borderRadius: '20px',
          background: 'rgba(79, 110, 247, 0.08)',
          color: 'var(--primary)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '0.8rem'
        }}>
          <Sparkles style={{ width: 14, height: 14 }} /> ต้องเข้าสู่ระบบเพื่อใช้งาน
        </span>

        <h2 style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '0 0 0.6rem',
          letterSpacing: '-0.02em'
        }}>
          ปลดล็อก {featureName}
        </h2>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          margin: '0 0 1.8rem'
        }}>
          {description || 'เข้าสู่ระบบเพื่อบันทึกข้อมูลของคุณและเข้าถึงได้จากทุกอุปกรณ์'}
        </p>

        {/* Feature Benefits List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.7rem',
          textAlign: 'left',
          background: 'var(--bg-main)',
          borderRadius: '12px',
          padding: '1rem 1.2rem',
          marginBottom: '1.8rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            <Cloud style={{ width: 16, height: 16, color: 'var(--primary)', flexShrink: 0 }} />
            <span>ซิงค์ข้อมูลอัตโนมัติ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            <ShieldCheck style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
            <span>ข้อมูลส่วนตัวปลอดภัย เฉพาะบัญชีของคุณเท่านั้น</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            <Smartphone style={{ width: 16, height: 16, color: '#8b5cf6', flexShrink: 0 }} />
            <span>เปิดดูและแก้ไขได้จากทุกเครื่องทุกอุปกรณ์</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAuthModal}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem 1.2rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              gap: '0.5rem'
            }}
          >
            เข้าสู่ระบบ / สมัครสมาชิก <ArrowRight style={{ width: 16, height: 16 }} />
          </button>


          {onBackToDashboard && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToDashboard}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.65rem 1.2rem',
                fontSize: '0.85rem'
              }}
            >
              กลับสู่หน้าหลัก (Dashboard)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
