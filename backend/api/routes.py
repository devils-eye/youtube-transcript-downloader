from flask import Blueprint, request, jsonify, send_file
import os
import threading
import time
import uuid
from utils.youtube_api import YouTubeAPI
from utils.transcript import TranscriptProcessor
from config import Config

# Create Blueprint
api = Blueprint('api', __name__)

# Initialize services
youtube_api = YouTubeAPI()
transcript_processor = TranscriptProcessor()

# Store active processing tasks
active_tasks = {}

class ProcessingTask:
    def __init__(self, task_id):
        self.task_id = task_id
        self.progress = 0
        self.total = 0
        self.status = "Initializing..."
        self.results = None
        self.completed = False
        self.cancelled = False
        self.cancel_flag = {'cancelled': False}
        self.start_time = time.time()

    def update_progress(self, current, total, status):
        self.progress = current
        self.total = total
        self.status = status

    def get_info(self):
        elapsed_time = time.time() - self.start_time
        return {
            'task_id': self.task_id,
            'progress': self.progress,
            'total': self.total,
            'status': self.status,
            'percent': (self.progress / self.total * 100) if self.total > 0 else 0,
            'completed': self.completed,
            'cancelled': self.cancelled,
            'elapsed_seconds': int(elapsed_time)
        }

@api.route('/channel', methods=['POST'])
def process_channel():
    """Process a YouTube channel or video URL to extract videos."""
    data = request.json
    url = data.get('channelUrl')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    # Check if it's a video URL
    if youtube_api.is_video_url(url):
        # Extract video ID
        video_id = youtube_api.extract_video_id(url)

        if not video_id:
            return jsonify({'error': 'Could not extract video ID from URL'}), 400

        # Get video details
        try:
            # Track quota usage
            youtube_api._track_quota_usage('videos.list')

            # Get video details from YouTube API
            response = youtube_api.youtube.videos().list(
                part='snippet,contentDetails',
                id=video_id
            ).execute()

            if not response.get('items'):
                return jsonify({'error': 'Video not found'}), 404

            video_info = response['items'][0]

            # Format the video information
            video = {
                'id': video_id,
                'title': video_info['snippet']['title'],
                'description': video_info['snippet']['description'],
                'publishedAt': video_info['snippet']['publishedAt'],
                'thumbnails': video_info['snippet']['thumbnails'],
                'channelTitle': video_info['snippet']['channelTitle']  # Include channel title
            }

            # Get channel ID from the video
            channel_id = video_info['snippet']['channelId']

            # Return video information
            return jsonify({
                'channelId': channel_id,
                'videoCount': 1,
                'videos': [video],
                'isVideoUrl': True
            })

        except Exception as e:
            print(f"Error retrieving video details: {e}")
            return jsonify({'error': 'Failed to retrieve video details'}), 500

    # If it's a channel URL, process as before
    # Extract channel ID
    channel_id = youtube_api.extract_channel_id(url)

    if not channel_id:
        return jsonify({'error': 'Could not extract channel ID from URL'}), 400

    # Get channel videos
    videos = youtube_api.get_channel_videos(channel_id)

    if not videos:
        return jsonify({'error': 'No videos found for this channel'}), 404

    # Return video information
    return jsonify({
        'channelId': channel_id,
        'videoCount': len(videos),
        'videos': videos,
        'isVideoUrl': False
    })

@api.route('/languages/<video_id>', methods=['GET'])
def get_languages(video_id):
    """Get available transcript languages for a video."""
    languages = transcript_processor.get_available_languages(video_id)

    if not languages:
        return jsonify({'error': 'No transcripts available for this video'}), 404

    return jsonify({
        'videoId': video_id,
        'languages': languages
    })

@api.route('/transcript/<video_id>', methods=['GET'])
def get_transcript(video_id):
    """Get transcript for a single video."""
    language = request.args.get('language', 'en')

    transcript = transcript_processor.download_transcript(video_id, language)

    if not transcript:
        return jsonify({'error': 'Transcript not available'}), 404

    formatted_text = transcript_processor.format_transcript_text(transcript)

    return jsonify({
        'videoId': video_id,
        'language': language,
        'transcript': formatted_text
    })

