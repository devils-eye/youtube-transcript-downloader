import os
import json
import shutil
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from config import Config

class TranscriptProcessor:
    def __init__(self):
        """Initialize the transcript processor."""
        self.text_formatter = TextFormatter()

    def get_available_languages(self, video_id):
        """Get available transcript languages for a video.

        Args:
            video_id (str): YouTube video ID

        Returns:
            list: List of available language dictionaries with 'code' and 'name'
        """
        try:
            # Use the correct static method from YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            languages = []

            # Process both manually created and auto-generated transcripts
            for transcript in transcript_list:
                languages.append({
                    'code': transcript.language_code,
                    'name': transcript.language,
                    'is_generated': transcript.is_generated
                })

            return languages
        except Exception as e:
            # Handle the specific error message for disabled subtitles
            error_str = str(e)
            if "Subtitles are disabled for this video" in error_str:
                print(f"Subtitles are disabled for video {video_id}")
            else:
                print(f"Error getting available languages for video {video_id}: {e}")
            return []

    def download_transcript(self, video_id, language_code='en'):
        """Download transcript for a video in the specified language.

        Args:
            video_id (str): YouTube video ID
            language_code (str, optional): Language code. Defaults to 'en'.

        Returns:
            dict: Transcript data or None if not available
        """
        try:
            # First check if the language is available
            available_languages = self.get_available_languages(video_id)

            # If no languages are available, return None early
            if not available_languages:
                return None

            language_codes = [lang['code'] for lang in available_languages]

            # If requested language is not available but other languages are, try to get the first available
            if language_code not in language_codes and language_codes:
                print(f"Language {language_code} not available for video {video_id}. Using {language_codes[0]} instead.")
                language_code = language_codes[0]
            elif not language_codes:
                # No languages available
                return None

            # Use the static method to get the transcript
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[language_code])
                return transcript
            except Exception as inner_e:
                # Try with the first available language as a fallback
                if language_code != language_codes[0] and language_codes:
                    print(f"Trying fallback language {language_codes[0]} for video {video_id}")
                    try:
                        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[language_codes[0]])
                        return transcript
                    except:
                        pass
                raise inner_e

        except Exception as e:
            error_str = str(e)
            if "Subtitles are disabled for this video" in error_str:
                print(f"Subtitles are disabled for video {video_id}")
            else:
                print(f"Error downloading transcript for video {video_id}: {e}")
            return None

    def format_transcript_text(self, transcript):
        """Format transcript as plain text.

        Args:
            transcript (list): Transcript data

        Returns:
            str: Formatted transcript text
        """
        return self.text_formatter.format_transcript(transcript)

    def process_channel_transcripts(self, videos, language_code='en', output_type='token_limit',
                               limit_value=4000, filter_has_transcript=False, output_dir=None,
                               output_style='both', token_limit=None, file_limit=None, progress_callback=None,
                               cancel_flag=None, is_single_video=False):
        """Process transcripts for all videos in a channel or a single video.

        Args:
            videos (list): List of video information dictionaries
            language_code (str, optional): Language code. Defaults to 'en'.
            output_type (str, optional): 'token_limit', 'file_limit', or 'both'. Defaults to 'token_limit'.
            limit_value (int, optional): Token count or file count limit. Defaults to 4000.
            filter_has_transcript (bool, optional): Only process videos with transcripts. Defaults to False.
            output_dir (str, optional): Custom output directory. Defaults to None (uses Config.OUTPUT_FOLDER).
            output_style (str, optional): 'individual', 'combined', or 'both'. Defaults to 'both'.
            token_limit (int, optional): Token limit when output_type is 'both'. Defaults to None.
            file_limit (int, optional): File limit when output_type is 'both'. Defaults to None.
            progress_callback (function, optional): Callback function to report progress. Defaults to None.
            cancel_flag (dict, optional): Dictionary with a 'cancelled' key to check for cancellation. Defaults to None.
            is_single_video (bool, optional): Whether this is a single video or a channel. Defaults to False.

        Returns:
            dict: Processing results with success and failure information
        """
        results = {
            'successful': [],
            'failed': [],
            'output_files': [],
            'warnings': [],
            'cancelled': False
        }

        # Set base output directory
        base_output_folder = output_dir if output_dir else Config.OUTPUT_FOLDER
        os.makedirs(base_output_folder, exist_ok=True)

        # For channels, create a subdirectory with the channel name
        if not is_single_video and videos and len(videos) > 0:
            # Get channel name from the first video (all videos should be from the same channel)
            channel_name = videos[0].get('channelTitle', 'channel')
            # Create a safe directory name
            safe_channel_name = ''.join(c if c.isalnum() or c in ' -_' else '_' for c in channel_name)
            safe_channel_name = safe_channel_name.strip()[:50]  # Limit length

            # Create channel directory
            output_folder = os.path.join(base_output_folder, safe_channel_name)
            os.makedirs(output_folder, exist_ok=True)
        else:
            # For single videos, use the base output folder
            output_folder = base_output_folder

        all_transcripts = []
        videos_with_transcripts = []
        total_videos = len(videos)
        processed_count = 0

        # Report initial progress
        if progress_callback:
            progress_callback(0, total_videos, "Checking for transcripts...")

        # First, check which videos have transcripts if filtering is enabled
        if filter_has_transcript:
            for i, video in enumerate(videos):
                # Check for cancellation
                if cancel_flag and cancel_flag.get('cancelled', False):
                    results['cancelled'] = True
                    if progress_callback:
                        progress_callback(i, total_videos, "Operation cancelled")
                    return results

                languages = self.get_available_languages(video['id'])
                if languages and any(lang['code'] == language_code for lang in languages):
                    videos_with_transcripts.append(video)

                # Report progress for transcript checking
                if progress_callback:
                    progress_callback(i + 1, total_videos, f"Checking transcripts ({i + 1}/{total_videos})...")

            # Update the videos list to only include those with transcripts
            videos = videos_with_transcripts

            # Reset progress for download phase
            if progress_callback:
                progress_callback(0, len(videos), "Starting transcript download...")

        # Download all available transcripts
        for i, video in enumerate(videos):
            # Check for cancellation
            if cancel_flag and cancel_flag.get('cancelled', False):
                results['cancelled'] = True
                if progress_callback:
                    progress_callback(i, len(videos), "Operation cancelled")
                return results

            # Update progress
            if progress_callback:
                progress_callback(i, len(videos), f"Processing video {i + 1} of {len(videos)}: {video['title']}")

            transcript = self.download_transcript(video['id'], language_code)

            if transcript:
                formatted_text = self.format_transcript_text(transcript)
                all_transcripts.append({
                    'video_id': video['id'],
                    'title': video['title'],
                    'transcript': formatted_text,
                    'token_count': self._estimate_token_count(formatted_text)
                })
                results['successful'].append({
                    'id': video['id'],
                    'title': video['title']
                })
            else:
                results['failed'].append({
                    'id': video['id'],
                    'title': video['title'],
                    'reason': 'Transcript not available'
                })

            processed_count += 1

        # Check for cancellation before file processing
        if cancel_flag and cancel_flag.get('cancelled', False):
            results['cancelled'] = True
            if progress_callback:
                progress_callback(processed_count, len(videos), "Operation cancelled")
            return results

        # Update progress for file processing phase
        if progress_callback:
            progress_callback(processed_count, len(videos), "Processing transcripts into files...")

        # Process according to whether this is a single video or a channel
        if is_single_video:
            # For a single video, just create one file
            if progress_callback:
                progress_callback(processed_count, len(videos), "Creating transcript file...")

            # Create a single file for the video
            if all_transcripts:
                transcript = all_transcripts[0]

                # Create a sanitized filename from the video title
                safe_title = ''.join(c if c.isalnum() or c in ' -_' else '_' for c in transcript['title'])
                safe_title = safe_title.strip()[:100]  # Limit length

                file_path = os.path.join(output_folder, f"{safe_title}_{transcript['video_id']}.txt")

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(f"### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n")
                    f.write(transcript['transcript'])

                results['output_files'].append({
                    'file_path': file_path,
                    'videos': [{
                        'id': transcript['video_id'],
                        'title': transcript['title']
                    }],
                    'token_count': transcript['token_count']
                })
        else:
            # For a channel, create files based on the output style
            # Default behavior for channels: create one big combined file AND individual files

            # Check for cancellation
            if cancel_flag and cancel_flag.get('cancelled', False):
                results['cancelled'] = True
                if progress_callback:
                    progress_callback(processed_count, len(videos), "Operation cancelled")
                return results

            # Create individual files for each video
            if output_style in ['individual', 'both']:
                if progress_callback:
                    progress_callback(processed_count, len(videos), "Creating individual files...")
                individual_files = self._process_individual_files(all_transcripts, output_folder)
                results['output_files'].extend(individual_files)

            # Check for cancellation before creating all-in-one file
            if cancel_flag and cancel_flag.get('cancelled', False):
                results['cancelled'] = True
                if progress_callback:
                    progress_callback(processed_count, len(videos), "Operation cancelled")
                return results

            # Always create a single combined file with all transcripts for channels
            if progress_callback:
                progress_callback(processed_count, len(videos), "Creating combined file with all transcripts...")
            all_in_one_file = self._create_all_in_one_file(all_transcripts, output_folder)
            results['output_files'].append(all_in_one_file)

            # If using custom output style, also create combined files based on output type
            if output_style in ['combined', 'both']:
                # Check for cancellation
                if cancel_flag and cancel_flag.get('cancelled', False):
                    results['cancelled'] = True
                    if progress_callback:
                        progress_callback(processed_count, len(videos), "Operation cancelled")
                    return results

                # Create combined files based on output type
                if output_type == 'token_limit':
                    if progress_callback:
                        progress_callback(processed_count, len(videos), "Creating token-limited files...")
                    combined_files = self._process_by_token_limit(all_transcripts, limit_value, output_folder)
                    results['output_files'].extend(combined_files)
                elif output_type == 'file_limit':
                    if progress_callback:
                        progress_callback(processed_count, len(videos), "Creating file-limited output...")
                    combined_files = self._process_by_file_limit(all_transcripts, limit_value, output_folder)
                    results['output_files'].extend(combined_files)
                elif output_type == 'both':
                    # Handle both token and file limits
                    if token_limit and file_limit:
                        if progress_callback:
                            progress_callback(processed_count, len(videos), "Processing with both token and file limits...")

                        # Calculate how many transcripts would be in each file with file limit
                        transcripts_per_file = max(1, len(all_transcripts) // file_limit)

                        # Check if any file would exceed token limit
                        excess_content = []
                        combined_files = []

                        for i in range(0, len(all_transcripts), transcripts_per_file):
                            # Check for cancellation
                            if cancel_flag and cancel_flag.get('cancelled', False):
                                results['cancelled'] = True
                                if progress_callback:
                                    progress_callback(processed_count, len(videos), "Operation cancelled")
                                return results

                            batch = all_transcripts[i:i + transcripts_per_file]
                            total_tokens = sum(t['token_count'] for t in batch)

                            if progress_callback:
                                progress_callback(processed_count, len(videos),
                                                f"Processing batch {i // transcripts_per_file + 1} of {(len(all_transcripts) + transcripts_per_file - 1) // transcripts_per_file}...")

                            if total_tokens > token_limit:
                                # This batch exceeds token limit
                                # Process normally with token limit
                                token_limited_files = self._process_batch_by_token_limit(
                                    batch, token_limit, output_folder, i // transcripts_per_file + 1
                                )
                                combined_files.extend(token_limited_files)

                                # Check if we've exceeded file limit
                                if len(combined_files) > file_limit:
                                    # Move excess content to a separate file
                                    excess_files = combined_files[file_limit:]
                                    combined_files = combined_files[:file_limit]

                                    # Combine excess files into one
                                    if progress_callback:
                                        progress_callback(processed_count, len(videos), "Processing excess content...")
                                    excess_content = self._combine_excess_files(excess_files, output_folder)
                                    results['warnings'].append(
                                        f"Content exceeded both token and file limits. Excess content saved to {excess_content['file_path']}"
                                    )
                                    break
                            else:
                                # This batch is within token limit
                                file_index = (i // transcripts_per_file) + 1
                                file_path = os.path.join(output_folder, f'combined_part_{file_index}.txt')

                                content = ''
                                videos = []
                                token_count = 0

                                for transcript in batch:
                                    videos.append({
                                        'id': transcript['video_id'],
                                        'title': transcript['title']
                                    })
                                    content += f"\n\n### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n"
                                    content += transcript['transcript']
                                    token_count += transcript['token_count']

                                with open(file_path, 'w', encoding='utf-8') as f:
                                    f.write(content)

                                combined_files.append({
                                    'file_path': file_path,
                                    'videos': videos,
                                    'token_count': token_count
                                })

                        if excess_content:
                            combined_files.append(excess_content)

                        results['output_files'].extend(combined_files)
                    else:
                        # If either token_limit or file_limit is missing, default to token_limit
                        if progress_callback:
                            progress_callback(processed_count, len(videos), "Creating token-limited files (default)...")
                        combined_files = self._process_by_token_limit(all_transcripts, limit_value, output_folder)
                        results['output_files'].extend(combined_files)

        # Final progress update
        if progress_callback:
            progress_callback(len(videos), len(videos), "Processing complete!")

        return results

    def _estimate_token_count(self, text):
        """Estimate token count for a text.

        Args:
            text (str): Input text

        Returns:
            int: Estimated token count
        """
        # Simple estimation: ~4 characters per token on average
        return len(text) // 4

    def _process_by_token_limit(self, transcripts, token_limit, output_folder=None):
        """Process transcripts by token limit.

        Args:
            transcripts (list): List of transcript dictionaries
            token_limit (int): Maximum tokens per file
            output_folder (str, optional): Output directory. Defaults to Config.OUTPUT_FOLDER.

        Returns:
            list: Output file information
        """
        folder = output_folder if output_folder else Config.OUTPUT_FOLDER
        output_files = []
        current_file = {
            'videos': [],
            'content': '',
            'token_count': 0,
            'file_path': ''
        }
        file_index = 1

        # Set a hard maximum token limit per file (except for all-in-one file)
        # This is to prevent files from becoming too large
        MAX_TOKENS_PER_FILE = 150000

        # Use the smaller of the user-specified limit and the hard maximum
        effective_token_limit = min(token_limit, MAX_TOKENS_PER_FILE)

        for transcript in transcripts:
            # Special case: if a single transcript exceeds the token limit
            if transcript['token_count'] > effective_token_limit:
                # If we already have content in the current file, save it first
                if current_file['videos']:
                    file_path = os.path.join(folder, f'combined_part_{file_index}.txt')
                    current_file['file_path'] = file_path

                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(current_file['content'])

                    output_files.append({
                        'file_path': file_path,
                        'videos': current_file['videos'],
                        'token_count': current_file['token_count']
                    })

                    # Start a new file
                    file_index += 1
                    current_file = {
                        'videos': [],
                        'content': '',
                        'token_count': 0,
                        'file_path': ''
                    }

                # Create a separate file for this large transcript
                file_path = os.path.join(folder, f'large_video_{transcript["video_id"]}.txt')

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(f"### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n")
                    f.write(transcript['transcript'])

                output_files.append({
                    'file_path': file_path,
                    'videos': [{
                        'id': transcript['video_id'],
                        'title': transcript['title']
                    }],
                    'token_count': transcript['token_count']
                })

                # Continue to the next transcript
                continue

            # If adding this transcript would exceed the token limit, save current file and start a new one
            if current_file['token_count'] + transcript['token_count'] > effective_token_limit and current_file['videos']:
                file_path = os.path.join(folder, f'combined_part_{file_index}.txt')
                current_file['file_path'] = file_path

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(current_file['content'])

                output_files.append({
                    'file_path': file_path,
                    'videos': current_file['videos'],
                    'token_count': current_file['token_count']
                })

                # Start a new file
                file_index += 1
                current_file = {
                    'videos': [],
                    'content': '',
                    'token_count': 0,
                    'file_path': ''
                }

            # Add transcript to current file
            current_file['videos'].append({
                'id': transcript['video_id'],
                'title': transcript['title']
            })
            current_file['content'] += f"\n\n### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n"
            current_file['content'] += transcript['transcript']
            current_file['token_count'] += transcript['token_count']

        # Save the last file if it has content
        if current_file['videos']:
            file_path = os.path.join(folder, f'combined_part_{file_index}.txt')
            current_file['file_path'] = file_path

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(current_file['content'])

            output_files.append({
                'file_path': file_path,
                'videos': current_file['videos'],
                'token_count': current_file['token_count']
            })

        return output_files

    def _process_by_file_limit(self, transcripts, file_limit, output_folder=None):
        """Process transcripts by file limit.

        Args:
            transcripts (list): List of transcript dictionaries
            file_limit (int): Maximum number of files (not a target, just a limit)
            output_folder (str, optional): Output directory. Defaults to Config.OUTPUT_FOLDER.

        Returns:
            list: Output file information
        """
        if not transcripts:
            return []

        folder = output_folder if output_folder else Config.OUTPUT_FOLDER

        # Set a hard maximum token limit per file
        MAX_TOKENS_PER_FILE = 150000
        output_files = []

        # First, try to distribute content efficiently without exceeding file_limit
        # Start with one transcript per file and then combine if needed

        # Step 1: Group transcripts that are too small on their own
        # This helps avoid creating too many tiny files
        grouped_transcripts = []
        current_group = []
        current_group_tokens = 0

        # Sort transcripts by size (largest first) to optimize distribution
        sorted_transcripts = sorted(transcripts, key=lambda t: t['token_count'], reverse=True)

        for transcript in sorted_transcripts:
            # If this transcript is large enough on its own or would exceed the token limit
            if transcript['token_count'] > 10000 or current_group_tokens + transcript['token_count'] > MAX_TOKENS_PER_FILE:
                # If we have a current group, add it to grouped_transcripts
                if current_group:
                    grouped_transcripts.append({
                        'transcripts': current_group,
                        'token_count': current_group_tokens
                    })
                    current_group = []
                    current_group_tokens = 0

                # Add this transcript as its own group
                if transcript['token_count'] > 0:  # Skip empty transcripts
                    grouped_transcripts.append({
                        'transcripts': [transcript],
                        'token_count': transcript['token_count']
                    })
            else:
                # Add to current group
                current_group.append(transcript)
                current_group_tokens += transcript['token_count']

        # Add any remaining group
        if current_group:
            grouped_transcripts.append({
                'transcripts': current_group,
                'token_count': current_group_tokens
            })

        # Step 2: If we have more groups than file_limit, combine smaller groups
        if len(grouped_transcripts) > file_limit:
            # Sort groups by token count (smallest first)
            grouped_transcripts.sort(key=lambda g: g['token_count'])

            # Combine groups until we're within the file limit
            while len(grouped_transcripts) > file_limit:
                # Take the two smallest groups
                if len(grouped_transcripts) >= 2:
                    smallest = grouped_transcripts.pop(0)
                    second_smallest = grouped_transcripts.pop(0)

                    # Combine them if the total is under the token limit
                    combined_tokens = smallest['token_count'] + second_smallest['token_count']
                    if combined_tokens <= MAX_TOKENS_PER_FILE:
                        combined_group = {
                            'transcripts': smallest['transcripts'] + second_smallest['transcripts'],
                            'token_count': combined_tokens
                        }
                        grouped_transcripts.append(combined_group)
                        # Re-sort the list
                        grouped_transcripts.sort(key=lambda g: g['token_count'])
                    else:
                        # If combining would exceed token limit, keep the larger one and discard the smaller
                        grouped_transcripts.append(second_smallest)
                else:
                    # Not enough groups to combine
                    break

        # Step 3: Create files from the grouped transcripts
        for i, group in enumerate(grouped_transcripts):
            file_index = i + 1
            file_path = os.path.join(folder, f'combined_part_{file_index}.txt')

            content = ''
            videos = []
            token_count = 0

            for transcript in group['transcripts']:
                videos.append({
                    'id': transcript['video_id'],
                    'title': transcript['title']
                })
                content += f"\n\n### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n"
                content += transcript['transcript']
                token_count += transcript['token_count']

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            output_files.append({
                'file_path': file_path,
                'videos': videos,
                'token_count': token_count
            })

        return output_files

    def _process_individual_files(self, transcripts, output_folder):
        """Create individual files for each video transcript.

        Args:
            transcripts (list): List of transcript dictionaries
            output_folder (str): Output directory

        Returns:
            list: Output file information
        """
        output_files = []

        for transcript in transcripts:
            # Create a sanitized filename from the video title
            safe_title = ''.join(c if c.isalnum() or c in ' -_' else '_' for c in transcript['title'])
            safe_title = safe_title.strip()[:100]  # Limit length

            file_path = os.path.join(output_folder, f"{safe_title}_{transcript['video_id']}.txt")

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(f"### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n")
                f.write(transcript['transcript'])

            output_files.append({
                'file_path': file_path,
                'videos': [{
                    'id': transcript['video_id'],
                    'title': transcript['title']
                }],
                'token_count': transcript['token_count']
            })

        return output_files

    def _create_all_in_one_file(self, transcripts, output_folder):
        """Create a single file with all transcripts.

        Args:
            transcripts (list): List of transcript dictionaries
            output_folder (str): Output directory

        Returns:
            dict: Output file information
        """
        if not transcripts:
            return None

        file_path = os.path.join(output_folder, 'all_transcripts.txt')
        content = ''
        videos = []
        token_count = 0

        for transcript in transcripts:
            videos.append({
                'id': transcript['video_id'],
                'title': transcript['title']
            })
            content += f"\n\n### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n"
            content += transcript['transcript']
            token_count += transcript['token_count']

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return {
            'file_path': file_path,
            'videos': videos,
            'token_count': token_count
        }

    def _process_batch_by_token_limit(self, batch, token_limit, output_folder, start_index=1):
        """Process a batch of transcripts by token limit.

        Args:
            batch (list): List of transcript dictionaries
            token_limit (int): Maximum tokens per file
            output_folder (str): Output directory
            start_index (int, optional): Starting file index. Defaults to 1.

        Returns:
            list: Output file information
        """
        output_files = []
        current_file = {
            'videos': [],
            'content': '',
            'token_count': 0,
            'file_path': ''
        }
        file_index = start_index

        for transcript in batch:
            # If adding this transcript would exceed the token limit, save current file and start a new one
            if current_file['token_count'] + transcript['token_count'] > token_limit and current_file['videos']:
                file_path = os.path.join(output_folder, f'combined_part_{file_index}.txt')
                current_file['file_path'] = file_path

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(current_file['content'])

                output_files.append({
                    'file_path': file_path,
                    'videos': current_file['videos'],
                    'token_count': current_file['token_count']
                })

                # Start a new file
                file_index += 1
                current_file = {
                    'videos': [],
                    'content': '',
                    'token_count': 0,
                    'file_path': ''
                }

            # Add transcript to current file
            current_file['videos'].append({
                'id': transcript['video_id'],
                'title': transcript['title']
            })
            current_file['content'] += f"\n\n### VIDEO: {transcript['title']} (ID: {transcript['video_id']})\n\n"
            current_file['content'] += transcript['transcript']
            current_file['token_count'] += transcript['token_count']

        # Save the last file if it has content
        if current_file['videos']:
            file_path = os.path.join(output_folder, f'combined_part_{file_index}.txt')
            current_file['file_path'] = file_path

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(current_file['content'])

            output_files.append({
                'file_path': file_path,
                'videos': current_file['videos'],
                'token_count': current_file['token_count']
            })

        return output_files

    def _combine_excess_files(self, excess_files, output_folder):
        """Combine excess files into a single file.

        Args:
            excess_files (list): List of file information dictionaries
            output_folder (str): Output directory

        Returns:
            dict: Output file information
        """
        if not excess_files:
            return None

        file_path = os.path.join(output_folder, 'excess_content.txt')
        content = ''
        videos = []
        token_count = 0

        for file_info in excess_files:
            videos.extend(file_info['videos'])

            # Read the content from the file
            with open(file_info['file_path'], 'r', encoding='utf-8') as f:
                file_content = f.read()

            content += file_content + "\n\n"
            token_count += file_info['token_count']

            # Remove the original file
            try:
                os.remove(file_info['file_path'])
            except Exception as e:
                print(f"Error removing file {file_info['file_path']}: {e}")

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return {
            'file_path': file_path,
            'videos': videos,
            'token_count': token_count
        }
