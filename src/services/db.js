/* ==========================================================================
   Study Planner - Shared Storage Engine & Toast Notification System for React
   ========================================================================== */

class NotificationManager {
  constructor() {
    this.container = null;
  }

  createToastContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(el);
    }
    this.container = el;
  }

  showToast(title, message, type = 'info') {
    this.createToastContainer();
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    toast.style.cssText = `
      background: ${isSuccess ? '#065f46' : '#091b36'};
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      font-size: 0.88rem;
      font-family: 'Kanit', sans-serif;
      pointer-events: auto;
      animation: fadeIn 0.25s ease-in-out;
      border: 1px solid ${isSuccess ? '#10b981' : '#1e3a8a'};
    `;
    toast.innerHTML = `<strong>${title}</strong><div style="font-size:0.82rem; opacity:0.9; margin-top:2px;">${message}</div>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  info(msg) { this.showToast('แจ้งเตือน', msg, 'info'); }
  success(msg) { this.showToast('สำเร็จ', msg, 'success'); }
}

const DB_NAME = 'StudyPlannerDB';
const DB_VERSION = 1;
const DOC_STORE = 'documents';

class StorageManager {
  constructor() {
    this.db = null;
    this.initIndexedDB();
  }

  initIndexedDB() {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DOC_STORE)) {
          db.createObjectStore(DOC_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = () => resolve(null);
    });
  }

  getItem(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(`study_planner_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(`study_planner_${key}`, JSON.stringify(value));
    } catch (e) {}
  }

  async saveDocument(docData) {
    if (!this.db) await this.initIndexedDB();
    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(DOC_STORE, 'readwrite');
        const store = tx.objectStore(DOC_STORE);
        const req = store.put(docData);
        req.onsuccess = () => resolve(docData);
        req.onerror = (e) => reject(e);
      });
    }
    return docData;
  }

  async getAllDocuments() {
    if (!this.db) await this.initIndexedDB();
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(DOC_STORE, 'readonly');
      const store = tx.objectStore(DOC_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e);
    });
  }

  async deleteDocument(id) {
    if (!this.db) await this.initIndexedDB();
    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(DOC_STORE, 'readwrite');
        const store = tx.objectStore(DOC_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
    }
    return true;
  }
}

export const notify = new NotificationManager();
export const dbManager = new StorageManager();
