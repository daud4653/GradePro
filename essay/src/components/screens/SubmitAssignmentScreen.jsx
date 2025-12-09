import React, { useState, useEffect } from "react";
import { Upload, FileText, Send, CheckCircle, AlertTriangle, Calendar, BookOpen } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

const SubmitAssignmentScreen = ({ darkMode, authToken }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submissionType, setSubmissionType] = useState("text");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authToken || !id) return;

    const loadAssignment = async () => {
      try {
        const data = await api.getAssignment(authToken, id);
        setAssignment(data);
      } catch (err) {
        setError(err.message || "Unable to load assignment");
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignment();
  }, [authToken, id]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setSubmissionType("file");
    }
  };

  const getSubmissionContent = async () => {
    if (submissionType === "text") {
      return submissionText.trim();
    }

    if (!uploadedFile) {
      throw new Error("Please upload a file first.");
    }

    if (
      uploadedFile.type.startsWith("text/") ||
      uploadedFile.name.toLowerCase().endsWith(".txt")
    ) {
      return (await uploadedFile.text()).trim();
    }
    throw new Error("Only plain text (.txt) files are supported.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Check if due date has passed
      if (assignment?.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        if (now > dueDate) {
          throw new Error(`The due date for this assignment has passed (${dueDate.toLocaleDateString()}). Submissions are no longer accepted.`);
        }
      }

      const content = await getSubmissionContent();
      if (!content) {
        throw new Error("Submission content cannot be empty.");
      }

      await api.submitAssignment(authToken, {
        title: assignment?.title || "Assignment Submission",
        content,
        assignmentId: id,
      });

      setSuccess("Assignment submitted successfully! Waiting for grading...");
      setTimeout(() => {
        navigate("/assignments");
      }, 2000);
    } catch (err) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || "Failed to submit assignment.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <p className={darkMode ? "text-white" : "text-gray-900"}>Loading assignment...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200"
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Submit Assignment
            </h1>
            {assignment && (
              <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {assignment.title}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/assignments")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Back to Assignments
          </button>
        </div>

        {/* Assignment Info */}
        {assignment && (
          <div
            className={`rounded-xl p-6 border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h2
                className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                {assignment.title}
              </h2>
            </div>
            {assignment.description && (
              <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {assignment.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  {new Date(assignment.dueDate) < new Date() && (
                    <span className="ml-2 text-red-500 font-semibold">(Past Due)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Total Marks: {assignment.totalMarks}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div
            className={`rounded-lg p-4 border flex items-start gap-3 ${
              darkMode
                ? "bg-red-900/40 border-red-700 text-red-100"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            className={`rounded-lg p-4 border flex items-start gap-3 ${
              darkMode
                ? "bg-green-900/40 border-green-700 text-green-100"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Submission Form */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-xl p-6 border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Your Submission
          </h2>

          {/* Submission Type Selector */}
          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Submission Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSubmissionType("text")}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
                  submissionType === "text"
                    ? "bg-blue-500 text-white"
                    : `${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Text Submission
              </button>
              <button
                type="button"
                onClick={() => setSubmissionType("file")}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
                  submissionType === "file"
                    ? "bg-blue-500 text-white"
                    : `${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                File Upload
              </button>
            </div>
          </div>

          {/* Text Submission */}
          {submissionType === "text" && (
            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Submission Content *
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={12}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  darkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
                placeholder="Enter your assignment submission here..."
              />
            </div>
          )}

          {/* File Upload */}
          {submissionType === "file" && (
            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Upload Submission File *
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  darkMode
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Upload
                  className={`w-8 h-8 mx-auto mb-2 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <p className={`text-sm mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Drag and drop a text file here, or click to select
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".txt"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-block font-medium"
                >
                  Choose File
                </label>
                {uploadedFile && (
                  <p
                    className={`text-sm mt-2 ${darkMode ? "text-white" : "text-gray-900"} font-medium`}
                  >
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Assignment
              </>
            )}
          </button>

          <p className={`text-xs mt-4 text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Note: You can only submit once per assignment. After submission, you'll need to wait for the admin to grade it.
          </p>
        </form>
      </div>
    </div>
  );
};

export default SubmitAssignmentScreen;

