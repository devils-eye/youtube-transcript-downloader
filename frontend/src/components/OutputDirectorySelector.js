"use client";

import { useState, useEffect } from "react";
import { getOutputDirectory, setOutputDirectory } from "../api/api";

export default function OutputDirectorySelector() {
  const [outputDir, setOutputDir] = useState("");
  const [customDir, setCustomDir] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchOutputDir = async () => {
      try {
        setIsLoading(true);
        const data = await getOutputDirectory();
        setOutputDir(data.output_dir);
        setCustomDir(data.output_dir);
      } catch (err) {
        console.error("Error fetching output directory:", err);
        setError("Failed to get output directory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutputDir();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      await setOutputDirectory(customDir);
      setOutputDir(customDir);
      setIsEditing(false);
      setSuccess("Output directory updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error setting output directory:", err);
      setError("Failed to set output directory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCustomDir(outputDir);
    setIsEditing(false);
    setError("");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-200">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Output Directory
      </h3>

      {isLoading ? (
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      ) : isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={customDir}
            onChange={(e) => setCustomDir(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter output directory path"
          />

          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
            {outputDir}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Change
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-400">
          {success}
        </div>
      )}
    </div>
  );
}
