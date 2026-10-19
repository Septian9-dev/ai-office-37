import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from googleapiclient.discovery import build
from services.video_pipeline import get_youtube_transcript

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORY_FILE = os.path.join(BASE_DIR, "processed_videos.json")

def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("⚠️ Warning: GEMINI_API_KEY belum terdeteksi.")
        return None
    return genai.Client(api_key=api_key)

TARGET_QUERIES = [
    "Lapor Pak episode terbaru full",
    "Podcast Indonesia viral",
    "Talkshow Indonesia seru"
]

def load_processed_video_ids() -> set:
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception:
            pass
    return set()

def save_processed_video_id(video_id: str):
    history = load_processed_video_ids()
    history.add(video_id)
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(list(history), f, indent=2)
    except Exception as e:
        print(f"⚠️ Gagal menyimpan riwayat video: {e}")

def search_target_videos(max_results=3):
    if not YOUTUBE_API_KEY:
        print("⚠️ YOUTUBE_API_KEY belum disetel.")
        return []

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    processed_ids = load_processed_video_ids()
    
    request = youtube.search().list(
        q=TARGET_QUERIES[0],
        part="snippet",
        type="video",
        order="relevance",
        maxResults=15
    )
    response = request.execute()
    
    videos = []
    for item in response.get("items", []):
        vid_id = item["id"]["videoId"]
        if vid_id in processed_ids:
            continue

        videos.append({
            "video_id": vid_id,
            "title": item["snippet"]["title"],
            "url": f"https://www.youtube.com/watch?v={vid_id}"
        })

        if len(videos) >= max_results:
            break

    return videos

async def aria_extract_single_viral_clip(video_data: dict):
    """Aria mengekstrak 5 adegan berdasarkan batas dinamika konteks komedi (Setup -> Punchline -> Cut)"""
    client = get_genai_client()
    
    # 🟢 Default clips disiapkan sebanyak 5 item
    default_clips = [
        {"clip_id": 1, "start_time": "01:00", "end_time": "01:30", "clip_title": "Surya Panik Dompet Hilang"},
        {"clip_id": 2, "start_time": "02:30", "end_time": "03:00", "clip_title": "Andre Lupa Nama Komandan"},
        {"clip_id": 3, "start_time": "04:00", "end_time": "04:30", "clip_title": "Wendi Debat Baju Sama Ayu"},
        {"clip_id": 4, "start_time": "05:30", "end_time": "06:00", "clip_title": "Andhika Nemu Harta Karun"},
        {"clip_id": 5, "start_time": "07:00", "end_time": "07:30", "clip_title": "Kiky Roasting Bintang Tamu"}
    ]

    if not client:
        return {
            "hook_text": video_data.get('title', 'Lapor Pak Spesial'),
            "reason": "Kompilasi kejutan improvisasi pemain",
            "clips": default_clips
        }

    # Ambil transkrip percakapan video utama beserta timestamp [MM:SS]
    video_id = video_data.get('video_id', '')
    transcript_text = ""
    if video_id:
        try:
            transcript_text = get_youtube_transcript(video_id)
            if transcript_text:
                print(f"📖 Berhasil mengambil transkrip percakapan ber-timestamp ({len(transcript_text)} karakter).")
        except Exception as t_err:
            print(f"⚠️ Gagal mengambil transkrip: {t_err}")

    transcript_prompt_section = ""
    if transcript_text:
        transcript_prompt_section = f"""
    TRANSKRIP PERCAKAPAN VIDEO BESERTA TIMESTAMP [MM:SS]:
    \"\"\"{transcript_text[:10000]}\"\"\"
    """

    prompt = f"""
    Kamu adalah Aria, Chief Mastermind & Creative Video Strategist.
    Analisis transkrip percakapan video utama: {video_data.get('title', '')} (URL: {video_data.get('url', '')}).
    {transcript_prompt_section}
    
    Tugas Pemotongan Konteks Komedi Alami (DYNAMIC HUMOR BOUNDARY):
    1. Cari 5 adegan SPESIFIK yang PENCAPAIAN KOMEDINYA PALING PECAH / PUNCHLINE UTAMA.
    2. PENENTUAN TIMESTAMP AWAL (`start_time`):
       - Tetapkan titik awal TEPAT saat pemikiran/setup candaan atau dialog topik tersebut dimulai.
    3. PENENTUAN TIMESTAMP AKHIR (`end_time`):
       - Tetapkan titik akhir TEPAT setelah puncak punchline, tawa/reaksi pemain lain selesai.
       - SEGERA HENTIKAN POTONGAN tepat sebelum dialog beralih ke pembicaraan biasa/kurang lucu.
       - JANGAN patok durasi secara acak; fokus pada kelengkapan Momen Lucu tersebut.
    4. ATURAN JUDUL ADEGAN (`clip_title`):
       - Identifikasi tokoh yang berbicara di adegan itu (misal: Surya, Andre, Wendi, Kiky, Ayu, Andhika, Bintang Tamu).
       - Buat judul ringkas (3-5 kata) mencerminkan isi percakapan alami.
       - DILARANG kata meta: "Momen", "Punchline", "Adegan", "Klip", "Lucu", "Kocak", "Video".
    
    Kembalikan output JSON RIGID dengan 5 klip:
    {{
      "hook_text": "SURYA AUTO EMOSI GARA-GARA ANDRE LUPA SKRIP",
      "reason": "Adegan improvisasi dan emosi puncak yang sangat menghibur",
      "clips": [
        {{
          "clip_id": 1,
          "start_time": "01:10",
          "end_time": "01:38",
          "clip_title": "Surya Panik Dompet Hilang"
        }},
        {{
          "clip_id": 2,
          "start_time": "03:15",
          "end_time": "03:42",
          "clip_title": "Wendi Debat Baju Sama Ayu"
        }},
        {{
          "clip_id": 3,
          "start_time": "05:00",
          "end_time": "05:28",
          "clip_title": "Kiky Roasting Bintang Tamu"
        }},
        {{
          "clip_id": 4,
          "start_time": "06:45",
          "end_time": "07:15",
          "clip_title": "Andhika Nemu Harta Karun"
        }},
        {{
          "clip_id": 5,
          "start_time": "08:20",
          "end_time": "08:50",
          "clip_title": "Andre Lupa Nama Komandan"
        }}
      ]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        raw_text = response.text.strip()
        data = json.loads(raw_text)
        
        if "clips" not in data and isinstance(data, dict):
            for key, val in data.items():
                if isinstance(val, list) and len(val) > 0:
                    data["clips"] = val
                    break

        if not data.get("clips") or not isinstance(data.get("clips"), list):
            data["clips"] = default_clips

        if not data.get("hook_text"):
            data["hook_text"] = video_data.get('title', 'Lapor Pak Spesial')

        if video_data.get("video_id"):
            save_processed_video_id(video_data["video_id"])

        return data
    except Exception as e:
        print(f"⚠️ Error Aria Extract Clip: {e}")
        return {
            "hook_text": video_data.get('title', 'Lapor Pak Spesial'),
            "reason": "Kompilasi adegan pilihan",
            "clips": default_clips
        }