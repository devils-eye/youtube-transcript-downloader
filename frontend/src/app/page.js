"use client";

import { useState } from "react";
import ChannelForm from "../components/ChannelForm";
import VideoList from "../components/VideoList";
import Settings from "../components/Settings";
import QuotaDisplay from "../components/QuotaDisplay";
import Navbar from "../components/Navbar";

export default function Home({
  darkMode: initialDarkMode,
  setDarkMode: parentSetDarkMode,
}) {
  const [loading, setLoading] = useState(false);
  const [channelData, setChannelData] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [darkMode, setDarkMode] = useState(initialDarkMode || false);

  // Function to handle dark mode changes and propagate to parent
  const handleDarkModeChange = (newMode) => {
    setDarkMode(newMode);
    if (parentSetDarkMode) {
      parentSetDarkMode(newMode);
    }
  };

  const handleChannelProcessed = (data) => {
    // Add isFromVideoUrl flag to videos if this was a video URL request
    if (data.isVideoUrl) {
      data.videos = data.videos.map((video) => ({
        ...video,
        isFromVideoUrl: true,
      }));
    }

    setChannelData(data);

    // If it's a single video, automatically select it
    if (data.isVideoUrl && data.videos.length === 1) {
      setSelectedVideos(data.videos);
    } else {
      setSelectedVideos([]); // Reset selected videos when new channel is processed
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar darkMode={darkMode} setDarkMode={handleDarkModeChange} />

      <div className="container mx-auto px-4 py-4 space-y-8">
        {/* API Quota Display */}
        <div className="max-w-3xl mx-auto mb-4">
          <QuotaDisplay />
        </div>

        <section className="mb-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
              YouTube Transcript Downloader
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Download transcripts from YouTube videos for RAG or AI training.
              Paste a YouTube channel URL or video URL to get started.
            </p>
          </div>

          <ChannelForm
            onChannelProcessed={handleChannelProcessed}
            setLoading={setLoading}
          />
        </section>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-300">
              Processing...
            </p>
          </div>
        )}

        {channelData && !loading && (
          <section className="space-y-8">
            <VideoList
              videos={channelData.videos}
              selectedVideos={selectedVideos}
              setSelectedVideos={setSelectedVideos}
            />

            <Settings
              videos={channelData.videos}
              selectedVideos={selectedVideos}
              channelData={channelData}
            />
          </section>
        )}
      </div>
    </div>
  );
}
