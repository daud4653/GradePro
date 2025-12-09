import React, { useEffect, useState } from "react";
import {
  User,
  FileText,
  Send,
  Star,
  CheckCircle,
  Clock,
  BookOpen,
  AlertTriangle,
  X,
  Sparkles,
  Award,
  MessageSquare,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { api, evaluateEssayWithAI } from "../../services/api";
import { calculateGradeAndGPA } from "../../utils/gradeCalculator";

const GradeAssignmentScreen = ({
  darkMode,
  authToken,
  onSaved,
  onClose,
  asDialog = false,
  assignmentIdOverride
}) => {
  const { id: routeAssignmentId } = useParams();
  const resolvedAssignmentId = assignmentIdOverride ?? routeAssignmentId ?? undefined;
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  useEffect(() => {
    if (!authToken || !resolvedAssignmentId) return;
    let canceled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [assignmentData, submissionsData] = await Promise.all([
          api.getAssignment(authToken, resolvedAssignmentId),
          api.fetchSubmissionsByAssignment(authToken, resolvedAssignmentId),
        ]);

        if (!canceled) {
          setAssignment(assignmentData);
          setSubmissions(submissionsData);
        }
      } catch (err) {
        if (!canceled) {
          setError(err.message || "Unable to load assignment data");
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      canceled = true;
    };
  }, [resolvedAssignmentId, authToken]);

  const handleEvaluate = async (submission) => {
    if (!submission.content) {
      alert("Submission content is empty");
      return;
    }

    setEvaluatingId(submission._id);
    setGradingSubmission(submission);

    try {
      const aiResponse = await evaluateEssayWithAI({
        submissionText: submission.content,
        studentName: submission.studentName,
        assignmentId: resolvedAssignmentId,
        totalMarks: assignment?.totalMarks,
      });

      const normalizedScore =
        typeof aiResponse.score === "number"
          ? aiResponse.score
          : typeof aiResponse.normalized_score === "number"
            ? aiResponse.normalized_score
            : null;

      let gradeLetter = null;
      let gpa = null;
      if (normalizedScore !== null && assignment?.totalMarks) {
        const gradeInfo = calculateGradeAndGPA(normalizedScore, assignment.totalMarks);
        gradeLetter = gradeInfo.gradeLetter;
        gpa = gradeInfo.gpa;
      }

      // Use values from API if available
      if (aiResponse.grade_letter) {
        gradeLetter = aiResponse.grade_letter;
      }
      if (aiResponse.gpa !== undefined) {
        gpa = aiResponse.gpa;
      }

      const evaluation = {
        ...aiResponse,
        strengths: aiResponse.strengths || [],
        improvements: aiResponse.improvements || [],
        metadata: aiResponse.metadata || {},
      };

      // Update the submission with evaluation results
      setGradingSubmission({
        ...submission,
        evaluation,
        grade: normalizedScore !== null ? Math.round(normalizedScore) : null,
        gradeLetter,
        gpa: gpa !== null ? (typeof gpa === 'number' ? gpa.toFixed(1) : gpa) : null,
        feedback: aiResponse.feedback || aiResponse.detailedFeedback || "",
      });
    } catch (err) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || "Failed to evaluate submission";
      alert(errorMessage);
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleSaveGrade = async (submission) => {
    if (!submission.grade || !submission.feedback) {
      alert("Please ensure grade and feedback are provided");
      return;
    }

    try {
      await api.saveEssay(authToken, {
        studentName: submission.studentName,
        studentEmail: submission.studentEmail,
        studentRoll: submission.studentRoll,
        title: submission.title,
        content: submission.content,
        grade: Number(submission.grade),
        feedback: submission.feedback,
        evaluation: submission.evaluation,
        assignmentId: resolvedAssignmentId,
      });

      // Refresh submissions list
      const updatedSubmissions = await api.fetchSubmissionsByAssignment(authToken, resolvedAssignmentId);
      setSubmissions(updatedSubmissions);
      setGradingSubmission(null);
      onSaved?.();
    } catch (err) {
      alert(err.message || "Failed to save grade");
    }
  };

  const containerClasses = asDialog
    ? `relative ${darkMode ? "bg-gray-900" : "bg-white"} rounded-2xl shadow-2xl border ${
        darkMode ? "border-gray-700" : "border-gray-200"
      } max-h-[85vh] overflow-y-auto p-5 sm:p-8`
    : "";

  if (isLoading) {
    return (
      <div className={containerClasses || "min-h-screen p-6"}>
        <p className={darkMode ? "text-white" : "text-gray-900"}>Loading assignment and submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses || "min-h-screen p-6"}>
        <div className={`rounded-lg p-4 border ${darkMode ? "bg-red-900/40 border-red-700 text-red-100" : "bg-red-50 border-red-200 text-red-800"}`}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const inner = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {assignment?.title || "Grade Assignment"}
          </h1>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-sm mt-1`}>
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""} received
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-500"} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Assignment Info */}
      {assignment && (
        <div className={`rounded-xl p-4 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Total Marks: {assignment.totalMarks}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className={`rounded-xl p-8 text-center border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            No submissions yet. Students can submit their assignments from the assignments page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const isEvaluating = evaluatingId === submission._id;
            const isGrading = gradingSubmission?._id === submission._id;
            const submissionData = isGrading ? gradingSubmission : submission;

            return (
              <div
                key={submission._id}
                className={`rounded-xl border p-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                {/* Student Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-blue-600" : "bg-blue-500"}`}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {submission.studentName}
                      </h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {submission.studentEmail}
                      </p>
                      <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Roll: {submission.studentRoll} {submission.studentSection && `• Section: ${submission.studentSection}`}
                      </p>
                      <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Submitted: {new Date(submission.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {submission.grade !== null && (
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        submission.grade >= 90
                          ? darkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                          : submission.grade >= 80
                          ? darkMode ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                          : darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
                      }`}>
                        {submission.grade} / {assignment?.totalMarks || 100}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submission Content Preview */}
                <div className={`rounded-lg p-4 mb-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Submission Content
                    </span>
                  </div>
                  {submission.content.length > 300 ? (
                    <details className="cursor-pointer">
                      <summary className={`text-sm font-medium ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} mb-2`}>
                        Click to view full content ({submission.content.length} characters)
                      </summary>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap mt-2 max-h-96 overflow-y-auto`}>
                        {submission.content}
                      </p>
                    </details>
                  ) : (
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}>
                      {submission.content}
                    </p>
                  )}
                </div>

                {/* Grade Status */}
                {submission.grade !== null ? (
                  <div className={`rounded-lg p-4 mb-4 ${darkMode ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className={`font-semibold ${darkMode ? "text-green-200" : "text-green-800"}`}>
                        Graded
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Grade</span>
                        <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {submission.grade} / {assignment?.totalMarks || 100}
                        </p>
                      </div>
                      {submission.gradeLetter && (
                        <div>
                          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Letter Grade</span>
                          <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {submission.gradeLetter}
                          </p>
                        </div>
                      )}
                    </div>
                    {submission.feedback && (
                      <div>
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Feedback</span>
                        <p className={`text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleEvaluate(submission)}
                      className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
                        darkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      Re-evaluate with AI
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Evaluate Button */}
                    <button
                      onClick={() => handleEvaluate(submission)}
                      disabled={isEvaluating}
                      className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                        isEvaluating
                          ? "bg-gray-400 cursor-not-allowed text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {isEvaluating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Evaluate with AI
                        </>
                      )}
                    </button>

                    {/* Evaluation Results & Grade Form */}
                    {isGrading && submissionData.evaluation && (
                      <div className={`rounded-lg p-4 border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                        <h4 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                          AI Evaluation Results
                        </h4>

                        {/* Strengths & Improvements */}
                        {submissionData.evaluation.strengths && submissionData.evaluation.strengths.length > 0 && (
                          <div className="mb-4">
                            <h5 className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              Strengths
                            </h5>
                            <ul className="space-y-1">
                              {submissionData.evaluation.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    {strength}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {submissionData.evaluation.improvements && submissionData.evaluation.improvements.length > 0 && (
                          <div className="mb-4">
                            <h5 className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              Areas for Improvement
                            </h5>
                            <ul className="space-y-1">
                              {submissionData.evaluation.improvements.map((improvement, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    {improvement}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Grade Input */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              Grade {assignment?.totalMarks ? `(0-${assignment.totalMarks})` : "(0-100)"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={assignment?.totalMarks || 100}
                              value={submissionData.grade || ""}
                              onChange={(e) => {
                                const newGrade = e.target.value;
                                setGradingSubmission({
                                  ...submissionData,
                                  grade: newGrade,
                                });
                                // Recalculate grade letter and GPA
                                if (assignment?.totalMarks && newGrade) {
                                  const gradeInfo = calculateGradeAndGPA(Number(newGrade), assignment.totalMarks);
                                  setGradingSubmission(prev => ({
                                    ...prev,
                                    gradeLetter: gradeInfo.gradeLetter || "",
                                    gpa: gradeInfo.gpa !== null ? gradeInfo.gpa.toFixed(1) : "",
                                  }));
                                }
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                darkMode
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-gray-900 border-gray-300"
                              }`}
                            />
                          </div>
                          {submissionData.gradeLetter && (
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Letter Grade
                              </label>
                              <input
                                type="text"
                                value={submissionData.gradeLetter}
                                readOnly
                                className={`w-full px-3 py-2 border rounded-lg ${
                                  darkMode
                                    ? "bg-gray-700 text-white border-gray-600"
                                    : "bg-gray-100 text-gray-900 border-gray-300"
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Feedback */}
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Feedback
                          </label>
                          <textarea
                            value={submissionData.feedback || ""}
                            onChange={(e) => {
                              setGradingSubmission({
                                ...submissionData,
                                feedback: e.target.value,
                              });
                            }}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                              darkMode
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-gray-900 border-gray-300"
                            }`}
                            placeholder="Provide detailed feedback..."
                          />
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={() => handleSaveGrade(submissionData)}
                          className="w-full py-3 px-4 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Award className="w-4 h-4 inline mr-2" />
                          Save Grade & Feedback
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (asDialog) {
    return (
      <div className={containerClasses}>
        {inner}
      </div>
    );
  }

  return inner;
};

export default GradeAssignmentScreen;
