import os
import json
import time
import subprocess
import tempfile

def time_to_seconds(time_str: str) -> int:
    try:
        parts = list(map(int, str(time_str).split(':')))
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return int(parts[0])
    except Exception:
        return 0

def get_video_duration(file_path: str) -> float:
    """Mendapatkan durasi asli video dalam detik via ffprobe"""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return float(res.stdout.strip())
    except Exception:
        return 30.0

def download_video_stream(youtube_url: str, output_path: str) -> str:
    """Mengunduh video mentah utuh via yt-dlp di server Cloud"""
    cmd = [
        "yt-dlp",
        "--no-warnings",
        "--no-playlist",
        "--progress",
        "--extractor-args", "youtube:player_client=android,web",
        "-f", "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best",
        "-o", output_path,
        youtube_url
    ]
    
    res = subprocess.run(cmd)
    if res.returncode != 0 or not os.path.exists(output_path):
        raise Exception("Gagal mengunduh stream video di cloud via yt-dlp.")
    return output_path

async def execute_remotion_render(video_path: str, start_time: str, end_time: str, hook_text: str, clip_id: int, clips_data: list = None) -> str:
    """Sarah: Headless Cloud FFmpeg Engine untuk Perenderan Shorts 9:16 Vertical secara Online"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, "outputs")
    temp_dir = os.path.join(output_dir, f"temp_{clip_id}")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)
    
    final_output_file = os.path.join(output_dir, f"short_clip_{clip_id}.mp4")
    raw_full_video = os.path.join(temp_dir, "raw_source.mp4")

    # 1. UNDUH VIDEO UTAMA KE CLOUD SERVER
    try:
        if not os.path.exists(raw_full_video):
            print(f"📥 [Cloud Engine] Mengunduh sumber video dari YouTube ke server...")
            download_video_stream(video_path, raw_full_video)
    except Exception as dl_err:
        print(f"❌ [Cloud Engine] Gagal mengunduh video sumber: {dl_err}")
        return ""

    total_video_duration = get_video_duration(raw_full_video)

    # 2. PROSES PEMOTONGAN & PERENDERAN SHORT VERTICAL (1080x1920) VIA HEADLESS FFMPEG
    try:
        print("⚡ [Cloud Engine] Memproses perenderan video Shorts via Headless FFmpeg...")
        if clips_data and isinstance(clips_data, list) and len(clips_data) > 0:
            rendered_temp_files = []
            
            # Deteksi font sistem (Windows / Linux Cloud Server)
            font_file_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            if os.path.exists("C:/Windows/Fonts/impact.ttf"):
                font_file_path = "C\\:/Windows/Fonts/impact.ttf"
            elif os.path.exists("C:/Windows/Fonts/ariblk.ttf"):
                font_file_path = "C\\:/Windows/Fonts/ariblk.ttf"

            for idx, sub_clip in enumerate(clips_data, start=1):
                sub_start_sec = time_to_seconds(sub_clip.get('start_time', '00:00'))
                sub_end_sec = time_to_seconds(sub_clip.get('end_time', '00:30'))

                if sub_start_sec >= total_video_duration:
                    sub_start_sec = 0.0
                
                raw_duration = sub_end_sec - sub_start_sec
                if raw_duration <= 0 or (sub_start_sec + raw_duration) > total_video_duration:
                    sub_duration = max(5.0, total_video_duration - sub_start_sec)
                else:
                    sub_duration = raw_duration

                clip_title = sub_clip.get('clip_title', f'Clip {idx}')
                safe_clip_title = clip_title.replace("'", "").replace(":", "").replace('"', '').upper()
                temp_file_path = os.path.join(temp_dir, f"sub_clip_{idx}.mp4")

                # Layout Shorts: Background Latar Blur + Video Utama Ditengah + Banner Judul Adegan
                filter_complex = (
                    "[0:v]split=2[bg_in][fg_in];"
                    "[bg_in]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg];"
                    "[fg_in]scale=iw*1.35:-1,crop=iw/1.35:ih/1.35,scale=1080:-1[fg];"
                    "[bg][fg]overlay=(W-w)/2:(H-h)/2[base];"
                    f"[base]drawtext=text='{safe_clip_title}':fontcolor=yellow:fontsize=52:"
                    f"fontfile='{font_file_path}':borderw=6:bordercolor=black:x=(w-text_w)/2:y=240[outv]"
                )

                ffmpeg_cmd = [
                    "ffmpeg", "-y",
                    "-ss", str(sub_start_sec),
                    "-i", raw_full_video,
                    "-t", str(sub_duration),
                    "-filter_complex", filter_complex,
                    "-map", "[outv]",
                    "-map", "0:a?",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-c:a", "aac",
                    temp_file_path
                ]

                subprocess.run(ffmpeg_cmd, check=True)
                if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 0:
                    rendered_temp_files.append(temp_file_path)

            if len(rendered_temp_files) > 0:
                concat_list_path = os.path.join(temp_dir, "concat_list.txt")
                with open(concat_list_path, "w", encoding="utf-8") as f:
                    for file_p in rendered_temp_files:
                        f.write(f"file '{file_p}'\n")

                concat_cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_list_path,
                    "-c", "copy",
                    final_output_file
                ]
                subprocess.run(concat_cmd, check=True)

                if os.path.exists(raw_full_video):
                    os.remove(raw_full_video)

                print(f"✅ [Cloud Engine] Berhasil merender video Shorts secara online: {final_output_file}")
                return final_output_file

    except Exception as e:
        print(f"❌ [Cloud Engine] Error perenderan FFmpeg: {e}")
        if os.path.exists(raw_full_video):
            os.remove(raw_full_video)
        return ""