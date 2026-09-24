import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import LockedViewPrompt from './components/LockedViewPrompt';
import { useAuth } from './context/AuthContext';


import DashboardView from './views/DashboardView';
import TimetableView from './views/TimetableView';
import AssignmentsView from './views/AssignmentsView';
import ExamsView from './views/ExamsView';
import TodoView from './views/TodoView';
import GradesView from './views/GradesView';
import DocumentsView from './views/DocumentsView';
import PomodoroView from './views/PomodoroView';
import SettingsView from './views/SettingsView';

import { dbManager } from './services/db';

const initialCourses = [];
const initialAssignments = [];
const initialExams = [];
const initialTodos = [];
const initialGrades = [];
const initialPomodoroLogs = [];

export default function App() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('study_planner_theme') || 'light');
  const [badgeCounts, setBadgeCounts] = useState({ assignments: 0, exams: 0, todo: 0 });
  const [dataVersion, setDataVersion] = useState(0);

  // Seed Initial Data once
  useEffect(() => {
    if (!localStorage.getItem('study_planner_courses')) dbManager.setItem('courses', initialCourses);
    if (!localStorage.getItem('study_planner_assignments')) dbManager.setItem('assignments', initialAssignments);
    if (!localStorage.getItem('study_planner_exams')) dbManager.setItem('exams', initialExams);
    if (!localStorage.getItem('study_planner_todo')) dbManager.setItem('todo', initialTodos);
    if (!localStorage.getItem('study_planner_grades')) dbManager.setItem('grades', initialGrades);
    if (!localStorage.getItem('study_planner_pomodoro_logs')) dbManager.setItem('pomodoro_logs', initialPomodoroLogs);

    updateBadgeCounts();
  }, []);

  // Sync data when user logs in with Firebase or resets on logout
  useEffect(() => {
    if (currentUser?.uid) {
      dbManager.syncFromCloud(currentUser.uid).then(() => {
        updateBadgeCounts();
        setDataVersion(v => v + 1);
      });
    } else {
      // When logged out and local data cleared, ensure default templates are re-seeded
      if (!localStorage.getItem('study_planner_courses')) dbManager.setItem('courses', initialCourses);
      if (!localStorage.getItem('study_planner_assignments')) dbManager.setItem('assignments', initialAssignments);
      if (!localStorage.getItem('study_planner_exams')) dbManager.setItem('exams', initialExams);
      if (!localStorage.getItem('study_planner_todo')) dbManager.setItem('todo', initialTodos);
      if (!localStorage.getItem('study_planner_grades')) dbManager.setItem('grades', initialGrades);
      if (!localStorage.getItem('study_planner_pomodoro_logs')) dbManager.setItem('pomodoro_logs', initialPomodoroLogs);

      updateBadgeCounts();
      setDataVersion(v => v + 1);
    }
  }, [currentUser]);


  // Update Data Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study_planner_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const updateBadgeCounts = () => {
    const assignments = dbManager.getItem('assignments', []);
    const pendingAssigns = assignments.filter(a => a.status !== 'completed').length;

    const todos = dbManager.getItem('todo', []);
    const pendingTodos = todos.filter(t => !t.completed).length;

    const exams = dbManager.getItem('exams', []);

    setBadgeCounts({
      assignments: pendingAssigns,
      exams: exams.length,
      todo: pendingTodos
    });
  };

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop open"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        badgeCounts={badgeCounts}
        onToggleTheme={toggleTheme}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="main-content">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onViewChange={handleViewChange}
        />

        <div className="view-container" key={dataVersion}>
          {currentView === 'dashboard' && <DashboardView onViewChange={handleViewChange} />}
          {currentView === 'timetable' && <TimetableView />}

          {/* Locked View: Assignments */}
          {currentView === 'assignments' && (
            currentUser ? (
              <AssignmentsView onUpdateBadges={updateBadgeCounts} />
            ) : (
              <LockedViewPrompt
                featureName="การมอบหมายงาน (Assignments)"
                description="ระบบจัดการการบ้าน โครงงาน และติดตามสถานะกำหนดส่ง เพื่อให้คุณไม่พลาดทุกเดดไลน์และเข้าถึงได้จากทุกอุปกรณ์"
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onBackToDashboard={() => handleViewChange('dashboard')}
              />
            )
          )}

          {currentView === 'exams' && <ExamsView onUpdateBadges={updateBadgeCounts} />}
          {currentView === 'todo' && <TodoView onUpdateBadges={updateBadgeCounts} />}

          {/* Locked View: Grades */}
          {currentView === 'grades' && (
            currentUser ? (
              <GradesView />
            ) : (
              <LockedViewPrompt
                featureName="การวิเคราะห์และบันทึกเกรด (Grades)"
                description="ระบบคำนวณเกรดเฉลี่ย (GPA) สะสมรายวิชาและรายเทอม บันทึกประวัติผลการเรียน และวางแผนการเรียนส่วนบุคคล"
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onBackToDashboard={() => handleViewChange('dashboard')}
              />
            )
          )}

          {/* Locked View: Documents */}
          {currentView === 'documents' && (
            currentUser ? (
              <DocumentsView />
            ) : (
              <LockedViewPrompt
                featureName="คลังเอกสาร & ชีทสรุป (Documents)"
                description="คลังจัดเก็บและอัปโหลดไฟล์สรุป สไลด์เรียน และชีทวิชาต่างๆ"
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onBackToDashboard={() => handleViewChange('dashboard')}
              />
            )
          )}


          {currentView === 'pomodoro' && <PomodoroView />}
          {currentView === 'settings' && <SettingsView theme={theme} onToggleTheme={toggleTheme} />}
        </div>

      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

