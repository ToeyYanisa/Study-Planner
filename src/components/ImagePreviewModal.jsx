import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, ExternalLink } from 'lucide-react';
import { notify } from '../services/db';

export default function ImagePreviewModal({ isOpen, imageUrl, filename, onClose }) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const fileRef = useRef(null);

  // เตรียมไฟล์ล่วงหน้าเพื่อไม่ให้เสีย transient activation เมื่อผู้ใช้คลิกปุ่ม
  useEffect(() => {
    if (!imageUrl) {
      fileRef.current = null;
      setCanNativeShare(false);
      return;
    }

    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], filename || 'study_planner.png', { type: 'image/png' });
        fileRef.current = file;
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          setCanNativeShare(true);
        } else {
          setCanNativeShare(Boolean(navigator?.share));
        }
      })
      .catch(err => {
        console.warn('Error pre-loading image file:', err);
      });
  }, [imageUrl, filename]);

  if (!isOpen || !imageUrl) return null;

  // กดปุ่มบันทึกรูปภาพ / แชร์
  const handleSaveOrShare = async () => {
    // 1. ถ้าเครื่องรองรับ Web Share API (ทำงานบน HTTPS หรือเครื่องที่อนุญาต)
    if (canNativeShare && fileRef.current && navigator.canShare && navigator.canShare({ files: [fileRef.current] })) {
      try {
        await navigator.share({
          files: [fileRef.current],
          title: 'ตารางเรียน / ตารางสอบ'
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // ผู้ใช้กดยกเลิก
        console.warn('Share file failed, fallback to download:', err);
      }
    }

    // 2. ถ้าอยู่บน HTTP (Wi-Fi) หรือไม่รองรับ Share: สั่งดาวน์โหลดไฟล์ลงเครื่องทันที
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || 'timetable.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify.success('เริ่มดาวน์โหลดรูปภาพแล้ว!');
    } catch (err) {
      console.warn('Link download failed:', err);
      // หากเบราว์เซอร์บล็อก download ให้เปิดรูปในแท็บใหม่
      window.open(imageUrl, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    // เปิดรูปในแท็บใหม่แบบ synchronous ทันที ไม่โดน Popup Blocker
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 99999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 680,
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '0.8rem', paddingBottom: '0.6rem' }}>
          <h3 className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📸 รูปภาพ</span>
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="ปิดหน้าต่าง">
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0, overflowY: 'auto' }}>
          {/* Image Container */}
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.6rem',
            overflow: 'auto',
            maxHeight: '58vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img
              src={imageUrl}
              alt="Timetable Preview"
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: '100%',
                display: 'block',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                WebkitTouchCallout: 'default',
                userSelect: 'auto',
                pointerEvents: 'auto'
              }}
            />
          </div>

          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '0.5rem'
          }}>
            💡 บนมือถือ: สามารถแตะค้างที่รูปภาพเพื่อเลือก <em>"บันทึกภาพ"</em> ลงอัลบั้มได้เลย
          </div>

          {/* Action Buttons: บันทึกรูปภาพ และ เปิดดูรูปเต็มจอ */}
          <div style={{
            display: 'flex',
            gap: '0.6rem',
            marginTop: '0.9rem',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveOrShare}
              style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem', padding: '0.7rem 1rem' }}
            >
              {canNativeShare ? <Share2 style={{ width: 18, height: 18 }} /> : <Download style={{ width: 18, height: 18 }} />}
              <span>{canNativeShare ? 'บันทึก / แชร์' : 'ดาวน์โหลดรูปภาพ'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleOpenNewTab}
              style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem', padding: '0.7rem 1rem' }}
            >
              <ExternalLink style={{ width: 18, height: 18 }} />
              <span>เปิดดูรูปเต็มจอ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
