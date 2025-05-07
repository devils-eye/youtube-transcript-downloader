"use client";

import { useState } from "react";
import { getLanguages, getTranscript } from "../api/api";

export default function VideoList({
  videos,
  onSelectVideos,
  selectedVideos,
  setSelectedVideos,
}) {
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [videoLanguages, setVideoLanguages] = useState({});
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [showOnlyWithTranscripts, setShowOnlyWithTranscripts] = useState(false);
  const [isCheckingTranscripts, setIsCheckingTranscripts] = useState(false);

  const toggleVideoSelection = (video) => {
    if (selectedVideos.some((v) => v.id === video.id)) {
      setSelectedVideos(selectedVideos.filter((v) => v.id !== video.id));
    } else {
      setSelectedVideos([...selectedVideos, video]);
    }
  };

  const selectAll = () => {
    setSelectedVideos([...videos]);
  };

  const deselectAll = () => {
    setSelectedVideos([]);
  };

  const toggleExpand = async (video) => {
    if (expandedVideo === video.id) {
      setExpandedVideo(null);
      return;
    }

    setExpandedVideo(video.id);

    if (!videoLanguages[video.id]) {
      try {
        setLoadingLanguages(true);
        const data = await getLanguages(video.id);
        setVideoLanguages({
          ...videoLanguages,
          [video.id]: data.languages,
        });
      } catch (error) {
        console.error("Failed to get languages:", error);
      } finally {
        setLoadingLanguages(false);
      }
    }
  };

  const loadTranscript = async (videoId, language = "en") => {
    try {
      setLoadingTranscript(true);
      const data = await getTranscript(videoId, language);
      setTranscript(data);
    } catch (error) {
      console.error("Failed to get transcript:", error);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const checkAllTranscripts = async () => {
    if (isCheckingTranscripts) return;

    try {
      setIsCheckingTranscripts(true);

      // Create a copy of the current state
      const newVideoLanguages = { ...videoLanguages };

      // Check transcripts for all videos that haven't been checked yet
      const uncheckedVideos = videos.filter(
        (video) => !videoLanguages[video.id]
      );

      // Process videos in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < uncheckedVideos.length; i += batchSize) {
        const batch = uncheckedVideos.slice(i, i + batchSize);

        // Process each video in the batch concurrently
        await Promise.all(
          batch.map(async (video) => {
            try {
              const data = await getLanguages(video.id);
              newVideoLanguages[video.id] = data.languages;
            } catch (error) {
              console.error(
                `Failed to get languages for video ${video.id}:`,
                error
              );
              newVideoLanguages[video.id] = [];
            }
          })
        );

        // Update state after each batch
        setVideoLanguages({ ...newVideoLanguages });
      }
    } catch (error) {
      console.error("Failed to check all transcripts:", error);
    } finally {
      setIsCheckingTranscripts(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {videos.length === 1 && videos[0].isFromVideoUrl
            ? "Video"
            : `Channel Videos (${videos.length})`}
        </h2>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <p className="text-gray-600 dark:text-gray-300">
          Selected {selectedVideos.length} of {videos.length} videos
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-with-transcripts"
              checked={showOnlyWithTranscripts}
              onChange={(e) => setShowOnlyWithTranscripts(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
            />
            <label
              htmlFor="show-with-transcripts"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Show only videos with transcripts
            </label>
          </div>

          <button
            onClick={checkAllTranscripts}
            disabled={isCheckingTranscripts}
            className={`px-3 py-1 text-sm rounded-md ${
              isCheckingTranscripts
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
            }`}
          >
            {isCheckingTranscripts ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Checking...
              </span>
            ) : (
              "Check All Transcripts"
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {(() => {
          const filteredVideos = videos.filter((video) => {
            // If filter is enabled, only show videos with transcripts
            if (showOnlyWithTranscripts) {
              return (
                videoLanguages[video.id] && videoLanguages[video.id].length > 0
              );
            }
            return true;
          });

          if (filteredVideos.length === 0) {
            return (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No videos match the current filter
                </p>
                {showOnlyWithTranscripts && (
                  <button
                    onClick={() => setShowOnlyWithTranscripts(false)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Show all videos
                  </button>
                )}
              </div>
            );
          }

          return filteredVideos.map((video) => (
            <div
              key={video.id}
              className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800 transition-colors duration-200"
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedVideos.some((v) => v.id === video.id)}
                  onChange={() => toggleVideoSelection(video)}
                  className="mt-1 h-5 w-5 text-primary dark:text-primary dark:bg-gray-700 dark:border-gray-600"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      {video.title}
                    </h3>
                    {videoLanguages[video.id] !== undefined &&
                      (videoLanguages[video.id] &&
                      videoLanguages[video.id].length > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                          Has Transcript
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                          No Transcript
                        </span>
                      ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Published:{" "}
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => toggleExpand(video)}
                      className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      {expandedVideo === video.id
                        ? "Hide Details"
                        : "Show Details"}
                    </button>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary dark:text-red-400 hover:underline"
                    >
                      Watch on YouTube
                    </a>
                  </div>

                  {expandedVideo === video.id && (
                    <div className="mt-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium mb-2 text-gray-800 dark:text-white">
                        Available Transcripts:
                      </h4>

                      {loadingLanguages ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Loading languages...
                        </p>
                      ) : videoLanguages[video.id] &&
                        videoLanguages[video.id].length > 0 ? (
                        <>
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              Transcripts Available
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {videoLanguages[video.id].map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() =>
                                  loadTranscript(video.id, lang.code)
                                }
                                className="text-left text-sm px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded transition-colors duration-150"
                              >
                                {lang.name}{" "}
                                {lang.is_generated ? "(Auto-generated)" : ""}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                              No Transcripts Available
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            This video does not have any transcripts
                          </p>
                        </>
                      )}

                      {loadingTranscript && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Loading transcript...
                        </p>
                      )}

                      {transcript && transcript.videoId === video.id && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2 text-gray-800 dark:text-white">
                            Transcript Preview:
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm max-h-40 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
                              {transcript.transcript.substring(0, 500)}...
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
