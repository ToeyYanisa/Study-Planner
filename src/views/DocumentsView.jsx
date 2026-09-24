import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Eye, Download, Search, Filter, FileCode, Image as ImageIcon, Folder, ExternalLink, X, Pencil, Check, Share2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';
import { isMobileDevice } from '../services/imageExport';

export default function DocumentsView() {
  const [documents, setDocuments] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadSubject, setUploadSubject] = useState('ทั่วไป');

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState(null);

  // Rename Modal state
  const [renameTargetDoc, setRenameTargetDoc] = useState(null);
  const [newDocName, setNewDocName] = useState('');

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const docs = await dbManager.getAllDocuments();
    setDocuments(docs || []);
  };

  // Get available subjects from courses database
  const getSubjectsList = () => {
    const courses = dbManager.getItem('courses', []);
    const subjectsSet = new Set(['ทั่วไป']);
    courses.forEach(c => {
      if (c.name) subjectsSet.add(c.name);
    });
    return Array.from(subjectsSet);
  };

  const subjectsList = getSubjectsList();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      notify.info('ขนาดไฟล์ใหญ่เกิน 20MB กรุณาเลือกไฟล์ที่เล็กกว่า 20MB');
      return;
    }

    notify.info(`กำลังประมวลผลไฟล์ ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const docData = {
        id: 'doc_' + Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || getFileTypeByName(file.name),
        subject: uploadSubject || 'ทั่วไป',
        createdAt: new Date().toLocaleDateString('th-TH'),
        dataUrl: dataUrl
      };

      await dbManager.saveDocument(docData);
      notify.success(`อัปโหลด ${file.name} เรียบร้อยแล้ว`);
      loadDocs();
    };

    reader.onerror = () => {
      notify.info('เกิดข้อผิดพลาดในการอ่านไฟล์');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open Rename Modal
  const handleOpenRenameModal = (doc) => {
    setRenameTargetDoc(doc);
    setNewDocName(doc.name);
  };

  // Save Renamed File
  const handleSaveRename = async (e) => {
    e.preventDefault();
    if (!renameTargetDoc || !newDocName.trim()) return;

    const trimmedName = newDocName.trim();
    const updated = { ...renameTargetDoc, name: trimmedName };
    await dbManager.saveDocument(updated);
    notify.success(`เปลี่ยนชื่อเอกสารเป็น "${trimmedName}" เรียบร้อยแล้ว`);

    if (previewDoc && previewDoc.id === renameTargetDoc.id) {
      setPreviewDoc(updated);
    }

    setRenameTargetDoc(null);
    setNewDocName('');
    loadDocs();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`คุณต้องการลบเอกสาร "${name}" หรือไม่?`)) {
      await dbManager.deleteDocument(id);
      notify.info('ลบเอกสารเรียบร้อยแล้ว');
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(null);
      }
      loadDocs();
    }
  };

  // Download / Share Handler — รองรับโทรศัพท์ทุกรุ่น
  const handleDownload = async (doc) => {
    if (!doc.dataUrl) {
      notify.info('ไม่พบไฟล์ข้อมูลสำหรับดาวน์โหลด');
      return;
    }

    let blobUrl = null;
    let file = null;

    try {
      const res = await fetch(doc.dataUrl);
      const blob = await res.blob();
      file = new File([blob], doc.name, { type: doc.type || blob.type || 'application/octet-stream' });
      blobUrl = URL.createObjectURL(blob);
    } catch (err) {
      console.warn('Blob creation error:', err);
    }

    // 1. Web Share API (HTTPS / รองรับทั้ง iOS และ Android)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: doc.name });
        notify.success(`เปิดเมนูบันทึก ${doc.name} เรียบร้อยแล้ว`);
        return;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return;
        console.warn('Share failed, falling back:', shareErr);
      }
    }

    const mobile = isMobileDevice();

    // 2. บนมือถือ: เปิดไฟล์ในแท็บใหม่ (ผู้ใช้ long-press เพื่อบันทึก)
    if (mobile) {
      if (blobUrl) {
        window.open(blobUrl, '_blank');
      } else {
        window.open(doc.dataUrl, '_blank');
      }
      notify.info(`กดค้างที่ไฟล์แล้วเลือก "บันทึก" เพื่อดาวน์โหลดลงเครื่องได้เลยครับ`);
      return;
    }

    // 3. Desktop: ดาวน์โหลดตรงๆ
    if (blobUrl) {
      const link = document.createElement('a');
      link.download = doc.name;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify.success(`ดาวน์โหลด ${doc.name} เรียบร้อยแล้ว`);
    } else {
      window.open(doc.dataUrl, '_blank');
    }
  };

  // Open Preview Handler
  const handlePreview = (doc) => {
    if (!doc.dataUrl) {
      notify.info('ไม่พบไฟล์ข้อมูลสำหรับเปิดดู');
      return;
    }
    setPreviewDoc(doc);
  };

  const handleOpenInNewTab = async (doc) => {
    if (!doc.dataUrl) return;
    try {
      const res = await fetch(doc.dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      window.open(doc.dataUrl, '_blank');
    }
  };

  const getFileTypeByName = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image/' + ext;
    if (ext === 'pdf') return 'application/pdf';
    if (['txt', 'js', 'json', 'html', 'css', 'md'].includes(ext)) return 'text/plain';
    return 'application/octet-stream';
  };

  const getFileIcon = (type, name) => {
    const fileType = type || getFileTypeByName(name || '');
    if (fileType.includes('image')) return <ImageIcon size={38} color="#3b82f6" />;
    if (fileType.includes('pdf')) return <FileText size={38} color="#ef4444" />;
    if (fileType.includes('text') || fileType.includes('javascript') || fileType.includes('json')) return <FileCode size={38} color="#8b5cf6" />;
    return <FileText size={38} color="var(--primary)" />;
  };

  // Realtime search filtering strictly by title and subject
  const filteredDocs = documents.filter(doc => {
    const matchesSubject = selectedSubject === 'ทั้งหมด' || doc.subject === selectedSubject;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || doc.name.toLowerCase().includes(query) || (doc.subject && doc.subject.toLowerCase().includes(query));
    return matchesSubject && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '4rem' }}>
      {/* Header Bar */}
      <div className="timetable-header-bar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="timetable-title">คลังเอกสารการเรียน (Document Vault)</h2>
          <div className="timetable-subtitle">อัปโหลด ตั้งชื่อไฟล์เอง เปิดดูไฟล์ PDF รูปภาพชีทเรียน และสไลด์การสอนได้จริง</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            value={uploadSubject}
            onChange={(e) => setUploadSubject(e.target.value)}
            style={{
              padding: '0.55rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {subjectsList.map(subj => (
              <option key={subj} value={subj}>วิชา: {subj}</option>
            ))}
          </select>

          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <UploadCloud style={{ width: 18, height: 18 }} />
            <span>อัปโหลดเอกสาร</span>
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Subject Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <button
            onClick={() => setSelectedSubject('ทั้งหมด')}
            className={`btn ${selectedSubject === 'ทั้งหมด' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)' }}
          >
            ทั้งหมด ({documents.length})
          </button>
          {subjectsList.map(subj => {
            const count = documents.filter(d => d.subject === subj).length;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`btn ${selectedSubject === subj ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)' }}
              >
                {subj} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่อไฟล์ที่ตั้งไว้..."
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.2rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.84rem'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Folder size={48} color="var(--text-dim)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>ไม่พบเอกสารตามชื่อที่ค้นหา</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {searchQuery ? `ไม่พบไฟล์ที่ตรงกับคำว่า "${searchQuery}"` : 'กดปุ่ม "อัปโหลดเอกสาร" ด้านบนเพื่อเพิ่มไฟล์ PDF รูปภาพชีทเรียน หรือสไลด์การสอน'}
            </div>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div key={doc.id} className="analytics-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
              {/* Header Info */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ background: 'var(--bg-hover)', padding: '0.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getFileIcon(doc.type, doc.name)}
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {doc.subject || 'ทั่วไป'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <div
                    onClick={() => handleOpenRenameModal(doc)}
                    style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-word', lineHeight: '1.3', cursor: 'pointer' }}
                    title="คลิกเพื่อแก้ไขชื่อไฟล์"
                  >
                    {doc.name}
                  </div>
                  <button
                    onClick={() => handleOpenRenameModal(doc)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
                    title="แก้ไขชื่อไฟล์"
                  >
                    <Pencil size={15} />
                  </button>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', gap: '0.6rem' }}>
                  <span>ขนาด: {doc.size || 'ไม่ระบุ'}</span>
                  <span>•</span>
                  <span>{doc.createdAt || 'เร็วๆ นี้'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={() => handlePreview(doc)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <Eye size={14} />
                  <span>เปิดดู</span>
                </button>

                <button
                  onClick={() => handleOpenRenameModal(doc)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="แก้ไขชื่อไฟล์"
                >
                  <Pencil size={14} />
                </button>

                <button
                  onClick={() => handleDownload(doc)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="ดาวน์โหลดไฟล์"
                >
                  <Download size={14} />
                </button>

                <button
                  onClick={() => handleDelete(doc.id, doc.name)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="ลบเอกสาร"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rename File Modal */}
      {renameTargetDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '420px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ✏️ เปลี่ยนชื่อไฟล์เอกสาร
              </h3>
              <button
                onClick={() => setRenameTargetDoc(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRename}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  ชื่อไฟล์ใหม่:
                </label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="ระบุชื่อไฟล์ใหม่..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRenameTargetDoc(null)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newDocName.trim()}
                >
                  บันทึกชื่อใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2000,
          padding: '1.2rem'
        }}>
          {/* Modal Top Bar */}
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={20} color="var(--primary)" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{previewDoc.name}</div>
                  <button
                    onClick={() => handleOpenRenameModal(previewDoc)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.2rem' }}
                    title="แก้ไขชื่อไฟล์"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>วิชา: {previewDoc.subject} | ขนาด: {previewDoc.size}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {/* ปุ่ม Share/Download หลัก — รองรับโทรศัพท์ทุกรุ่น */}
              <button
                className="btn btn-primary"
                onClick={() => handleDownload(previewDoc)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
              >
                {isMobileDevice() ? <Share2 size={14} /> : <Download size={14} />}
                <span>{isMobileDevice() ? 'บันทึก / แชร์' : 'ดาวน์โหลด'}</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleOpenInNewTab(previewDoc)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
              >
                <ExternalLink size={14} />
                <span>เปิดแท็บใหม่</span>
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '0.2rem'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Preview Body */}
          <div style={{
            flex: 1,
            background: '#0f172a',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {previewDoc.type.includes('image') ? (
              <img
                src={previewDoc.dataUrl}
                alt={previewDoc.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '1rem' }}
              />
            ) : (
              <iframe
                src={previewDoc.dataUrl}
                title={previewDoc.name}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