@api.route('/process-transcripts', methods=['POST'])
def process_transcripts():
    """Start processing transcripts for multiple videos."""
    data = request.json
    videos = data.get('videos', [])
    language = data.get('language', 'en')
    output_type = data.get('outputType', 'token_limit')
    limit_value = data.get('limitValue', 4000)
    filter_has_transcript = data.get('filterHasTranscript', False)
    output_dir = data.get('outputDir')
    output_style = data.get('outputStyle', 'both')
    token_limit = data.get('tokenLimit')
    file_limit = data.get('fileLimit')
    is_single_video = data.get('isVideoUrl', False)

    if not videos:
        return jsonify({'error': 'No videos provided'}), 400

    # Create custom output directory if specified
    if output_dir:
        custom_dir = os.path.join(Config.OUTPUT_FOLDER, output_dir)
        os.makedirs(custom_dir, exist_ok=True)
    else:
        custom_dir = None

    # Create a new task
    task_id = str(uuid.uuid4())
    task = ProcessingTask(task_id)
    active_tasks[task_id] = task

    # Define the processing function to run in a thread
    def process_videos():
        try:
            # Process the transcripts with progress tracking
            results = transcript_processor.process_channel_transcripts(
                videos=videos,
                language_code=language,
                output_type=output_type,
                limit_value=limit_value,
                filter_has_transcript=filter_has_transcript,
                output_dir=custom_dir,
                output_style=output_style,
                token_limit=token_limit,
                file_limit=file_limit,
                progress_callback=task.update_progress,
                cancel_flag=task.cancel_flag,
                is_single_video=is_single_video
            )

            # Store the results
            task.results = results
            task.completed = True

            # Clean up old tasks (keep for 1 hour)
            cleanup_old_tasks()

        except Exception as e:
            print(f"Error processing transcripts: {e}")
            task.status = f"Error: {str(e)}"
            task.completed = True

    # Start the processing in a background thread
    thread = threading.Thread(target=process_videos)
    thread.daemon = True
    thread.start()

    # Return the task ID to the client
    return jsonify({
        'task_id': task_id,
        'status': 'processing'
    })

@api.route('/task/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get the status of a processing task."""
    task = active_tasks.get(task_id)

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    task_info = task.get_info()

    # Include results if the task is completed
    if task.completed and task.results:
        task_info['results'] = task.results

    return jsonify(task_info)

@api.route('/task/<task_id>/cancel', methods=['POST'])
def cancel_task(task_id):
    """Cancel a processing task."""
    task = active_tasks.get(task_id)

    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Set the cancel flag
    task.cancel_flag['cancelled'] = True
    task.cancelled = True
    task.status = "Cancelling..."

    return jsonify({
        'task_id': task_id,
        'status': 'cancelling'
    })

def cleanup_old_tasks():
    """Remove completed tasks that are older than 1 hour."""
    current_time = time.time()
    tasks_to_remove = []

    for task_id, task in active_tasks.items():
        if task.completed and (current_time - task.start_time) > 3600:  # 1 hour
            tasks_to_remove.append(task_id)

    for task_id in tasks_to_remove:
        del active_tasks[task_id]

@api.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
    """Download a processed transcript file."""
    file_path = os.path.join(Config.OUTPUT_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    return send_file(file_path, as_attachment=True)

@api.route('/quota', methods=['GET'])
def get_quota_info():
    """Get YouTube API quota information."""
    quota_info = youtube_api.get_quota_info()
    return jsonify(quota_info)

@api.route('/api-key', methods=['GET'])
def get_api_key_status():
    """Check if the API key is set from environment variables."""
    from_env = bool(os.environ.get('YOUTUBE_API_KEY', ''))
    return jsonify({
        'from_env': from_env
    })

@api.route('/api-key', methods=['POST'])
def set_api_key():
    """Set a custom YouTube API key."""
    data = request.json
    api_key = data.get('api_key')

    if not api_key:
        return jsonify({'error': 'No API key provided'}), 400

    try:
        # Update the YouTube API instance with the new key
        global youtube_api
        youtube_api = YouTubeAPI(api_key=api_key)

        # Update the transcript processor to use the new YouTube API instance
        global transcript_processor
        transcript_processor.youtube_api = youtube_api

        return jsonify({
            'status': 'success',
            'message': 'API key updated successfully'
        })
    except Exception as e:
        return jsonify({'error': f'Failed to set API key: {str(e)}'}), 500

@api.route('/output-dir', methods=['GET'])
def get_output_dir():
    """Get the default output directory."""
    return jsonify({
        'output_dir': Config.OUTPUT_FOLDER
    })

@api.route('/output-dir', methods=['POST'])
def set_output_dir():
    """Set a custom output directory."""
    data = request.json
    new_dir = data.get('output_dir')

    if not new_dir:
        return jsonify({'error': 'No directory provided'}), 400

    try:
        # Create the directory if it doesn't exist
        os.makedirs(new_dir, exist_ok=True)

        # Update the config
        Config.OUTPUT_FOLDER = new_dir

        return jsonify({
            'output_dir': Config.OUTPUT_FOLDER,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': f'Failed to set output directory: {str(e)}'}), 500
