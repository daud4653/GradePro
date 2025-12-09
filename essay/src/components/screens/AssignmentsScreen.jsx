import React, { useEffect, useState } from 'react';
import { Plus, Download, Calendar, Users, BarChart3, ClipboardList, Upload, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GradeAssignmentScreen from './GradeAssignmentScreen';

const AssignmentsScreen = ({ darkMode, assignments = [], syncing = false, authToken, onRefresh, userRole, isAdmin, userSection }) => {
  const navigate = useNavigate();
  const [gradingAssignmentId, setGradingAssignmentId] = useState(null);
  const showSectionWarning = !isAdmin && (!userSection || !userSection.trim());

  const handleNewAssignment = () => {
    navigate('/assignments/new');
  };

  const handleGradeNow = (assignmentId) => {
    setGradingAssignmentId(assignmentId);
  };

  useEffect(() => {
    document.body.style.overflow = gradingAssignmentId ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [gradingAssignmentId]);

  const closeDialog = () => setGradingAssignmentId(null);

  const handleGradeSaved = () => {
    onRefresh?.();
    closeDialog();
  };

  const handleDownload = (assignment) => {
    const rows = [
      ['Student Name', 'Email', 'Roll', 'Grade', 'Feedback', 'Submitted At'],
      ...(assignment.submissionsDetails || []).map((submission) => [
        submission.studentName,
        submission.studentEmail,
        submission.studentRoll,
        submission.grade ?? 'Pending',
        submission.feedback || '',
        submission.createdAt ? new Date(submission.createdAt).toLocaleString() : '',
      ]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${assignment.title.replace(/\s+/g, '_')}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-6">
      {/* Section Warning Banner */}
      {showSectionWarning && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Section Required
              </h3>
              <p className={`text-sm mb-3 ${darkMode ? 'text-yellow-100' : 'text-yellow-700'}`}>
                You need to set your section to view and submit assignments. Please update your section in Settings.
              </p>
              <button
                onClick={() => navigate('/settings')}
                className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
              >
                Go to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Assignments</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            {isAdmin 
              ? 'Create prompts, monitor submissions, and jump directly into grading.'
              : 'View and submit your assignments.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleNewAssignment}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        )}
      </div>

      {syncing && <p className="text-sm text-blue-400">Refreshing data...</p>}

      {assignments.length === 0 ? (
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          No assignments yet. Create one to start collecting submissions.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-sm`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{assignment.title}</h3>
                  {assignment.description && (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{assignment.description}</p>
                  )}
                </div>
                <ClipboardList className={`w-5 h-5 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
              </div>

              <div className="space-y-3">
                <InfoRow
                  label="Due Date"
                  value={
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      {assignment.dueDate}
                    </span>
                  }
                  darkMode={darkMode}
                />
                <InfoRow
                  label="Total Marks"
                  value={`${assignment.totalMarks}`}
                  darkMode={darkMode}
                />
                {assignment.sections && assignment.sections.length > 0 && (
                  <InfoRow
                    label="Sections"
                    value={`${assignment.sections.join(', ')}`}
                    darkMode={darkMode}
                  />
                )}
                <InfoRow
                  label="Submissions"
                  value={
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-400" />
                      {assignment.submissions}
                    </span>
                  }
                  darkMode={darkMode}
                />
                <InfoRow
                  label="Average Score"
                  value={
                    assignment.avgScore !== null
                      ? `${assignment.avgScore}%`
                      : assignment.submissions === 0
                        ? 'Waiting'
                        : 'Pending'
                  }
                  darkMode={darkMode}
                />
                <InfoRow
                  label="Graded"
                  value={
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-yellow-400" />
                      {assignment.graded}/{assignment.submissions}
                    </span>
                  }
                  darkMode={darkMode}
                />
              </div>

              <div className="mt-6 flex gap-2">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => handleGradeNow(assignment.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors"
                    >
                      Grade Submissions
                    </button>
                    <button
                      onClick={() => handleDownload(assignment)}
                      className={`px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'} transition-colors`}
                      disabled={!assignment.submissions}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/assignments/${assignment.id}/submit`)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Assignment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      {gradingAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/60" onClick={closeDialog} />
          <div className="relative w-full max-w-5xl">
            <GradeAssignmentScreen
              darkMode={darkMode}
              authToken={authToken}
              asDialog
              assignmentIdOverride={gradingAssignmentId}
              onSaved={handleGradeSaved}
              onClose={closeDialog}
            />
          </div>
        </div>
      )}
    </>
  );
};

const InfoRow = ({ label, value, darkMode }) => (
  <div className="flex justify-between items-start text-sm">
    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
    <span className={`text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
  </div>
);

export default AssignmentsScreen;
