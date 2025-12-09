import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, CheckCircle, User } from 'lucide-react';
import { api } from '../../services/api';

const SettingsScreen = ({ darkMode, toggleDarkMode, authToken, userRole, userSection, onSectionUpdate }) => {
  const [section, setSection] = useState(userSection || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (authToken && userRole === 'student') {
      loadUserProfile();
    }
  }, [authToken, userRole]);

  const loadUserProfile = async () => {
    try {
      const user = await api.getCurrentUser(authToken);
      setCurrentUser(user);
      setSection(user.section || '');
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  const handleUpdateSection = async () => {
    if (!section.trim()) {
      setUpdateError('Please enter a section');
      return;
    }

    if (!authToken) {
      setUpdateError('Not authenticated');
      return;
    }

    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      const response = await api.updateMySection(authToken, section.trim());
      setUpdateSuccess(true);
      setSection(response.user.section || '');
      
      // Update localStorage
      if (response.user.section) {
        localStorage.setItem('user_section', response.user.section);
      }
      
      // Notify parent component
      if (onSectionUpdate) {
        onSectionUpdate(response.user.section);
      }

      // Reload page after a moment to refresh assignments
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Failed to update section';
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const showSectionWarning = userRole === 'student' && (!userSection || !userSection.trim());

  return (
    <div className="space-y-6">
      <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>

      {/* Section Warning Banner for Students */}
      {showSectionWarning && (
        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Section Required
              </h3>
              <p className={`text-sm ${darkMode ? 'text-yellow-100' : 'text-yellow-700'}`}>
                You need to set your section to access assignments. Please update your section below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Section */}
      {userRole === 'student' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
          <div className="flex items-center gap-2 mb-6">
            <User className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile</h3>
          </div>

          {/* Section Update */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your Section <span className="text-red-500">*</span>
            </label>
            <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter your section (e.g., A, B, C) to access assignments targeted to your section.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setUpdateError('');
                  setUpdateSuccess(false);
                }}
                placeholder="Enter section (e.g., A, B, C)"
                className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                }`}
              />
              <button
                onClick={handleUpdateSection}
                disabled={isUpdating || !section.trim()}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isUpdating || !section.trim()
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
            {updateError && (
              <p className={`text-sm mt-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                {updateError}
              </p>
            )}
            {updateSuccess && (
              <div className={`flex items-center gap-2 mt-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm">Section updated successfully! Refreshing...</p>
              </div>
            )}
            {currentUser && currentUser.section && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Current section: <span className="font-medium">{currentUser.section}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Preferences</h3>

        <ToggleRow
          label="Dark Mode"
          description="Toggle dark mode theme"
          toggled={darkMode}
          onToggle={toggleDarkMode}
          darkMode={darkMode}
        />
        <ToggleRow
          label="Email Notifications"
          description="Receive updates on assignments"
          toggled={true}
          onToggle={() => {}}
          darkMode={darkMode}
        />
        <ToggleRow
          label="Auto-Save"
          description="Enable automatic saving of grades"
          toggled={true}
          onToggle={() => {}}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

const ToggleRow = ({ label, description, toggled, onToggle, darkMode }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h4>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${toggled ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

export default SettingsScreen;
