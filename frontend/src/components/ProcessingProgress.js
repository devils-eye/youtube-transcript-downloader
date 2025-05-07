"use client";

import { useState, useEffect } from "react";
import { getTaskStatus, cancelTask, getDownloadUrl } from "../api/api";

export default function ProcessingProgress({ taskId, onComplete, onCancel }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  // Poll for task status
  useEffect(() => {
    if (!taskId || isCompleted || isCancelled) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await getTaskStatus(taskId);

        setProgress(data.percent || 0);
        setStatus(data.status || "Processing...");
        setElapsedTime(data.elapsed_seconds || 0);

        if (data.completed) {
          setIsCompleted(true);
          clearInterval(pollInterval);

          if (data.results) {
            setResults(data.results);
            if (onComplete) onComplete(data.results);
          }
        }

        if (data.cancelled) {
          setIsCancelled(true);
          clearInterval(pollInterval);
          if (onCancel) onCancel();
        }
      } catch (err) {
        console.error("Error polling task status:", err);
        setError("Failed to get processing status");
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [taskId, isCompleted, isCancelled, onComplete, onCancel]);

  const handleCancel = async () => {
    try {
      await cancelTask(taskId);
      setStatus("Cancelling...");
    } catch (err) {
      console.error("Error cancelling task:", err);
      setError("Failed to cancel processing");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If completed, show a success message with results
  if (isCompleted && results) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Processing Complete!
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Successfully processed {results.successful.length} videos
          </p>
          {results.failed.length > 0 && (
            <p className="text-red-500 dark:text-red-400 font-medium">
              Failed to process {results.failed.length} videos
            </p>
          )}
          {results.warnings && results.warnings.length > 0 && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                Warnings:
              </p>
              <ul className="list-disc pl-5 text-sm text-yellow-700 dark:text-yellow-300">
                {results.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {results.output_files.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-gray-800 dark:text-white">
              Generated Files:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.output_files.map((file, index) => {
                const filename = file.file_path.split("/").pop();
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {filename}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Contains {file.videos.length} videos | ~
                        {file.token_count} tokens
                      </p>
                    </div>
                    <a
                      href={getDownloadUrl(filename)}
                      download
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Download
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // If cancelled, show a cancelled message
  if (isCancelled) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
        <div className="flex items-center mb-4">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full mr-3">
            <svg
              className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Processing Cancelled
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          The processing operation was cancelled.
        </p>
      </div>
    );
  }

  // Show progress bar during processing
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Processing Transcripts
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Time elapsed: {formatTime(elapsedTime)}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, progress)}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>{status}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleCancel}
        className="w-full py-2 px-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/70 transition duration-200"
      >
        Cancel Processing
      </button>
    </div>
  );
}
