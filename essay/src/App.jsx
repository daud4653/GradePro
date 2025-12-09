import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import LoginScreen from './components/auth/LoginScreen';
import RegisterScreen from './components/auth/RegisterScreen';
import ForgotPasswordScreen from './components/auth/ForgotPasswordScreen';
import ResetPasswordQuestionScreen from './components/auth/ResetPasswordQuestionScreen';

// Layout
import MainLayout from './components/layout/MainLayout';

// Screens
import DashboardScreen from './components/screens/DashboardScreen';
import AssignmentsScreen from './components/screens/AssignmentsScreen';
import StudentsScreen from './components/screens/StudentsScreen';
import AnalyticsScreen from './components/screens/AnalyticsScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import NewAssignmentScreen from './components/screens/NewAssignmentScreen';
import GradeAssignmentScreen from './components/screens/GradeAssignmentScreen';
import SubmitAssignmentScreen from './components/screens/SubmitAssignmentScreen';
import MySubmissionsScreen from './components/screens/MySubmissionsScreen';
import { api } from './services/api';

const TOKEN_KEY = 'essay_auth_token';
const REMEMBER_ME_KEY = 'essay_remember_me';
const REMEMBERED_EMAIL_KEY = 'essay_remembered_email';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [loginForm, setLoginForm] = useState(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    return { 
      email: rememberedEmail || '', 
      password: '' 
    };
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || 'student');
  const [userSection, setUserSection] = useState(() => localStorage.getItem('user_section') || '');
  const [students, setStudents] = useState([]);
  const [essays, setEssays] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataError, setDataError] = useState('');

  const isAuthenticated = Boolean(authToken);
  const isAdmin = userRole === 'admin' || userRole === 'teacher';

  const fetchDashboardData = useCallback(
    async (tokenOverride, sectionFilter) => {
      const token = tokenOverride || authToken;
      if (!token) return;
      setIsSyncing(true);
      try {
        const [studentsResponse, essaysResponse, assignmentsResponse] = await Promise.all([
          api.fetchStudents(token, sectionFilter),
          api.fetchEssays(token),
          api.fetchAssignments(token),
        ]);
        setStudents(studentsResponse);
        setEssays(essaysResponse);
        setAssignments(assignmentsResponse);
        setDataError('');
      } catch (err) {
        const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Unable to sync data';
        setDataError(errorMessage);
      } finally {
        setIsSyncing(false);
      }
    },
    [authToken]
  );

  useEffect(() => {
    if (authToken) {
      fetchDashboardData(authToken);
    } else {
      setStudents([]);
      setEssays([]);
      setAssignments([]);
    }
  }, [authToken, fetchDashboardData]);

  const handleLogin = async (credentials, rememberMeValue) => {
    const response = await api.login(credentials);
    const { token, user } = response;
    localStorage.setItem(TOKEN_KEY, token);
    
    // Handle remember me
    if (rememberMeValue) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
      localStorage.setItem(REMEMBERED_EMAIL_KEY, credentials.email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
    
    if (user) {
      localStorage.setItem('user_role', user.role || 'student');
      localStorage.setItem('user_section', user.section || '');
      setUserRole(user.role || 'student');
      setUserSection(user.section || '');
    }
    setAuthToken(token);
    await fetchDashboardData(token);
    return true;
  };

  const handleRegister = async (form) => {
    await api.register(form);
    return true;
  };


  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_section');
    // Don't remove remember me data on logout
    setAuthToken(null);
    setUserRole('student');
    setUserSection('');
    setStudents([]);
    setEssays([]);
    setAssignments([]);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const dashboardStats = useMemo(() => buildDashboardStats(students, assignments, essays), [students, assignments, essays]);
  const recentGrades = useMemo(() => buildRecentGrades(essays), [essays]);
  const studentProfiles = useMemo(() => buildStudentProfiles(students, essays, assignments), [students, essays, assignments]);
  const assignmentCards = useMemo(() => buildAssignmentsData(assignments, essays), [assignments, essays]);

  const handleEssaySaved = () => {
    fetchDashboardData();
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <LoginScreen
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                loginForm={loginForm}
                setLoginForm={setLoginForm}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                handleLogin={handleLogin}
              />
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <RegisterScreen
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                handleRegister={handleRegister}
              />
            )
          }
        />

        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <ForgotPasswordScreen
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            )
          }
        />

        <Route
          path="/reset-password-question"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <ResetPasswordQuestionScreen
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            )
          }
        />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <MainLayout 
                darkMode={darkMode} 
                toggleDarkMode={toggleDarkMode} 
                handleLogout={handleLogout}
                userRole={userRole}
                isAdmin={isAdmin}
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <DashboardScreen
                        darkMode={darkMode}
                        stats={dashboardStats}
                        recentGrades={recentGrades}
                        syncing={isSyncing}
                        error={dataError}
                        userRole={userRole}
                        userSection={userSection}
                      />
                    }
                  />
                  <Route
                    path="/assignments"
                    element={
                      <AssignmentsScreen
                        darkMode={darkMode}
                        assignments={assignmentCards}
                        syncing={isSyncing}
                        authToken={authToken}
                        userRole={userRole}
                        isAdmin={isAdmin}
                        userSection={userSection}
                        onRefresh={() => fetchDashboardData()}
                      />
                    }
                  />
                  {isAdmin && (
                    <>
                      <Route
                        path="/assignments/new"
                        element={
                          <NewAssignmentScreen
                            darkMode={darkMode}
                            authToken={authToken}
                            onCreated={() => fetchDashboardData()}
                          />
                        }
                      />
                      <Route
                        path="/assignments/:id/grade"
                        element={
                          <GradeAssignmentScreen
                            darkMode={darkMode}
                            authToken={authToken}
                            onSaved={handleEssaySaved}
                          />
                        }
                      />
                    </>
                  )}
                  {!isAdmin && (
                    <>
                      <Route
                        path="/assignments/:id/submit"
                        element={
                          <SubmitAssignmentScreen
                            darkMode={darkMode}
                            authToken={authToken}
                          />
                        }
                      />
                      <Route
                        path="/my-submissions"
                        element={
                          <MySubmissionsScreen
                            darkMode={darkMode}
                            authToken={authToken}
                          />
                        }
                      />
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Route
                        path="/students"
                        element={
                          <StudentsScreen 
                            darkMode={darkMode} 
                            students={studentProfiles} 
                            syncing={isSyncing}
                            authToken={authToken}
                            onRefresh={(section) => fetchDashboardData(authToken, section)}
                          />
                        }
                      />
                      <Route path="/analytics" element={<AnalyticsScreen darkMode={darkMode} essays={essays} syncing={isSyncing} />} />
                    </>
                  )}
                  <Route 
                    path="/settings" 
                    element={
                      <SettingsScreen 
                        darkMode={darkMode} 
                        toggleDarkMode={toggleDarkMode}
                        authToken={authToken}
                        userRole={userRole}
                        userSection={userSection}
                        onSectionUpdate={(newSection) => {
                          setUserSection(newSection);
                          fetchDashboardData(); // Refresh data after section update
                        }}
                      />
                    } 
                  />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

