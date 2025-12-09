import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle, ArrowLeft, HelpCircle, Key } from "lucide-react";
import Lottie from "lottie-react";
import animationData from '../../assets/lottie.json';
import { api } from '../../services/api';

const ResetPasswordQuestionScreen = ({ darkMode, toggleDarkMode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const questionParam = searchParams.get('question');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (questionParam) {
      setSecurityQuestion(questionParam);
    } else if (emailParam) {
      // Fetch security question if not in URL
      fetchSecurityQuestion(emailParam);
    }
  }, [searchParams]);

  const fetchSecurityQuestion = async (emailAddress) => {
    try {
      const response = await api.getSecurityQuestion(emailAddress);
      if (response.hasSecurityQuestion) {
        setSecurityQuestion(response.securityQuestion);
      } else {
        setError("Security question not set for this account.");
      }
    } catch (err) {
      setError(err.message || "Failed to load security question.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !securityAnswer || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPasswordWithQuestion(email, securityAnswer, password);
      setSuccess("Password has been reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check your answer and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left - Lottie */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="w-[300px] md:w-[400px] lg:w-[500px]">
          <Lottie animationData={animationData} loop autoplay />
        </div>
      </div>

      {/* Right - Reset Password Form */}
      <div
        className={`flex-1 flex items-center justify-center px-12 py-8 ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2
              className={`text-4xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Reset Password
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Answer your security question to reset your password
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {securityQuestion ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className={`block w-full pl-3 pr-3 py-3 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400`}
                />
              </div>

              {/* Security Question (read-only) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Security Question
                </label>
                <div className="relative">
                  <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={securityQuestion}
                    readOnly
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400`}
                  />
                </div>
              </div>

              {/* Security Answer */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Your Answer
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                      ${
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      }`}
                    placeholder="Enter your answer"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`block w-full pl-10 pr-10 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                      ${
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`block w-full pl-10 pr-10 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                      ${
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting password...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Reset Password
                  </div>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Loading security question...
              </p>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <HelpCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Security Question
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Secure Reset
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordQuestionScreen;

