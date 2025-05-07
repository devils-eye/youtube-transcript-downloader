"use client";

import { useEffect } from "react";

export default function TailwindFix() {
  useEffect(() => {
    // This function will inject Tailwind CSS classes if they're not loading properly
    const injectTailwindStyles = () => {
      const style = document.createElement("style");
      style.textContent = `
        /* Base Tailwind utility classes */
        .container { width: 100%; }
        @media (min-width: 640px) { .container { max-width: 640px; } }
        @media (min-width: 768px) { .container { max-width: 768px; } }
        @media (min-width: 1024px) { .container { max-width: 1024px; } }
        @media (min-width: 1280px) { .container { max-width: 1280px; } }
        @media (min-width: 1536px) { .container { max-width: 1536px; } }
        
        .mx-auto { margin-left: auto; margin-right: auto; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
        
        .text-center { text-align: center; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .font-bold { font-weight: 700; }
        
        .bg-white { background-color: #ffffff; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-800 { background-color: #1f2937; }
        .bg-gray-900 { background-color: #111827; }
        
        .text-white { color: #ffffff; }
        .text-gray-100 { color: #f3f4f6; }
        .text-gray-300 { color: #d1d5db; }
        .text-gray-400 { color: #9ca3af; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-900 { color: #111827; }
        
        .border-t { border-top-width: 1px; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-700 { border-color: #374151; }
        
        .min-h-screen { min-height: 100vh; }
        .w-full { width: 100%; }
        .max-w-md { max-width: 28rem; }
        .max-w-3xl { max-width: 48rem; }
        .max-w-4xl { max-width: 56rem; }
        
        .rounded-lg { border-radius: 0.5rem; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        
        .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; }
        .duration-200 { transition-duration: 200ms; }
        
        /* Dark mode */
        .dark .dark\\:bg-gray-700 { background-color: #374151; }
        .dark .dark\\:bg-gray-800 { background-color: #1f2937; }
        .dark .dark\\:bg-gray-900 { background-color: #111827; }
        
        .dark .dark\\:text-white { color: #ffffff; }
        .dark .dark\\:text-gray-100 { color: #f3f4f6; }
        .dark .dark\\:text-gray-300 { color: #d1d5db; }
        .dark .dark\\:text-gray-400 { color: #9ca3af; }
        
        .dark .dark\\:border-gray-600 { border-color: #4b5563; }
        .dark .dark\\:border-gray-700 { border-color: #374151; }
      `;
      document.head.appendChild(style);
    };

    // Check if Tailwind styles are loaded
    const isTailwindLoaded = () => {
      // Create a test element with a Tailwind class
      const testElement = document.createElement("div");
      testElement.className = "hidden";
      document.body.appendChild(testElement);
      
      // Check if the class is applied
      const styles = window.getComputedStyle(testElement);
      const isHidden = styles.display === "none";
      
      // Clean up
      document.body.removeChild(testElement);
      
      return isHidden;
    };

    // If Tailwind is not loaded properly, inject our backup styles
    if (!isTailwindLoaded()) {
      injectTailwindStyles();
    }
  }, []);

  return null;
}
