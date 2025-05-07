"use client";

import { useState, useEffect } from "react";

export default function ClientLayout({ children }) {
  // This is a client component now, so we can use hooks
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);

    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <html lang="en" className={darkMode ? "dark" : ""}>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
        <main>
          {/* Pass darkMode state to children */}
          {typeof children === "function"
            ? children({ darkMode, setDarkMode })
            : children}
        </main>

        <footer className="bg-white dark:bg-gray-800 py-4 mt-8 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
            <p>YouTube Transcript Downloader - For educational purposes only</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
