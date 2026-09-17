import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthModal from './components/AuthModal';

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

const initialCourses = [
  { id: 'c1', code: 'MATH301', name: 'Advanced Linear Algebra', instructor: 'Prof. Lovelace', room: 'Room 302, Science Building', day: 'Wednesday', startTime: '09:00 AM', endTime: '10:30 AM', color: '#ef4444' },
  { id: 'c2', code: 'CS201', name: 'Data Structures', instructor: 'Dr. Alan Turing', room: 'Lab B, Tech Center', day: 'Monday', startTime: '08:00 AM', endTime: '09:30 AM', color: '#6366f1' },
  { id: 'c3', code: 'CHEM201', name: 'Organic Chemistry', instructor: 'Dr. Curie', room: 'Lab 4, Chemistry Bldg', day: 'Tuesday', startTime: '10:00 AM', endTime: '11:30 AM', color: '#10b981' },
  { id: 'c4', code: 'HIST101', name: 'Modern History', instructor: 'Prof. Smith', room: 'Room 101, Humanities', day: 'Friday', startTime: '01:00 PM', endTime: '02:30 PM', color: '#a855f7' }
];

const initialAssignments = [
  { id: 'a1', title: 'Ethics Essay Draft', subject: 'Philosophy', dueDate: '2026-09-02', status: 'pending', priority: 'high', note: 'ส่งฉบับร่าง 1,500 คำ' },
  { id: 'a2', title: 'CS201 Project Phase 1', subject: 'Data Structures', dueDate: '2026-09-15', status: 'progress', priority: 'urgent', note: 'ออกแบบโครงสร้าง Binary Search Tree' },
  { id: 'a3', title: 'Lab Report 3: Synthesis', subject: 'Organic Chem', dueDate: '2026-08-25', status: 'completed', priority: 'medium', note: 'ส่งเรียบร้อยแล้ว' }
];

const initialExams = [
  { id: 'e1', subject: 'MATH301 Midterm Exam', location: 'Hall B, Science Bldg', examDate: '2026-09-10T09:00', seatNumber: 'B-42', note: 'เน้นบทที่ 1-4' },
  { id: 'e2', subject: 'CS201 Final Quiz', location: 'Lab B, Tech Center', examDate: '2026-09-25T13:00', seatNumber: 'C-15', note: 'สอบปฏิบัติเขียนโค้ด' }
];

const initialTodos = [
  { id: 't1', text: 'อ่านชีทสไลด์วิชา Data Structures บทที่ 4', completed: false, priority: 'urgent' },
  { id: 't2', text: 'ทบทวนสูตรคำนวณ Linear Algebra', completed: true, priority: 'high' },
  { id: 't3', text: 'ทำการบ้าน Organic Chem หน้า 45-48', completed: false, priority: 'medium' }
];

const initialGrades = [
  { id: 'g1', courseName: 'Advanced Linear Algebra (MATH301)', credits: 3, midtermScore: 42, finalScore: 45, assignmentScore: 9 },
  { id: 'g2', courseName: 'Data Structures (CS201)', credits: 4, midtermScore: 40, finalScore: 44, assignmentScore: 10 },
  { id: 'g3', courseName: 'Organic Chemistry (CHEM201)', credits: 3, midtermScore: 35, finalScore: 38, assignmentScore: 8 }
];

const initialPomodoroLogs = [
  { duration: 25, timestamp: new Date().toISOString() },
  { duration: 25, timestamp: new Date().toISOString() }
];

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('study_planner_theme') || 'light');
  const [badgeCounts, setBadgeCounts] = useState({ assignments: 0, exams: 0, todo: 0 });

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

  // Update Data Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study_planner_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
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
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        badgeCounts={badgeCounts}
        onToggleTheme={toggleTheme}
      />

      <main className="main-content">
        <Header onOpenAuthModal={() => setIsAuthModalOpen(true)} />

        <div className="view-container">
          {currentView === 'dashboard' && <DashboardView onViewChange={setCurrentView} />}
          {currentView === 'timetable' && <TimetableView />}
          {currentView === 'assignments' && <AssignmentsView onUpdateBadges={updateBadgeCounts} />}
          {currentView === 'exams' && <ExamsView onUpdateBadges={updateBadgeCounts} />}
          {currentView === 'todo' && <TodoView onUpdateBadges={updateBadgeCounts} />}
          {currentView === 'grades' && <GradesView />}
          {currentView === 'documents' && <DocumentsView />}
          {currentView === 'pomodoro' && <PomodoroView />}
          {currentView === 'settings' && <SettingsView theme={theme} onToggleTheme={toggleTheme} />}
        </div>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
