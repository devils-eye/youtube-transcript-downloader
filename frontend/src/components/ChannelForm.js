"use client";

import { useState } from "react";
import { processChannel } from "../api/api";

export default function ChannelForm({ onChannelProcessed, setLoading }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!youtubeUrl) {
      setError("Please enter a YouTube URL");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const data = await processChannel(youtubeUrl);
      onChannelProcessed(data);
    } catch (err) {
      setError(err.error || "Failed to process URL");
    } finally {
      setLoading(false);
    }
  };

  // Function to detect URL type for UI feedback
  const getUrlType = (url) => {
    if (!url) return "";

    // Video URL patterns
    const videoPatterns = [
      /youtube\.com\/watch\?v=([^&\s]+)/, // youtube.com/watch?v=VIDEO_ID
      /youtu\.be\/([^/\s]+)/, // youtu.be/VIDEO_ID
      /youtube\.com\/v\/([^/\s]+)/, // youtube.com/v/VIDEO_ID
      /youtube\.com\/embed\/([^/\s]+)/, // youtube.com/embed/VIDEO_ID
    ];

    // Check if it's a video URL
    for (const pattern of videoPatterns) {
      if (pattern.test(url)) {
        return "video";
      }
    }

    // Channel URL patterns
    const channelPatterns = [
      /youtube\.com\/channel\/([^/\s]+)/, // youtube.com/channel/UC...
      /youtube\.com\/c\/([^/\s]+)/, // youtube.com/c/ChannelName
      /youtube\.com\/user\/([^/\s]+)/, // youtube.com/user/Username
      /youtube\.com\/@([^/\s]+)/, // youtube.com/@HandleName
    ];

    // Check if it's a channel URL
    for (const pattern of channelPatterns) {
      if (pattern.test(url)) {
        return "channel";
      }
    }

    return "unknown";
  };

  const urlType = getUrlType(youtubeUrl);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Enter YouTube URL
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="youtubeUrl"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            YouTube URL
          </label>
          <input
            type="text"
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter a YouTube channel URL (e.g.,
            https://www.youtube.com/@username) or a video URL (e.g.,
            https://www.youtube.com/watch?v=VIDEO_ID)
          </p>

          {urlType && (
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  urlType === "channel"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : urlType === "video"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                }`}
              >
                {urlType === "channel"
                  ? "Channel URL detected"
                  : urlType === "video"
                  ? "Video URL detected"
                  : "Unknown URL format"}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
        )}

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
        >
          Process{" "}
          {urlType === "video"
            ? "Video"
            : urlType === "channel"
            ? "Channel"
            : "URL"}
        </button>
      </form>
    </div>
  );
}
