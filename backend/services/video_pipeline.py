import os
import subprocess
import tempfile
from youtube_transcript_api import YouTubeTranscriptApi

def transcribe_with_faster_whisper(video_url_or_id: str) -> str:
    """Fallback Otomatis: Mengunduh audio video & mentranskrip ke teks ber-timestamp via faster-whisper"""
    try:
        from faster_whisper import WhisperModel
        print("🎙️ Subtitle resmi YouTube tidak ada. Mengunduh audio untuk pemrosesan faster-whisper...")

        url = video_url_or_id
        if not video_url_or_id.startswith("http"):
            url = f"https://www.youtube.com/watch?v={video_url_or_id}"

        temp_audio = os.path.join(tempfile.gettempdir(), f"whisper_audio_{os.getpid()}.mp3")

        # Unduh audio versi mp3 saja via yt-dlp (hemat kuota & cepat)
        cmd = [
            "yt-dlp", "--no-warnings", "--no-playlist",
            "-x", "--audio-format", "mp3",
            "-o", temp_audio,
            url
        ]
        subprocess.run(cmd, check=True)

        print("🎙️ Memulai transkripsi audio lokal via faster-whisper (model base int8)...")
        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(temp_audio, language="id")

        formatted_lines = []
        for segment in segments:
            start_sec = int(segment.start)
            minutes = start_sec // 60
            seconds = start_sec % 60
            time_str = f"[{minutes:02d}:{seconds:02d}]"
            formatted_lines.append(f"{time_str} {segment.text.strip()}")

        if os.path.exists(temp_audio):
            os.remove(temp_audio)

        print(f"✅ Transkripsi faster-whisper selesai ({len(formatted_lines)} baris percakapan).")
        return "\n".join(formatted_lines)

    except Exception as e:
        print(f"⚠️ Gagal melakukan transkripsi faster-whisper: {e}")
        return ""

def get_youtube_transcript(video_id_or_url: str) -> str:
    """Mengambil transkrip YouTube, jika tidak ada otomatis fallback ke faster-whisper"""
    video_id = video_id_or_url
    if "v=" in video_id_or_url:
        video_id = video_id_or_url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in video_id_or_url:
        video_id = video_id_or_url.split("youtu.be/")[1].split("?")[0]

    # 1. Percobaan Ambil Subtitle Bawaan YouTube
    try:
        fetched_data = []
        try:
            fetched_data = YouTubeTranscriptApi.get_transcript(video_id, languages=['id', 'en'])
        except Exception:
            try:
                t_list = YouTubeTranscriptApi.list_transcripts(video_id)
                try:
                    transcript_obj = t_list.find_transcript(['id', 'en'])
                except Exception:
                    transcript_obj = next(iter(t_list))
                fetched_data = transcript_obj.fetch()
            except Exception:
                ytt = YouTubeTranscriptApi()
                t_list = ytt.list_transcripts(video_id)
                try:
                    transcript_obj = t_list.find_transcript(['id', 'en'])
                except Exception:
                    transcript_obj = next(iter(t_list))
                fetched_data = transcript_obj.fetch()

        if fetched_data:
            formatted_lines = []
            for item in fetched_data:
                start_sec = int(item['start'])
                minutes = start_sec // 60
                seconds = start_sec % 60
                time_str = f"[{minutes:02d}:{seconds:02d}]"
                formatted_lines.append(f"{time_str} {item['text']}")
            return "\n".join(formatted_lines)

    except Exception as e:
        print(f"⚠️ Subtitle YouTube bawaan tidak terdeteksi: {e}")

    # 2. Fallback Otomatis: Transkrip Audio dengan faster-whisper
    return transcribe_with_faster_whisper(video_id_or_url)