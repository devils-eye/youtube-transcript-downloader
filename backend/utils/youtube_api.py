import re
import time
import googleapiclient.discovery
from googleapiclient.errors import HttpError
from config import Config

class YouTubeAPI:
    # YouTube API quota cost per operation
    # See: https://developers.google.com/youtube/v3/getting-started#quota
    QUOTA_COSTS = {
        'search.list': 100,
        'channels.list': 1,
        'playlistItems.list': 1,
        'videos.list': 1
    }

    def __init__(self, api_key=None):
        """Initialize the YouTube API client.

        Args:
            api_key (str, optional): YouTube Data API key. Defaults to None.
        """
        self.api_key = api_key or Config.YOUTUBE_API_KEY
        self.youtube = googleapiclient.discovery.build(
            'youtube', 'v3', developerKey=self.api_key
        )

        # Load quota information from file
        quota_info = Config.load_quota_info()
        self.quota_used_today = quota_info.get('used_quota', 0)
        self.last_quota_reset = quota_info.get('last_reset', int(time.time()))

    def is_video_url(self, url):
        """Check if the URL is a YouTube video URL.

        Args:
            url (str): YouTube URL to check

        Returns:
            bool: True if it's a video URL, False otherwise
        """
        video_patterns = [
            r'youtube\.com/watch\?v=([^&\s]+)',  # youtube.com/watch?v=VIDEO_ID
            r'youtu\.be/([^/\s]+)',              # youtu.be/VIDEO_ID
            r'youtube\.com/v/([^/\s]+)',         # youtube.com/v/VIDEO_ID
            r'youtube\.com/embed/([^/\s]+)'      # youtube.com/embed/VIDEO_ID
        ]

        for pattern in video_patterns:
            if re.search(pattern, url):
                return True

        return False

    def extract_video_id(self, video_url):
        """Extract video ID from a YouTube video URL.

        Args:
            video_url (str): YouTube video URL

        Returns:
            str: Video ID or None if not found
        """
        video_patterns = [
            r'youtube\.com/watch\?v=([^&\s]+)',  # youtube.com/watch?v=VIDEO_ID
            r'youtu\.be/([^/\s]+)',              # youtu.be/VIDEO_ID
            r'youtube\.com/v/([^/\s]+)',         # youtube.com/v/VIDEO_ID
            r'youtube\.com/embed/([^/\s]+)'      # youtube.com/embed/VIDEO_ID
        ]

        for pattern in video_patterns:
            match = re.search(pattern, video_url)
            if match:
                return match.group(1)

        return None

    def extract_channel_id(self, channel_url):
        """Extract channel ID from a YouTube channel URL.

        Args:
            channel_url (str): YouTube channel URL

        Returns:
            str: Channel ID or None if not found
        """
        # Handle different URL formats
        patterns = [
            r'youtube\.com/channel/([^/\s]+)',  # youtube.com/channel/UC...
            r'youtube\.com/c/([^/\s]+)',        # youtube.com/c/ChannelName
            r'youtube\.com/user/([^/\s]+)',     # youtube.com/user/Username
            r'youtube\.com/@([^/\s]+)'          # youtube.com/@HandleName
        ]

        for pattern in patterns:
            match = re.search(pattern, channel_url)
            if match:
                identifier = match.group(1)

                # If it's already a channel ID (starts with UC), return it
                if pattern == patterns[0] and identifier.startswith('UC'):
                    return identifier

                # Otherwise, we need to look up the channel ID
                return self._get_channel_id_by_custom_url(identifier, pattern)

        return None

    def _get_channel_id_by_custom_url(self, identifier, pattern_used):
        """Get channel ID from custom URL, username, or handle.

        Args:
            identifier (str): Channel identifier (custom URL, username, or handle)
            pattern_used (str): The regex pattern that matched

        Returns:
            str: Channel ID or None if not found
        """
        try:
            if 'user/' in pattern_used:
                # For username URLs
                self._track_quota_usage('channels.list')
                response = self.youtube.channels().list(
                    part='id',
                    forUsername=identifier
                ).execute()
            elif '@' in pattern_used:
                # For handle URLs, search for the channel
                self._track_quota_usage('search.list')
                response = self.youtube.search().list(
                    part='snippet',
                    q=f'@{identifier}',
                    type='channel',
                    maxResults=1
                ).execute()

                if response.get('items'):
                    return response['items'][0]['snippet']['channelId']
                return None
            else:
                # For custom URLs, search for the channel
                self._track_quota_usage('search.list')
                response = self.youtube.search().list(
                    part='snippet',
                    q=identifier,
                    type='channel',
                    maxResults=1
                ).execute()

                if response.get('items'):
                    return response['items'][0]['snippet']['channelId']
                return None

            # Extract channel ID from response
            if response.get('items'):
                return response['items'][0]['id']

            return None

        except HttpError as e:
            print(f"Error retrieving channel ID: {e}")
            return None

    def get_channel_videos(self, channel_id, max_results=None):
        """Get all videos from a YouTube channel.

        Args:
            channel_id (str): YouTube channel ID
            max_results (int, optional): Maximum number of videos to retrieve. Defaults to None (all videos).

        Returns:
            list: List of video information dictionaries
        """
        videos = []
        next_page_token = None

        try:
            # First, get channel details including upload playlist ID and channel title
            self._track_quota_usage('channels.list')
            response = self.youtube.channels().list(
                part='contentDetails,snippet',
                id=channel_id
            ).execute()

            if not response.get('items'):
                return []

            channel_item = response['items'][0]
            uploads_playlist_id = channel_item['contentDetails']['relatedPlaylists']['uploads']
            channel_title = channel_item['snippet']['title']

            # Then get videos from the uploads playlist
            while True:
                self._track_quota_usage('playlistItems.list')
                playlist_response = self.youtube.playlistItems().list(
                    part='snippet,contentDetails',
                    playlistId=uploads_playlist_id,
                    maxResults=50,  # API maximum
                    pageToken=next_page_token
                ).execute()

                for item in playlist_response.get('items', []):
                    video_info = {
                        'id': item['contentDetails']['videoId'],
                        'title': item['snippet']['title'],
                        'description': item['snippet']['description'],
                        'publishedAt': item['snippet']['publishedAt'],
                        'thumbnails': item['snippet']['thumbnails'],
                        'channelTitle': channel_title  # Add channel title to each video
                    }
                    videos.append(video_info)

                next_page_token = playlist_response.get('nextPageToken')

                if not next_page_token or (max_results and len(videos) >= max_results):
                    break

            # Limit results if max_results is specified
            if max_results:
                videos = videos[:max_results]

            return videos

        except HttpError as e:
            print(f"Error retrieving channel videos: {e}")
            return []

    def _track_quota_usage(self, operation):
        """Track YouTube API quota usage.

        Args:
            operation (str): The API operation being performed
        """
        # Check if we need to reset the daily quota (YouTube resets at midnight PST)
        current_time = int(time.time())
        seconds_in_day = 24 * 60 * 60

        # If it's been more than a day since the last reset, reset the quota
        if current_time - self.last_quota_reset >= seconds_in_day:
            self.quota_used_today = 0
            self.last_quota_reset = current_time

        # Add the cost of this operation to the quota
        cost = self.QUOTA_COSTS.get(operation, 1)  # Default to 1 if unknown
        self.quota_used_today += cost

        # Save quota information to file
        Config.save_quota_info({
            'used_quota': self.quota_used_today,
            'last_reset': self.last_quota_reset
        })

    def get_quota_info(self):
        """Get information about the YouTube API quota usage.

        Returns:
            dict: Quota information
        """
        # Check if we need to reset the daily quota
        current_time = int(time.time())
        seconds_in_day = 24 * 60 * 60

        if current_time - self.last_quota_reset >= seconds_in_day:
            self.quota_used_today = 0
            self.last_quota_reset = current_time

            # Save the reset quota information
            Config.save_quota_info({
                'used_quota': self.quota_used_today,
                'last_reset': self.last_quota_reset
            })

        # YouTube API has a daily quota from Config
        daily_quota = Config.YOUTUBE_DAILY_QUOTA
        remaining_quota = max(0, daily_quota - self.quota_used_today)

        # Calculate when the quota will reset (midnight PST)
        seconds_since_reset = current_time - self.last_quota_reset
        seconds_until_reset = seconds_in_day - seconds_since_reset

        # Format as hours and minutes
        hours_until_reset = seconds_until_reset // 3600
        minutes_until_reset = (seconds_until_reset % 3600) // 60

        return {
            'daily_quota': daily_quota,
            'used_quota': self.quota_used_today,
            'remaining_quota': remaining_quota,
            'quota_usage_percent': (self.quota_used_today / daily_quota) * 100 if daily_quota > 0 else 0,
            'hours_until_reset': hours_until_reset,
            'minutes_until_reset': minutes_until_reset,
            'reset_time_seconds': seconds_until_reset
        }
