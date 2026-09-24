import { toPng } from 'html-to-image';
import { notify } from './db';

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (Boolean(navigator.maxTouchPoints) && navigator.maxTouchPoints > 2);
}

/**
 * แคปภาพ element โดยชั่วคราว override ขนาดในที่เดิม (ไม่ clone)
 * เพื่อป้องกัน Safari ไม่เรนเดอร์ SVG / CSS variables ใน off-screen node
 */
export async function exportElementToImage(element, filename = 'study_planner.png', title = 'รูปภาพ') {
  if (!element) return null;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#0f172a' : '#ffffff';

  // 1. ซ่อนคอลัมน์ที่ไม่ต้องการในรูป (ปุ่มแก้ไข/ลบ) ชั่วคราว
  const hiddenEls = [];
  element.querySelectorAll('.hide-on-export').forEach(el => {
    hiddenEls.push({ el, display: el.style.display });
    el.style.display = 'none';
  });

  // 2. บันทึก style เดิมของ element หลักและ container ตาราง
  const savedStyles = [];
  const saveStyle = (el, props) => {
    const prev = {};
    props.forEach(p => { prev[p] = el.style[p]; });
    savedStyles.push({ el, prev });
  };

  // 2a. ขยาย element หลัก
  saveStyle(element, ['width', 'minWidth', 'maxWidth', 'overflow', 'overflowX', 'position']);
  element.style.width = '1050px';
  element.style.minWidth = '1050px';
  element.style.maxWidth = 'none';
  element.style.overflow = 'visible';
  element.style.overflowX = 'visible';

  // 2b. ขยาย container ตาราง (div > table wrapper)
  const tableWrappers = element.querySelectorAll('div');
  tableWrappers.forEach(div => {
    saveStyle(div, ['overflow', 'overflowX', 'width', 'maxWidth']);
    div.style.overflow = 'visible';
    div.style.overflowX = 'visible';
    div.style.maxWidth = 'none';
  });

  // 2c. ขยายตาราง
  const tables = element.querySelectorAll('table');
  tables.forEach(table => {
    saveStyle(table, ['width', 'minWidth', 'maxWidth', 'tableLayout']);
    table.style.width = '100%';
    table.style.minWidth = '1000px';
    table.style.maxWidth = 'none';
    table.style.tableLayout = 'auto';
  });

  // 2d. รีเซ็ต scroll ทั้งหมด ชั่วคราว
  const scrollEls = [];
  [element, ...element.querySelectorAll('*')].forEach(el => {
    if (el.scrollLeft > 0) {
      scrollEls.push({ el, left: el.scrollLeft });
      el.scrollLeft = 0;
    }
  });

  // 3. รอ 1 frame ให้ browser reflow
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const fullWidth = Math.max(element.scrollWidth || 0, element.offsetWidth || 0, 1050);
  const fullHeight = Math.max(element.scrollHeight || 0, element.offsetHeight || 0) + 20;

  const options = {
    cacheBust: true,
    backgroundColor: bg,
    width: fullWidth,
    height: fullHeight,
    pixelRatio: 1.5,
    style: {
      width: `${fullWidth}px`,
      minWidth: `${fullWidth}px`,
      height: `${fullHeight}px`,
      overflow: 'visible',
      maxWidth: 'none',
      margin: '0',
    }
  };

  let dataUrl;
  try {
    // warmup ครั้งแรกเพื่อให้ Safari โหลด font/SVG
    try { await toPng(element, { ...options, pixelRatio: 1 }); } catch (_) {}
    await new Promise(r => setTimeout(r, 100));
    dataUrl = await toPng(element, options);
  } catch (err) {
    console.warn('toPng failed, retrying skipFonts:', err);
    try {
      dataUrl = await toPng(element, { ...options, skipFonts: true, fontEmbedCSS: '' });
    } catch (e2) {
      console.error('Export failed entirely:', e2);
    }
  } finally {
    // 4. คืนค่า style ทุกอย่างกลับสู่สภาพเดิม
    savedStyles.forEach(({ el, prev }) => {
      Object.entries(prev).forEach(([p, v]) => { el.style[p] = v; });
    });
    hiddenEls.forEach(({ el, display }) => { el.style.display = display; });
    scrollEls.forEach(({ el, left }) => { try { el.scrollLeft = left; } catch (_) {} });
  }

  if (!dataUrl) return null;

  // 5. สร้าง blob URL
  let blobUrl = null;
  let file = null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    blobUrl = URL.createObjectURL(blob);
    file = new File([blob], filename, { type: 'image/png' });
  } catch (e) {
    console.warn('blob error:', e);
  }

  const mobile = isMobileDevice();

  if (mobile) {
    // ลองแชร์ผ่าน Web Share API (HTTPS เท่านั้น)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        notify.success('เปิดเมนูบันทึกลงเครื่องเรียบร้อยแล้ว');
      } catch (shareErr) {
        if (shareErr.name !== 'AbortError') console.warn('share error:', shareErr);
      }
    }
    return { dataUrl, blobUrl, isMobile: true };
  }

  // Desktop
  const link = document.createElement('a');
  link.download = filename;
  link.href = blobUrl || dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  notify.success(`บันทึก ${title} เรียบร้อยแล้ว!`);

  return { dataUrl, blobUrl, isMobile: false };
}
