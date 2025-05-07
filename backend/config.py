import os
import json
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-for-development')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')

    # YouTube API configuration
    YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '')
    YOUTUBE_QUOTA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'quota_info.json')
    YOUTUBE_DAILY_QUOTA = 10000  # Default daily quota for YouTube API

    # Output configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

    # Use Downloads folder in user's home directory as default output location
    USER_HOME = os.path.expanduser("~")
    DOWNLOADS_FOLDER = os.path.join(USER_HOME, 'Downloads')
    OUTPUT_FOLDER = DOWNLOADS_FOLDER if os.path.exists(DOWNLOADS_FOLDER) else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output')

    # Ensure directories exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    @classmethod
    def save_quota_info(cls, quota_info):
        """Save quota information to a file.

        Args:
            quota_info (dict): Quota information to save
        """
        with open(cls.YOUTUBE_QUOTA_FILE, 'w') as f:
            json.dump({
                'used_quota': quota_info['used_quota'],
                'last_reset': int(time.time()),
                'timestamp': int(time.time())
            }, f)

    @classmethod
    def load_quota_info(cls):
        """Load quota information from a file.

        Returns:
            dict: Quota information or default values if file doesn't exist
        """
        try:
            if os.path.exists(cls.YOUTUBE_QUOTA_FILE):
                with open(cls.YOUTUBE_QUOTA_FILE, 'r') as f:
                    data = json.load(f)
                return data
            else:
                return {
                    'used_quota': 0,
                    'last_reset': int(time.time()),
                    'timestamp': int(time.time())
                }
        except Exception as e:
            print(f"Error loading quota info: {e}")
            return {
                'used_quota': 0,
                'last_reset': int(time.time()),
                'timestamp': int(time.time())
            }
