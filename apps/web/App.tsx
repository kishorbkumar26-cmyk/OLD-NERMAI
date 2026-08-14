import React from 'react';
import './global.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StudentDashboard } from './student/Student_Dashboard/StudentDashboard';
import { StudentProfile } from './student/Student_Dashboard/StudentProfile';
import { StudentLayout } from './student/Layout/StudentLayout';
import { AdminDashboard } from './admin/Dashboard/AdminDashboard';
import { AdminLayout } from './admin/Layout/AdminLayout';
import { CoursesPage } from './admin/LMS/Courses/CoursesPage';
import { SubjectsPage } from './admin/LMS/Subjects/SubjectsPage';
import { TopicsPage } from './admin/LMS/Topics/TopicsPage';
import { ClassesPage } from './admin/LMS/Classes/ClassesPage';
import { ResourcesPage } from './admin/LMS/Resources/ResourcesPage';
import { StudentsPage } from './admin/ERP/Students/StudentsPage';
import { StaffPage } from './admin/ERP/Staff/StaffPage';
import { BatchesPage } from './admin/ERP/Batches/BatchesPage';
import { AttendancePage } from './admin/ERP/Attendance/AttendancePage';
import { AssistantDashboard } from './admin/LMS/Assistant/AssistantDashboard';
import { VideosPage } from './admin/LMS/Videos/VideosPage';
import { SettingsPage } from './admin/Settings/SettingsPage';
import { LiveSessionsPage } from './admin/streaming/LiveSessions/LiveSessionsPage';
import { AccessControlPage } from './admin/AccessRules/AccessControlPage';

import { AuthProvider } from './core/auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { StaffLayout } from './staff/Layout/StaffLayout';
import { StaffDashboard } from './staff/Dashboard/StaffDashboard';

import { StaffLiveClassRedirect } from './staff/LiveClass/StaffLiveClassRedirect';
import { StaffCoursesPage } from './staff/Courses/StaffCoursesPage';
import { StaffClassesPage } from './staff/LiveClass/StaffClassesPage';

import { LiveSessionFeature } from './features/live/LiveSessionFeature';
import { StudentCoursesPage } from './student/Courses/StudentCoursesPage';
import { StudentLiveClassesPage } from './student/Live/StudentLiveClassesPage';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, idbPersister } from './core/queryClient';
import { ToastProvider } from './components/ui/Toast/ToastContext';

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: 24 * 60 * 60 * 1000 }}
    >
      <ToastProvider>
        <div className="flex-1 bg-[#121212] min-h-screen">
          <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/student" replace />} />
            
            <Route path="/admin/login" element={<LoginPage type="admin" />} />
            <Route path="/staff/login" element={<LoginPage type="staff" />} />
            <Route path="/student/login" element={<LoginPage type="student" />} />
            <Route path="/student/register" element={<RegisterPage />} />
            
            <Route path="/admin/live-session/:sessionId" element={<LiveSessionFeature role="admin" capabilities={{ canStartMeeting: true, canEndMeeting: true, canMuteAll: true, canManageParticipants: true, canShareScreen: true, canRecord: true, canChat: true, canStartAttendance: true, canEndAttendance: true, canForceEndSession: true }} />} />
            <Route path="/student/live-session/:sessionId" element={<LiveSessionFeature role="student" capabilities={{ canStartMeeting: false, canEndMeeting: false, canMuteAll: false, canManageParticipants: false, canShareScreen: false, canRecord: false, canChat: true, canStartAttendance: false, canEndAttendance: false, canForceEndSession: false }} />} />

            {/* Student UI Layout */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCoursesPage />} />
              <Route path="live" element={<StudentLiveClassesPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="profile" element={<StudentProfile />} />
              {/* Note: In a real app, PlayerAccess or ResourceViewer could be full-screen routes outside this layout, or inside it. */}
            </Route>
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="topics" element={<TopicsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="live" element={<LiveSessionsPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="assistant" element={<AssistantDashboard />} />

            <Route path="access" element={<AccessControlPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* Staff Portal Layout */}
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboard />} />
            <Route path="live/class/:classId" element={<StaffLiveClassRedirect />} />
            <Route path="live/:sessionId" element={<LiveSessionFeature role="teacher" capabilities={{ canStartMeeting: true, canEndMeeting: true, canMuteAll: true, canManageParticipants: true, canShareScreen: true, canRecord: true, canChat: true, canStartAttendance: true, canEndAttendance: true, canForceEndSession: false }} />} />
            <Route path="classes" element={<StaffClassesPage />} />
            <Route path="courses" element={<StaffCoursesPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="students" element={<StudentsPage />} />

          </Route>

        </Routes>
      </Router>
      </AuthProvider>
      </div>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}
