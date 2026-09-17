import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2 } from 'lucide-react';
import { dbManager, notify } from '../services/db';

export default function DocumentsView() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const docs = await dbManager.getAllDocuments();
    setDocuments(docs);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const docData = {
      id: 'doc_' + Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      subject: 'ทั่วไป',
      createdAt: new Date().toLocaleDateString('th-TH')
    };

    await dbManager.saveDocument(docData);
    notify.success(`อัปโหลด ${file.name} เรียบร้อยแล้ว`);
    loadDocs();
  };

  const handleDelete = async (id) => {
    await dbManager.deleteDocument(id);
    notify.info('ลบเอกสารเรียบร้อยแล้ว');
    loadDocs();
  };

  return (
    <div>
      <div className="timetable-header-bar">
        <div>
          <h2 className="timetable-title">คลังเอกสาร (Document Vault)</h2>
          <div className="timetable-subtitle">อัปโหลด PDF รูปชีทเรียน สไลด์แยกตามรายวิชา</div>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud style={{ width: 18, height: 18 }} /> อัปโหลดเอกสาร
          <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {/* Sample default doc */}
        <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
          <FileText style={{ width: 48, height: 48, color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontWeight: 700 }}>สไลด์บทที่ 4 - Trees & Graphs.pdf</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>วิชา: Data Structures</div>
        </div>

        {documents.map(doc => (
          <div key={doc.id} className="card" style={{ textAlign: 'center', position: 'relative' }}>
            <button
              onClick={() => handleDelete(doc.id)}
              style={{ position: 'absolute', top: '0.8rem', right: '0.8rem', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
              title="ลบเอกสาร"
            >
              <Trash2 style={{ width: 16, height: 16 }} />
            </button>
            <FileText style={{ width: 48, height: 48, color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 700 }}>{doc.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              ขนาด: {doc.size} | เพิ่มเมื่อ: {doc.createdAt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