function buildDashboardStats(students = [], assignments = [], essays = []) {
  const graded = essays.filter((essay) => typeof essay.grade === 'number');
  const avgScore =
    graded.length > 0
      ? `${(graded.reduce((sum, essay) => sum + (essay.grade || 0), 0) / graded.length).toFixed(1)}%`
      : '—';

  return {
    totalAssignments: assignments.length,
    totalStudents: students.length,
    avgScore,
    pending: essays.length - graded.length,
  };
}

function buildRecentGrades(essays = []) {
  return essays
    .filter((essay) => typeof essay.grade === 'number')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((essay) => ({
      id: essay._id,
      student: essay.studentName,
      assignment: essay.title,
      grade: Math.round(essay.grade ?? 0),
      date: new Date(essay.createdAt).toLocaleString(),
    }));
}

function buildStudentProfiles(students = [], essays = [], assignments = []) {
  // Create a map of assignment IDs to total marks for quick lookup
  const assignmentMap = new Map();
  assignments.forEach(assignment => {
    assignmentMap.set(assignment._id, assignment.totalMarks || 100);
  });

  return students.map((student) => {
    const studentEssays = essays.filter((essay) => essay.studentRoll === student.roll);
    const sortedEssays = [...studentEssays].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const graded = sortedEssays.filter((essay) => typeof essay.grade === 'number');
    
    // Calculate average grade as percentage
    let avgGrade = 0;
    if (graded.length > 0) {
      const percentages = graded.map((essay) => {
        // Get total marks for this essay's assignment
        let totalMarks = 100; // Default fallback
        
        // First, check if essay.assignment is an object with totalMarks directly
        if (essay.assignment && typeof essay.assignment === 'object' && essay.assignment.totalMarks) {
          totalMarks = essay.assignment.totalMarks;
        } 
        // Otherwise, look up by assignment ID
        else if (essay.assignment && essay.assignment._id) {
          totalMarks = assignmentMap.get(essay.assignment._id) || 100;
        } else if (essay.assignmentId) {
          totalMarks = assignmentMap.get(essay.assignmentId) || 100;
        }
        
        // Convert grade to percentage
        const grade = essay.grade || 0;
        return totalMarks > 0 ? (grade / totalMarks) * 100 : 0;
      });
      
      // Average the percentages
      const sum = percentages.reduce((acc, pct) => acc + pct, 0);
      avgGrade = Math.round(sum / percentages.length);
    }

    return {
      id: student._id,
      name: student.name,
      email: student.email,
      section: student.section || '',
      assignments: sortedEssays.length,
      avgGrade,
      enrolledDate: student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—',
      lastActive: sortedEssays[0]?.createdAt ? new Date(sortedEssays[0].createdAt).toLocaleDateString() : '—',
      submittedAssignments: sortedEssays.map((essay) => ({
        id: essay._id,
        title: essay.title,
        submittedDate: new Date(essay.createdAt).toLocaleDateString(),
        grade: essay.grade ?? 'N/A',
        status: typeof essay.grade === 'number' ? 'Graded' : 'Pending',
        feedback: essay.feedback || 'No feedback yet',
      })),
    };
  });
}

function buildAssignmentsData(assignments = [], essays = []) {
  return assignments.map((assignment) => {
    const relatedEssays = essays.filter((essay) => {
      if (essay.assignment && essay.assignment._id) {
        return essay.assignment._id === assignment._id;
      }
      return essay.assignment === assignment._id || essay.assignmentId === assignment._id || essay.title === assignment.title;
    });

    const graded = relatedEssays.filter((essay) => typeof essay.grade === 'number');
    const avgScore =
      graded.length > 0
        ? Math.round(graded.reduce((sum, essay) => sum + (essay.grade || 0), 0) / graded.length)
        : null;

    return {
      id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—',
      totalMarks: assignment.totalMarks,
      sections: assignment.sections || [],
      submissions: relatedEssays.length,
      graded: graded.length,
      avgScore,
      createdAt: assignment.createdAt,
      attachmentName: assignment.attachmentName,
      submissionsDetails: relatedEssays.map((essay) => ({
        id: essay._id,
        studentName: essay.studentName,
        studentEmail: essay.studentEmail,
        studentRoll: essay.studentRoll,
        grade: essay.grade,
        feedback: essay.feedback,
        createdAt: essay.createdAt,
      })),
    };
  });
}

export default App;
