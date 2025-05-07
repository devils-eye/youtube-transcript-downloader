'use client';

import { useState, useEffect } from 'react';
import SettingsPopup from './SettingsPopup';

export default function Navbar({ darkMode, setDarkMode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', newMode ? 'true' : 'false');
    
    // Apply dark mode to document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md py-3 px-4 mb-6 transition-colors duration-200">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-red-600 mr-2" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          <span className="font-bold text-xl text-gray-800 dark:text-white">YouTube Transcript Downloader</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          {/* Settings Button */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Settings
          </button>
        </div>
      </div>
      
      {/* Settings Popup */}
      {isSettingsOpen && (
        <SettingsPopup onClose={() => setIsSettingsOpen(false)} />
      )}
    </nav>
  );
}
