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

import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

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
      if (!data) return defaultValue;
      const parsed = JSON.parse(data);
      if (parsed === null || parsed === undefined) return defaultValue;
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
      return parsed;
    } catch (e) {
      return defaultValue;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(`study_planner_${key}`, JSON.stringify(value));
      // Cloud Firestore Background Sync if user is logged in
      this.syncToCloud(key, value);
    } catch (e) {
      console.error('Storage setItem error:', e);
    }
  }

  async syncToCloud(key, value) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, 'users', user.uid, 'collections', key);
      await setDoc(docRef, {
        data: value,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase Cloud sync failed (offline or permissions):', err);
    }
  }

  async syncFromCloud(userId) {
    if (!userId) return false;
    try {
      const collRef = collection(db, 'users', userId, 'collections');
      const snap = await getDocs(collRef);
      if (snap.empty) {
        // First login: upload existing local items to cloud
        const keys = ['courses', 'assignments', 'exams', 'todo', 'grades', 'pomodoro_logs', 'profile', 'notif_settings', 'pomo_settings'];
        for (const k of keys) {
          const val = this.getItem(k, null);
          if (val !== null) {
            await this.syncToCloud(k, val);
          }
        }
        return true;
      }

      snap.forEach((docSnap) => {
        const key = docSnap.id;
        const val = docSnap.data().data;
        if (val !== undefined) {
          localStorage.setItem(`study_planner_${key}`, JSON.stringify(val));
        }
      });
      return true;
    } catch (err) {
      console.warn('Firebase syncFromCloud error:', err);
      return false;
    }
  }

  clearLocalUserData() {
    try {
      const keysToKeep = ['study_planner_theme'];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('study_planner_') && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Error clearing local storage:', e);
    }
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
    // Also sync document meta to cloud if logged in
    try {
      const user = auth.currentUser;
      if (user && docData.id) {
        const docRef = doc(db, 'users', user.uid, 'documents', String(docData.id));
        const meta = { ...docData };
        delete meta.dataUrl; // avoid large base64 document string in Firestore document if large
        await setDoc(docRef, { ...meta, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn('Cloud doc sync failed:', err);
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
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, 'users', user.uid, 'documents', String(id)));
      }
    } catch (err) {
      console.warn('Cloud deleteDoc failed:', err);
    }
    return true;
  }
}

export const notify = new NotificationManager();
export const dbManager = new StorageManager();

