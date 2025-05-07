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

  // Determine if this is a single video request
  const isSingleVideo = channelData && channelData.isVideoUrl;

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

      // Set output style based on video type and user preferences
      if (isVideoUrl) {
        // For single video, always use "individual" style (one file)
        params.outputStyle = "individual";
      } else {
        // For channels, use custom style if enabled, otherwise default to "both"
        params.outputStyle = useCustomOutputStyle ? outputStyle : "both";
      }

      // Add optional parameters only if they have values
      if (outputDir.trim()) {
        params.outputDir = outputDir.trim();
      }

      // Add token and file limits if applicable
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

          {/* Output Options Section */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-md font-medium text-gray-800 dark:text-gray-100">
                    Output Options
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isSingleVideo
                      ? "Configure how the transcript will be saved"
                      : "Configure how multiple transcripts will be organized"}
                  </p>
                </div>

                {!isSingleVideo && (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomOutputStyle}
                      onChange={(e) =>
                        setUseCustomOutputStyle(e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                      {useCustomOutputStyle ? "Custom" : "Default"}
                    </span>
                  </label>
                )}
              </div>

              {/* Single Video Output Info */}
              {isSingleVideo && (
                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md transition-colors duration-200 mb-3">
                  <p className="text-sm text-blue-700 dark:text-blue-200 font-medium">
                    Single Video Output
                  </p>
                  <ul className="list-disc pl-5 text-xs text-blue-600 dark:text-blue-300 mt-1">
                    <li>One text file will be created for this video</li>
                    <li>The file will be named after the video title</li>
                    <li>
                      The file will be saved directly in your Downloads folder
                    </li>
                    <li>No token limit is applied to single video downloads</li>
                  </ul>
                </div>
              )}

              {/* Channel Default Output Info */}
              {!isSingleVideo && !useCustomOutputStyle && (
                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md transition-colors duration-200">
                  <p className="text-sm text-blue-700 dark:text-blue-200 font-medium">
                    Default Channel Output
                  </p>
                  <ul className="list-disc pl-5 text-xs text-blue-600 dark:text-blue-300 mt-1">
                    <li>Individual files will be created for each video</li>
                    <li>
                      One combined file with all transcripts will be created
                    </li>
                    <li>
                      Token limit of 4000 tokens per file (max 150K per file)
                    </li>
                    <li>
                      Files will be saved in a folder named after the channel
                    </li>
                    <li>
                      The channel folder will be created in your Downloads
                      directory
                    </li>
                  </ul>
                </div>
              )}

              {/* Custom Output Options for Channels */}
              {!isSingleVideo && useCustomOutputStyle && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output Style
                    </label>
                    <select
                      value={outputStyle}
                      onChange={(e) => setOutputStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="individual">Individual Files Only</option>
                      <option value="combined">Combined Files Only</option>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Output Type
                    </label>
                    <select
                      value={outputType}
                      onChange={(e) => setOutputType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="token_limit">Token Limit</option>
                      <option value="file_limit">File Limit</option>
                      <option value="both">Both Token and File Limits</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {outputType === "token_limit"
                        ? "Split output based on maximum tokens per file"
                        : outputType === "file_limit"
                        ? "Split output based on maximum number of files"
                        : "Apply both token and file limits"}
                    </p>
                  </div>

                  {outputType !== "both" ? (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {outputType === "token_limit"
                          ? "Recommended: 4000 for most AI services (max 150K)"
                          : "Maximum number of files (not a target, just a limit)"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Maximum Tokens Per File
                        </label>
                        <input
                          type="number"
                          value={tokenLimit}
                          onChange={(e) => setTokenLimit(e.target.value)}
                          min={1000}
                          max={100000}
                          placeholder="e.g., 4000"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Recommended: 4000 for most AI services (max 150K)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Maximum Number of Files
                        </label>
                        <input
                          type="number"
                          value={fileLimit}
                          onChange={(e) => setFileLimit(e.target.value)}
                          min={1}
                          max={100}
                          placeholder="e.g., 5"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Maximum number of files (not a target, just a limit)
                        </p>
                      </div>

                      <div className="md:col-span-2 mt-2">
                        <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-md">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>Note:</strong> When both limits are set, the
                            system will:
                          </p>
                          <ol className="list-decimal pl-5 text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                            <li>First try to respect the file limit</li>
                            <li>
                              Then check if any file exceeds the token limit
                            </li>
                            <li>
                              If needed, split files to respect both limits
                            </li>
                            <li>
                              If impossible, excess content will be saved to a
                              separate file
                            </li>
                          </ol>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

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

            {/* Output Summary */}
            {results.output_files.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-2">
                  Output Summary
                </h4>

                {(() => {
                  // Count different types of files
                  const singleFiles = results.output_files.filter(
                    (file) =>
                      file.videos.length === 1 &&
                      !file.file_path.includes("combined_part_") &&
                      !file.file_path.includes("all_transcripts")
                  ).length;

                  const combinedFiles = results.output_files.filter((file) =>
                    file.file_path.includes("combined_part_")
                  ).length;

                  const hasAllInOne = results.output_files.some((file) =>
                    file.file_path.includes("all_transcripts")
                  );

                  const hasExcess = results.output_files.some((file) =>
                    file.file_path.includes("excess_content")
                  );

                  // Calculate total token count
                  const totalTokens = results.output_files.reduce(
                    (sum, file) => sum + file.token_count,
                    0
                  );

                  return (
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <p>
                        <span className="font-medium">Total Files:</span>{" "}
                        {results.output_files.length}
                      </p>
                      <p>
                        <span className="font-medium">Total Tokens:</span> ~
                        {totalTokens.toLocaleString()}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {singleFiles > 0 && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                            {singleFiles} Individual File
                            {singleFiles !== 1 ? "s" : ""}
                          </span>
                        )}

                        {combinedFiles > 0 && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                            {combinedFiles} Combined File
                            {combinedFiles !== 1 ? "s" : ""}
                          </span>
                        )}

                        {hasAllInOne && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                            Complete Collection
                          </span>
                        )}

                        {hasExcess && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                            Excess Content
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
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

              {/* Group files by type for better organization */}
              {(() => {
                // Identify single files (with one video)
                const singleFiles = results.output_files.filter(
                  (file) =>
                    file.videos.length === 1 &&
                    !file.file_path.includes("combined_part_") &&
                    !file.file_path.includes("all_transcripts")
                );

                // Identify combined files
                const combinedFiles = results.output_files.filter((file) =>
                  file.file_path.includes("combined_part_")
                );

                // Identify the all-in-one file
                const allInOneFile = results.output_files.find((file) =>
                  file.file_path.includes("all_transcripts")
                );

                // Identify excess content file
                const excessFile = results.output_files.find((file) =>
                  file.file_path.includes("excess_content")
                );

                return (
                  <div className="space-y-4">
                    {/* Single Files Section */}
                    {singleFiles.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-600 pb-1">
                          Individual Video Files ({singleFiles.length})
                        </h5>
                        <div className="space-y-2">
                          {singleFiles.map((file, index) => {
                            const filename = file.file_path.split("/").pop();
                            return (
                              <div
                                key={`single-${index}`}
                                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-200"
                              >
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">
                                    {filename}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {file.videos[0].title} | ~{file.token_count}{" "}
                                    tokens
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

                    {/* Combined Files Section */}
                    {combinedFiles.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-600 pb-1">
                          Combined Files ({combinedFiles.length})
                        </h5>
                        <div className="space-y-2">
                          {combinedFiles.map((file, index) => {
                            const filename = file.file_path.split("/").pop();
                            return (
                              <div
                                key={`combined-${index}`}
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

                    {/* All-in-one File Section */}
                    {allInOneFile && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-600 pb-1">
                          Complete Collection
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900 rounded transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                {allInOneFile.file_path.split("/").pop()}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Contains all {allInOneFile.videos.length} videos
                                | ~{allInOneFile.token_count} tokens
                              </p>
                            </div>
                            <a
                              href={getDownloadUrl(
                                allInOneFile.file_path.split("/").pop()
                              )}
                              download
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Excess Content File Section */}
                    {excessFile && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-600 pb-1">
                          Excess Content
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900 rounded transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                {excessFile.file_path.split("/").pop()}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Contains {excessFile.videos.length} videos | ~
                                {excessFile.token_count} tokens
                              </p>
                              <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                This file contains content that exceeded the
                                specified limits
                              </p>
                            </div>
                            <a
                              href={getDownloadUrl(
                                excessFile.file_path.split("/").pop()
                              )}
                              download
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
