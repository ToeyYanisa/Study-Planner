import React, { useState, useRef } from 'react';
import { Plus, Download, Calendar, MapPin, Clock, Trash2, Pencil, AlertCircle, Bookmark } from 'lucide-react';
import { exportElementToImage } from '../services/imageExport';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { dbManager, notify } from '../services/db';

const DEFAULT_EXAMS = [];

export default function ExamsView({ onUpdateBadges }) {
  const [exams, setExams] = useState(() => dbManager.getItem('exams', DEFAULT_EXAMS));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const examSheetRef = useRef(null);

  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    type: 'กลางภาค (Midterm)',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    note: ''
  });

  const saveExams = (updated) => {
    setExams(updated);
    dbManager.setItem('exams', updated);
    if (onUpdateBadges) onUpdateBadges();
  };

  // Open modal for ADD
  const handleOpenAddModal = () => {
    setEditingExam(null);
    setFormData({
      subjectCode: '',
      subjectName: '',
      type: 'กลางภาค (Midterm)',
      date: '',
      startTime: '09:00',
      endTime: '11:00',
      location: '',
      note: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for EDIT
  const handleOpenEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      subjectCode: exam.subjectCode || '',
      subjectName: exam.subjectName || '',
      type: exam.type || 'กลางภาค (Midterm)',
      date: exam.date || '',
      startTime: exam.startTime || '09:00',
      endTime: exam.endTime || '11:00',
      location: exam.location || '',
      note: exam.note || ''
    });
    setIsModalOpen(true);
  };

  // Save (Add or Update)
  const handleSaveExam = (e) => {
    e.preventDefault();
    if (!formData.subjectName) return;

    if (editingExam) {
      // Update existing
      const updated = exams.map(ex => ex.id === editingExam.id ? { ...ex, ...formData } : ex);
      saveExams(updated);
      notify.success(`แก้ไขข้อมูลวิชา "${formData.subjectName}" เรียบร้อยแล้ว`);
    } else {
      // Add new
      const updated = [...exams, { ...formData, id: 'e_' + Date.now() }];
      saveExams(updated);
      notify.success(`เพิ่มวิชาสอบ "${formData.subjectName}" เรียบร้อยแล้ว`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id, subjectName) => {
    if (window.confirm(`คุณต้องการลบวิชาสอบ "${subjectName || 'รายการนี้'}" หรือไม่?`)) {
      const updated = exams.filter(e => e.id !== id);
      saveExams(updated);
      notify.info('ลบรายการสอบเรียบร้อยแล้ว');
    }
  };

  // Download Exam Sheet Image
  const handleDownloadImage = async () => {
    if (!examSheetRef.current) return;
    setIsExporting(true);
    notify.info('กำลังสร้างรูปภาพตารางสอบ...');

    try {
      const res = await exportElementToImage(
        examSheetRef.current,
        'ตารางสอบ_StudyPlanner.png',
        'ตารางสอบ'
      );
      if (res?.dataUrl || res?.blobUrl) {
        if (res.isMobile) {
          setPreviewImage(res.blobUrl || res.dataUrl);
        }
      }
    } catch (err) {
      console.error('Failed to export image:', err);
      notify.info('เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setIsExporting(false);
    }
  };

  // Format date helper in Thai
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return 'ยังไม่ระบุวัน';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      const yearNum = date.getFullYear() + 543;
      return `${dayName}ที่ ${dayNum} ${monthName} ${yearNum}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Sort exams by date & start time
  const sortedExams = [...exams].sort((a, b) => {
    const timeA = a.date ? new Date(`${a.date}T${a.startTime || '00:00'}`).getTime() : Infinity;
    const timeB = b.date ? new Date(`${b.date}T${b.startTime || '00:00'}`).getTime() : Infinity;
    return timeA - timeB;
  });

  // Calculate upcoming exam
  const getUpcomingExam = () => {
    if (sortedExams.length === 0) return null;
    const now = new Date();
    const upcoming = sortedExams.find(e => {
      if (!e.date) return false;
      const examTime = new Date(`${e.date}T${e.startTime || '23:59'}`);
      return examTime >= now;
    });
    return upcoming || sortedExams[0];
  };

  const upcoming = getUpcomingExam();

  const getDaysDiff = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingDays = upcoming ? getDaysDiff(upcoming.date) : null;

  // Type badge styling
  const getTypeBadgeStyle = (typeStr) => {
    if (typeStr.includes('กลางภาค') || typeStr.includes('Midterm')) {
      return { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' };
    }
    if (typeStr.includes('ปลายภาค') || typeStr.includes('Final')) {
      return { bg: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
    }
    return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '4rem' }}>
      {/* Header Bar */}
      <div className="timetable-header-bar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="timetable-title">ตารางสอบประจำภาคเรียน</h2>
          <div className="timetable-subtitle">จัดเรียงลำดับการสอบตามวันที่ พร้อมระบบแก้ไขและดาวน์โหลดรูปภาพ</div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadImage}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download style={{ width: 18, height: 18 }} />
            <span>{isExporting ? 'กำลังสร้างรูปภาพ...' : 'ดาวน์โหลดรูปภาพตารางสอบ'}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleOpenAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus style={{ width: 18, height: 18 }} />
            <span>เพิ่มรายการสอบ</span>
          </button>
        </div>
      </div>

      {/* Upcoming Exam Banner */}
      {upcoming && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79, 110, 247, 0.12) 0%, rgba(124, 92, 232, 0.12) 100%)',
          border: '1px solid var(--primary-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.2rem 1.4rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div style={{
              background: 'var(--primary)',
              color: '#ffffff',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚠️ การสอบถัดไปที่ใกล้ที่สุด
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {upcoming.subjectCode ? `${upcoming.subjectCode} - ` : ''}{upcoming.subjectName} ({upcoming.type})
              </div>
              <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.4rem', fontSize: '0.84rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span>📅 {formatThaiDate(upcoming.date)}</span>
                <span>⏰ {upcoming.startTime} - {upcoming.endTime} น.</span>
                <span>📍 {upcoming.location || 'ไม่ระบุสถานที่'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {upcomingDays !== null && (
              <div style={{
                background: upcomingDays <= 3 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                color: upcomingDays <= 3 ? '#ef4444' : 'var(--primary)',
                border: `1px solid ${upcomingDays <= 3 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.9rem',
                fontWeight: 800
              }}>
                {upcomingDays < 0 ? 'สอบผ่านมาแล้ว' : upcomingDays === 0 ? '🔥 สอบวันนี้!' : `⏳ เหลืออีก ${upcomingDays} วัน`}
              </div>
            )}
            <button
              onClick={() => handleOpenEditModal(upcoming)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}
            >
              <Pencil size={14} />
              <span>แก้ไข</span>
            </button>
          </div>
        </div>
      )}

      {/* Exportable Exam Sheet Table Wrapper */}
      <div
        className="exam-sheet-wrapper"
        ref={examSheetRef}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.4rem',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Header Sheet Title */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              📋 แผ่นตารางสอบประจำภาคเรียน (Exam Schedule Sheet)
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ภาคเรียนที่ 1 / 2026</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>Study Planner App</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.8rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '45px' }}>#</th>
                <th style={{ padding: '0.8rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '200px' }}>วันและเวลาสอบ</th>
                <th style={{ padding: '0.8rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700 }}>รหัสวิชา / ชื่อวิชา</th>
                <th style={{ padding: '0.8rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '130px' }}>ประเภทการสอบ</th>
                <th style={{ padding: '0.8rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '200px' }}>สถานที่สอบ</th>
                <th className="hide-on-export" style={{ padding: '0.8rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, width: '90px', textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedExams.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    ยังไม่มีรายการสอบในระบบ กดปุ่ม <strong>"+ เพิ่มรายการสอบ"</strong> ด้านบนเพื่อกรอกตารางสอบ
                  </td>
                </tr>
              ) : (
                sortedExams.map((exam, idx) => {
                  const badgeStyle = getTypeBadgeStyle(exam.type || '');
                  return (
                    <tr key={exam.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.85rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '0.85rem 0.8rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {formatThaiDate(exam.date)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <Clock size={12} /> {exam.startTime} - {exam.endTime} น.
                        </div>
                      </td>

                      {/* Subject */}
                      <td style={{ padding: '0.85rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {exam.subjectCode && (
                            <span style={{
                              background: 'var(--bg-hover)',
                              border: '1px solid var(--border-color)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--text-main)'
                            }}>
                              {exam.subjectCode}
                            </span>
                          )}
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            {exam.subjectName}
                          </span>
                        </div>
                        {exam.note && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                            📝 {exam.note}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td style={{ padding: '0.85rem 0.8rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: badgeStyle.color,
                          background: badgeStyle.bg,
                          border: `1px solid ${badgeStyle.border}`
                        }}>
                          {exam.type}
                        </span>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '0.85rem 0.8rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={13} color="var(--primary)" />
                          <span>{exam.location || 'ไม่ระบุสถานที่'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="hide-on-export" style={{ padding: '0.85rem 0.8rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', items: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(exam)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'all 0.15s ease'
                            }}
                            title="แก้ไขวิชาสอบนี้"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, exam.subjectName)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                            title="ลบรายการนี้"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Exam Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingExam ? 'แก้ไขรายการวิชาสอบ' : 'เพิ่มรายการสอบใหม่'}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveExam} style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>รหัสวิชา</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น CS201"
                    value={formData.subjectCode}
                    onChange={e => setFormData({ ...formData, subjectCode: e.target.value })}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>ชื่อวิชา</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น Data Structures"
                    value={formData.subjectName}
                    onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>ประเภทการสอบ</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="กลางภาค (Midterm)">กลางภาค (Midterm Exam)</option>
                  <option value="ปลายภาค (Final)">ปลายภาค (Final Exam)</option>
                  <option value="สอบย่อย (Quiz)">สอบย่อย (Quiz)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>วันที่สอบ</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>เวลาเริ่มสอบ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น 09:00"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>เวลาสิ้นสุด</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น 11:00"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>สถานที่สอบ / ห้องสอบ</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น อาคาร 3 ห้อง 302, หอประชุมใหญ่"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>หมายเหตุ / สิ่งที่ต้องเตรียม</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ดินสอ 2B, เครื่องคิดเลข"
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingExam ? 'บันทึกการแก้ไข' : 'บันทึกตารางสอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal for Mobile */}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage}
        filename="ตารางสอบ_StudyPlanner.png"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
