import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, CheckCircle, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import Lottie from "lottie-react";
import animationData from '../../assets/lottie.json';

const RegisterScreen = ({ darkMode, toggleDarkMode, handleRegister }) => {
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    section: "",
    role: "student", // Default to student
    securityQuestion: "",
    securityAnswer: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await handleRegister(registerForm);
      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
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

      {/* Right - Register Form */}
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
              Create Account
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign up to get started with essay grading
            </p>
          </div>

          {(error || success) && (
            <div className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}>
              {error ? <AlertTriangle className="h-4 w-4 flex-shrink-0" /> : <CheckCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{error || success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={registerForm.name}
                  onChange={handleChange}
                  required
                  className={`block w-full pl-10 pr-3 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                    ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    }`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleChange}
                  required
                  className={`block w-full pl-10 pr-3 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                    ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={registerForm.password}
                  onChange={handleChange}
                  required
                  className={`block w-full pl-10 pr-10 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                    ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                    }`}
                  placeholder="Enter your password"
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

            {/* Role Selection */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                I am a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, role: 'student' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
                    registerForm.role === 'student'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : darkMode
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <GraduationCap className={`h-5 w-5 ${registerForm.role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${registerForm.role === 'student' ? 'text-blue-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Student
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterForm({ ...registerForm, role: 'teacher' })}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition ${
                    registerForm.role === 'teacher'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : darkMode
                      ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <BookOpen className={`h-5 w-5 ${registerForm.role === 'teacher' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${registerForm.role === 'teacher' ? 'text-blue-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Teacher
                  </span>
                </button>
              </div>
            </div>

            {/* Section (only for students) */}
            {registerForm.role === 'student' && (
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Section
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="section"
                    value={registerForm.section}
                    onChange={handleChange}
                    required
                    className={`block w-full pl-10 pr-3 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                      ${
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                      }`}
                    placeholder="Enter your section (e.g., A, B, C)"
                  />
                </div>
              </div>
            )}

            {/* Security Question */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Security Question (for password recovery)
              </label>
              <select
                name="securityQuestion"
                value={registerForm.securityQuestion}
                onChange={handleChange}
                required
                className={`block w-full pl-3 pr-3 py-3 rounded-lg border placeholder-gray-400 shadow-sm focus:ring-2 focus:border-blue-500 transition
                  ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:ring-blue-400'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                  }`}
              >
                <option value="">Select a security question</option>
                <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                <option value="What city were you born in?">What city were you born in?</option>
                <option value="What was your mother's maiden name?">What was your mother's maiden name?</option>
                <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                <option value="What is your favorite book?">What is your favorite book?</option>
                <option value="What was the make of your first car?">What was the make of your first car?</option>
              </select>
            </div>

            {/* Security Answer */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Security Answer
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="securityAnswer"
                  value={registerForm.securityAnswer}
                  onChange={handleChange}
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
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                This will be used to reset your password if you forget it
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition transform hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Sign In */}
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </button>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Easy Registration
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <GraduationCap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Role-Based Access
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
