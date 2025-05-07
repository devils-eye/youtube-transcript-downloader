# YouTube Transcript Downloader

A web application that allows users to download transcripts from YouTube videos for RAG (Retrieval-Augmented Generation) or AI training purposes.

## Features

- Extract channel ID from YouTube channel URL
- Fetch all videos from a YouTube channel
- Download transcripts for selected videos
- Select preferred language for transcripts
- Choose output format based on token limit or file limit
- View processing results and download transcript files

## Project Structure

The project consists of two main parts:

1. **Backend**: Flask API for YouTube data retrieval and transcript processing
2. **Frontend**: Next.js web application for user interface

## Prerequisites

- Python 3.8+
- Node.js 16+
- YouTube Data API key

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\\Scripts\\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the backend directory with your YouTube API key:
   ```
   FLASK_APP=app.py
   FLASK_DEBUG=True
   SECRET_KEY=your-secret-key-here
   YOUTUBE_API_KEY=your-youtube-api-key-here
   ```

6. Run the Flask application:
   ```
   flask run
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a YouTube channel URL in the form
2. Select the videos you want to download transcripts for
3. Choose your preferred language and output format
4. Click "Process Selected Videos"
5. Download the generated transcript files

## API Endpoints

- `POST /api/channel`: Process a YouTube channel URL
- `GET /api/languages/{video_id}`: Get available transcript languages for a video
- `GET /api/transcript/{video_id}`: Get transcript for a single video
- `POST /api/process-transcripts`: Process transcripts for multiple videos
- `GET /api/download/{filename}`: Download a processed transcript file

## Technologies Used

- **Backend**:
  - Flask (Python web framework)
  - YouTube Data API (for channel and video data)
  - YouTube Transcript API (for transcript downloading)

- **Frontend**:
  - Next.js (React framework)
  - Tailwind CSS (styling)
  - Axios (API requests)

## License

This project is for educational purposes only. Use responsibly and in accordance with YouTube's terms of service.

## Disclaimer

This tool is not affiliated with, authorized, maintained, sponsored, or endorsed by YouTube or any of its affiliates or subsidiaries.
