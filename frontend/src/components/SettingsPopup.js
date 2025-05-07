"use client";

import { useState, useEffect, useRef } from "react";
import { setApiKey, getQuotaInfo, getApiKeyStatus } from "../api/api";

export default function SettingsPopup({ onClose }) {
  const [apiKey, setApiKeyValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [apiKeyFromEnv, setApiKeyFromEnv] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const popupRef = useRef(null);

  // Fetch quota info and API key status when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch both quota info and API key status in parallel
        const [quotaData, apiKeyStatus] = await Promise.all([
          getQuotaInfo(),
          getApiKeyStatus(),
        ]);

        setQuotaInfo(quotaData);
        setApiKeyFromEnv(apiKeyStatus.from_env);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setMessage({ type: "error", text: "Please enter an API key" });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const response = await setApiKey(apiKey);

      setMessage({
        type: "success",
        text: "API key set successfully",
      });

      // Refresh quota info
      const quotaData = await getQuotaInfo();
      setQuotaInfo(quotaData);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to set API key",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={popupRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transition-colors duration-200"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
            YouTube API Key
          </h3>

          {isLoading ? (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              Loading API key status...
            </div>
          ) : apiKeyFromEnv ? (
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md mb-3">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    API key is already set from environment variables
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    The application is using the API key from your environment
                    configuration.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="apiKey"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  API Key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="Enter your YouTube API key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your API key will be used for this session only
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md text-white text-sm ${
                    isSubmitting
                      ? "bg-gray-400 dark:bg-gray-600"
                      : "bg-primary hover:bg-red-700"
                  }`}
                >
                  {isSubmitting ? "Setting..." : "Set API Key"}
                </button>
              </div>

              {message && (
                <div
                  className={`text-sm ${
                    message.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </form>
          )}
        </div>

        {!isLoading && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
              API Quota Information
            </h3>

            {quotaInfo ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Used Today:
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {quotaInfo.used_quota}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Daily Limit:
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {quotaInfo.daily_quota}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Remaining:
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {quotaInfo.remaining_quota}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${quotaInfo.quota_usage_percent}%`,
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-center text-gray-500 dark:text-gray-400">
                Unable to fetch quota information
              </div>
            )}

            {apiKeyFromEnv && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                This quota information is based on the API key from your
                environment variables.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
