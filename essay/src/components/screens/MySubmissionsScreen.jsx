import React, { useEffect, useState } from 'react';
import { FileText, Award, Clock, CheckCircle, AlertCircle, BookOpen, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

const MySubmissionsScreen = ({ darkMode, authToken }) => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authToken) return;

    const loadSubmissions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await api.fetchMySubmissions(authToken);
        setSubmissions(data);
      } catch (err) {
        const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Unable to load submissions';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, [authToken]);

  const getGradeColor = (grade) => {
    if (typeof grade !== 'number' || Number.isNaN(grade)) {
      return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600';
    }
    if (grade >= 90) return darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
    if (grade >= 80) return darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
    return darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading your submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg p-4 border ${darkMode ? 'bg-red-900/40 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-800'}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          My Submissions
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
          View your assignment submissions and grades
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className={`rounded-xl p-8 text-center border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            You haven't submitted any assignments yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission._id}
              className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {submission.assignment?.title || submission.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm ml-8">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Submitted: {new Date(submission.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {submission.assignment?.totalMarks && (
                      <div className="flex items-center gap-2">
                        <Award className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          Total Marks: {submission.assignment.totalMarks}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {submission.grade !== null && (
                  <div className="text-right">
                    <div className={`px-4 py-2 rounded-full text-lg font-bold ${getGradeColor(submission.grade)}`}>
                      {submission.grade} / {submission.assignment?.totalMarks || 100}
                    </div>
                    {submission.gradeLetter && (
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Grade: {submission.gradeLetter}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submission Content */}
              <div className={`rounded-lg p-4 mb-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your Submission
                  </span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                  {submission.content}
                </p>
              </div>

              {/* Grade Status */}
              {submission.grade !== null ? (
                <div className={`rounded-lg p-4 border ${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className={`font-semibold ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                      Graded
                    </span>
                  </div>
                  
                  {submission.feedback && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className={`w-4 h-4 ${darkMode ? 'text-green-300' : 'text-green-700'}`} />
                        <span className={`text-sm font-medium ${darkMode ? 'text-green-200' : 'text-green-800'}`}>
                          Feedback
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-green-100' : 'text-green-900'} whitespace-pre-wrap`}>
                        {submission.feedback}
                      </p>
                    </div>
                  )}

                  {submission.evaluation && (
                    <div className="space-y-3">
                      {submission.evaluation.strengths && submission.evaluation.strengths.length > 0 && (
                        <div>
                          <span className={`text-xs font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                            Strengths:
                          </span>
                          <ul className="mt-1 space-y-1">
                            {submission.evaluation.strengths.map((strength, idx) => (
                              <li key={idx} className={`text-xs ${darkMode ? 'text-green-100' : 'text-green-800'} flex items-start gap-2`}>
                                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {submission.evaluation.improvements && submission.evaluation.improvements.length > 0 && (
                        <div>
                          <span className={`text-xs font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                            Areas for Improvement:
                          </span>
                          <ul className="mt-1 space-y-1">
                            {submission.evaluation.improvements.map((improvement, idx) => (
                              <li key={idx} className={`text-xs ${darkMode ? 'text-green-100' : 'text-green-800'} flex items-start gap-2`}>
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`rounded-lg p-4 border ${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className={`font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                      Pending Grading
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-yellow-100' : 'text-yellow-700'}`}>
                    Your submission is waiting for the admin to grade it. You'll be able to see your grade and feedback here once it's been evaluated.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsScreen;

