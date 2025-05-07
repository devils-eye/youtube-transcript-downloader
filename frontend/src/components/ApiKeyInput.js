"use client";

import { useState, useEffect } from "react";
import { setApiKey, getApiKeyStatus } from "../api/api";

export default function ApiKeyInput() {
  const [apiKey, setApiKeyValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [apiKeyFromEnv, setApiKeyFromEnv] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if API key is set from environment variables
    const checkApiKeyStatus = async () => {
      try {
        const status = await getApiKeyStatus();
        setApiKeyFromEnv(status.from_env);
      } catch (error) {
        console.error("Failed to check API key status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKeyStatus();
  }, []);

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

      // Hide the input after successful submission
      setTimeout(() => {
        setShowInput(false);
      }, 2000);
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
    <div className="mb-4">
      {!showInput ? (
        <div>
          <button
            onClick={() => setShowInput(true)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Set YouTube API Key
          </button>
          {!isLoading && apiKeyFromEnv && (
            <div className="mt-1 text-xs text-green-600">
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
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
                API key already set from environment variables
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-3 rounded-md">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                YouTube API Key
              </label>
              {apiKeyFromEnv && (
                <div className="mb-2 text-xs text-green-600 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
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
                  API key already set from environment variables. You can
                  override it for this session.
                </div>
              )}
              <input
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Enter your YouTube API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key will be used for this session only and won't be
                stored permanently
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-3 py-1 rounded-md text-white text-sm ${
                  isSubmitting ? "bg-gray-400" : "bg-primary hover:bg-red-700"
                }`}
              >
                {isSubmitting ? "Setting..." : "Set API Key"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInput(false);
                  setApiKeyValue("");
                  setMessage(null);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>

            {message && (
              <div
                className={`text-sm ${
                  message.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
