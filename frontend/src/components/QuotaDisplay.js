"use client";

import { useState, useEffect } from "react";
import { getQuotaInfo } from "../api/api";

export default function QuotaDisplay() {
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchQuotaInfo = async () => {
    try {
      setLoading(true);
      const data = await getQuotaInfo();
      setQuotaInfo(data);
      setError("");
    } catch (err) {
      setError("Failed to load quota information");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaInfo();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchQuotaInfo, 5 * 60 * 1000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const formatTimeUntilReset = () => {
    if (!quotaInfo) return "";

    const { hours_until_reset, minutes_until_reset } = quotaInfo;

    if (hours_until_reset === 0) {
      return `${minutes_until_reset} minutes`;
    } else {
      return `${hours_until_reset} hours, ${minutes_until_reset} minutes`;
    }
  };

  if (loading && !quotaInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md animate-pulse transition-colors duration-200">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error && !quotaInfo) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg shadow-md border border-red-200 dark:border-red-800 transition-colors duration-200">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchQuotaInfo}
          className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!quotaInfo) return null;

  const { daily_quota, used_quota, remaining_quota, quota_usage_percent } =
    quotaInfo;

  // Determine color based on usage percentage
  let barColor = "bg-green-500";
  let textColor = "text-green-700 dark:text-green-400";

  if (quota_usage_percent > 90) {
    barColor = "bg-red-500";
    textColor = "text-red-700 dark:text-red-400";
  } else if (quota_usage_percent > 70) {
    barColor = "bg-yellow-500";
    textColor = "text-yellow-700 dark:text-yellow-400";
  } else if (quota_usage_percent > 50) {
    barColor = "bg-blue-500";
    textColor = "text-blue-700 dark:text-blue-400";
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          YouTube API Quota
        </h3>
        <button
          onClick={fetchQuotaInfo}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          title="Refresh quota information"
        >
          Refresh
        </button>
      </div>

      <div className="mb-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`${barColor} h-2.5 rounded-full`}
            style={{ width: `${Math.min(100, quota_usage_percent)}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Used: {used_quota} units</span>
        <span>Remaining: {remaining_quota} units</span>
      </div>

      <div className="flex justify-between items-center">
        <span className={`text-xs ${textColor} font-medium`}>
          {quota_usage_percent.toFixed(1)}% used
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Resets in: {formatTimeUntilReset()}
        </span>
      </div>

      {quota_usage_percent > 90 && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          <strong>Warning:</strong> YouTube API quota is almost depleted. Some
          operations may fail until the quota resets.
        </div>
      )}

      {quota_usage_percent > 70 && quota_usage_percent <= 90 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
          <strong>Note:</strong> YouTube API quota is running low. Consider
          limiting operations until the quota resets.
        </div>
      )}
    </div>
  );
}
