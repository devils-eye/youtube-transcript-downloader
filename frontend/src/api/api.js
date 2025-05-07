import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const processChannel = async (channelUrl) => {
  try {
    const response = await api.post("/channel", { channelUrl });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to process channel" };
  }
};

export const getLanguages = async (videoId) => {
  try {
    const response = await api.get(`/languages/${videoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get languages" };
  }
};

export const getTranscript = async (videoId, language = "en") => {
  try {
    const response = await api.get(
      `/transcript/${videoId}?language=${language}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get transcript" };
  }
};

export const processTranscripts = async (params) => {
  try {
    const {
      selectedVideos,
      language = "en",
      outputType = "token_limit",
      limitValue = 4000,
      filterHasTranscript = false,
      outputDir = null,
      outputStyle = "both",
      tokenLimit = null,
      fileLimit = null,
    } = params;

    const response = await api.post("/process-transcripts", {
      videos: selectedVideos,
      language,
      outputType,
      limitValue,
      filterHasTranscript,
      outputDir,
      outputStyle,
      tokenLimit,
      fileLimit,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to process transcripts" };
  }
};

export const getTaskStatus = async (taskId) => {
  try {
    const response = await api.get(`/task/${taskId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get task status" };
  }
};

export const cancelTask = async (taskId) => {
  try {
    const response = await api.post(`/task/${taskId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to cancel task" };
  }
};

export const getOutputDirectory = async () => {
  try {
    const response = await api.get("/output-dir");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get output directory" };
  }
};

export const setOutputDirectory = async (outputDir) => {
  try {
    const response = await api.post("/output-dir", { output_dir: outputDir });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to set output directory" };
  }
};

export const getDownloadUrl = (filename) => {
  return `${API_URL}/download/${filename}`;
};

export const getQuotaInfo = async () => {
  try {
    const response = await api.get("/quota");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get quota information" };
  }
};

export const getApiKeyStatus = async () => {
  try {
    const response = await api.get("/api-key");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get API key status" };
  }
};

export const setApiKey = async (apiKey) => {
  try {
    const response = await api.post("/api-key", { api_key: apiKey });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to set API key" };
  }
};

export default api;
