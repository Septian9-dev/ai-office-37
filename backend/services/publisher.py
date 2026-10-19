import os
import html
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_SECRET_FILE = os.path.join(BASE_DIR, "client_secret.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")


def get_authenticated_service():
    """Mengelola autentikasi OAuth 2.0 dan mengembalikan service YouTube API"""
    creds = None
    
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRET_FILE):
                raise FileNotFoundError(f"❌ File {CLIENT_SECRET_FILE} tidak ditemukan! Pastikan client_secret.json ada di folder backend.")
            
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
            
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)


def upload_video_to_youtube(video_path: str, metadata: dict) -> str:
    """Michael: Unggah video Shorts ke Channel YouTube (Status Unlisted)"""
    try:
        youtube = get_authenticated_service()

        title = metadata.get('title', 'Shorts Clip')[:100]
        description = metadata.get('description') or metadata.get('caption', '')
        
        raw_hashtags = metadata.get('hashtags', [])
        if isinstance(raw_hashtags, list):
            tags = [t.replace('#', '') for t in raw_hashtags]
            hashtags_str = " ".join(raw_hashtags)
        else:
            tags = [t.strip().replace('#', '') for t in str(raw_hashtags).split()]
            hashtags_str = str(raw_hashtags)

        full_description = f"{description}\n\n{hashtags_str}".strip()

        body = {
            "snippet": {
                "title": title,
                "description": full_description,
                "tags": tags,
                "categoryId": "24"  # Entertainment
            },
            "status": {
                "privacyStatus": "unlisted",  # Status Unlisted agar bisa ditinjau dulu
                "selfDeclaredMadeForKids": False
            }
        }

        # Menggunakan chunksize 5MB agar progress pengunggahan terkirim secara bertahap
        chunksize = 5 * 1024 * 1024
        media = MediaFileUpload(video_path, chunksize=chunksize, resumable=True, mimetype="video/mp4")
        request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

        print(f"🚀 Memulai upload {os.path.basename(video_path)} ke YouTube (Unlisted)...")
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                pct = int(status.progress() * 100)
                bar_length = 20
                filled = int(bar_length * status.progress())
                bar = '█' * filled + '-' * (bar_length - filled)
                print(f"\r⏳ Upload YouTube: [{bar}] {pct}%", end="", flush=True)

        print("\n✅ Upload ke YouTube selesai!")
        video_id = response.get("id")
        youtube_url = f"https://youtube.com/shorts/{video_id}"
        print(f"✅ Video berhasil diunggah! Link: {youtube_url}")
        return youtube_url

    except Exception as e:
        print(f"\n❌ Error saat upload ke YouTube: {e}")
        return ""


async def publish_and_notify_telegram(video_path: str, metadata: dict):
    """Michael: Jalankan upload ke YouTube & kirim laporan otomatis ke Telegram"""
    youtube_link = upload_video_to_youtube(video_path, metadata)
    if not youtube_link:
        youtube_link = "⚠️ Gagal Upload ke YouTube"

    title = html.escape(str(metadata.get('title', 'No Title')))
    description = html.escape(str(metadata.get('description') or metadata.get('caption', '')))
    
    raw_hashtags = metadata.get('hashtags', [])
    hashtags = html.escape(" ".join(raw_hashtags) if isinstance(raw_hashtags, list) else str(raw_hashtags))
    engine = html.escape(str(metadata.get('engine_used', 'unknown')))

    telegram_message = (
        f"🎬 <b>[Otonom HQ] 1 Video Short Berhasil Diunggah (Unlisted)!</b>\n\n"
        f"📌 <b>Judul:</b> {title}\n"
        f"📝 <b>Deskripsi:</b> {description}\n"
        f"🏷️ <b>Hashtags:</b> {hashtags}\n"
        f"🤖 <b>AI Engine:</b> <code>{engine}</code>\n\n"
        f"🔗 <b>Link YouTube:</b> {youtube_link}\n\n"
        f"<i>Pengerjaan otonom oleh Michael (Ops) & Tim Otonom HQ.</i>"
    )
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": telegram_message,
        "parse_mode": "HTML"
    }
    
    try:
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            print("✅ Laporan berhasil dikirim ke Telegram!")
        else:
            print(f"❌ Telegram API Error: {res.text}")
    except Exception as e:
        print(f"❌ Gagal mengirim pesan ke Telegram: {e}")