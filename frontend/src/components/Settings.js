"use client";

import { useState, useEffect } from "react";
import { processTranscripts, getDownloadUrl } from "../api/api";
import ProcessingProgress from "./ProcessingProgress";
import OutputDirectorySelector from "./OutputDirectorySelector";

export default function Settings({ videos, selectedVideos, channelData }) {
  const [language, setLanguage] = useState("en");
  const [outputType, setOutputType] = useState("token_limit");
  const [limitValue, setLimitValue] = useState(4000);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [filterHasTranscript, setFilterHasTranscript] = useState(false);
  const [outputDir, setOutputDir] = useState("");
  const [outputStyle, setOutputStyle] = useState("both");
  const [tokenLimit, setTokenLimit] = useState("");
  const [fileLimit, setFileLimit] = useState("");
  const [taskId, setTaskId] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [useCustomOutputStyle, setUseCustomOutputStyle] = useState(false);

  // Common language options
  const languageOptions = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh-cn", name: "Chinese (Simplified)" },
    { code: "zh-tw", name: "Chinese (Traditional)" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
  ];

  const handleProcess = async () => {
    if (selectedVideos.length === 0) {
      setError("Please select at least one video");
      return;
    }

    try {
      setError("");
      setProcessing(true);
      setResults(null);
      setShowResults(false);

      // Prepare parameters
      const params = {
        selectedVideos,
        language,
        outputType,
        limitValue: parseInt(limitValue),
        filterHasTranscript,
      };

      // Check if this is a single video request
      const isVideoUrl =
        selectedVideos.length === 1 && selectedVideos[0].isFromVideoUrl;
      params.isVideoUrl = isVideoUrl;

      // Use custom output style only if the toggle is on
      if (useCustomOutputStyle) {
        params.outputStyle = outputStyle;
      } else {
        // Default output style is "both" if not using custom settings
        params.outputStyle = "both";
      }

      // Add optional parameters only if they have values
      if (outputDir.trim()) {
        params.outputDir = outputDir.trim();
      }

      if (outputType === "both" && useCustomOutputStyle) {
        if (tokenLimit) params.tokenLimit = parseInt(tokenLimit);
        if (fileLimit) params.fileLimit = parseInt(fileLimit);
      }

      // Start the processing task
      const response = await processTranscripts(params);

      // Store the task ID for progress tracking
      if (response && response.task_id) {
        setTaskId(response.task_id);
      } else {
        throw new Error("No task ID returned from server");
      }
    } catch (err) {
      setError(err.error || "Failed to start processing");
      setProcessing(false);
    }
  };

  const handleProcessingComplete = (results) => {
    setResults(results);
    setProcessing(false);
    setShowResults(true);
  };

  const handleProcessingCancel = () => {
    setProcessing(false);
    setTaskId(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Processing Settings
      </h2>

      {processing && taskId ? (
        <ProcessingProgress
          taskId={taskId}
          onComplete={handleProcessingComplete}
          onCancel={handleProcessingCancel}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transcript Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select the language for the transcripts (English is default)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter Videos
            </label>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="filter-transcripts"
                checked={filterHasTranscript}
                onChange={(e) => setFilterHasTranscript(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
              <label
                htmlFor="filter-transcripts"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Only process videos with transcripts
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This will check each video for available transcripts before
              processing
            </p>
          </div>

          <div className="md:col-span-2">
            <OutputDirectorySelector />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-md transition-colors duration-200">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Output Style Settings
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Toggle to customize how transcripts are saved
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomOutputStyle}
                  onChange={(e) => setUseCustomOutputStyle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {useCustomOutputStyle ? "Custom" : "Default"}
                </span>
              </label>
            </div>
          </div>

          {useCustomOutputStyle && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Output Style
              </label>
              <select
                value={outputStyle}
                onChange={(e) => setOutputStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="individual">Individual Files</option>
                <option value="combined">Combined Files</option>
                <option value="both">Both Individual and Combined</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {outputStyle === "individual"
                  ? "Create one file per video"
                  : outputStyle === "combined"
                  ? "Combine videos into files based on limits"
                  : "Create both individual files and combined files"}
              </p>
            </div>
          )}

          {useCustomOutputStyle && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Type
                </label>
                <select
                  value={outputType}
                  onChange={(e) => setOutputType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="token_limit">Token Limit</option>
                  <option value="file_limit">File Limit</option>
                  <option value="both">Both Token and File Limits</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {outputType === "token_limit"
                    ? "Split output based on maximum tokens per file"
                    : outputType === "file_limit"
                    ? "Split output based on maximum number of files"
                    : "Apply both token and file limits"}
                </p>
              </div>

              {outputType !== "both" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {outputType === "token_limit"
                      ? "Maximum Tokens Per File"
                      : "Maximum Number of Files"}
                  </label>
                  <input
                    type="number"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    min={outputType === "token_limit" ? 1000 : 1}
                    max={outputType === "token_limit" ? 100000 : 100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {outputType === "token_limit"
                      ? "Recommended: 4000 for most AI services"
                      : "Maximum number of files to generate"}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Tokens Per File
                    </label>
                    <input
                      type="number"
                      value={tokenLimit}
                      onChange={(e) => setTokenLimit(e.target.value)}
                      min={1000}
                      max={100000}
                      placeholder="e.g., 4000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 4000 for most AI services
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Number of Files
                    </label>
                    <input
                      type="number"
                      value={fileLimit}
                      onChange={(e) => setFileLimit(e.target.value)}
                      min={1}
                      max={100}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of files to generate
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {!useCustomOutputStyle && (
            <div className="md:col-span-2">
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md transition-colors duration-200">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Using default output settings:
                </p>
                <ul className="list-disc pl-5 text-xs text-blue-600 dark:text-blue-300 mt-1">
                  <li>
                    Both individual files and combined files will be created
                  </li>
                  <li>
                    Token limit of 4000 tokens per file (recommended for most AI
                    services)
                  </li>
                  <li>Files will be saved to the Downloads folder</li>
                </ul>
              </div>
            </div>
          )}

          <div className="md:col-span-2 mt-4">
            <button
              onClick={handleProcess}
              disabled={processing || selectedVideos.length === 0}
              className={`w-full py-2 px-4 rounded-md text-white transition duration-200 ${
                processing || selectedVideos.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-red-700"
              }`}
            >
              {processing ? "Processing..." : "Process Selected Videos"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
      )}

      {showResults && results && (
        <div className="mt-8 border-t dark:border-gray-700 pt-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Processing Results
          </h3>

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
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded">
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
              <div className="space-y-2">
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

          {results.failed.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-gray-800 dark:text-white">
                Failed Videos:
              </h4>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {results.failed.map((video) => (
                  <p key={video.id}>
                    • {video.title} - {video.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => setShowResults(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Close Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
