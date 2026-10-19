import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from groq import Groq

load_dotenv()

# 1. Konfigurasi Client Gemini API
def get_genai_client():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

# 2. Konfigurasi Groq Client (Fallback)
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None


async def generate_metadata(hook_text: str, reason: str) -> dict:
    """Agen Copywriter: Membuat Judul, Deskripsi, dan Hashtag viral (Gemini -> Fallback Groq Qwen)"""
    prompt = f"""
    Kamu adalah agen Copywriter sosial media profesional.
    Buatlah metadata konten viral untuk video pendek (TikTok/Reels/Shorts) berdasarkan informasi berikut:
    
    - Hook Teks: "{hook_text}"
    - Alasan Momen Seru: "{reason}"
    
    Tolong berikan output HANYA JSON valid tanpa markdown/code block dengan struktur:
    {{
      "title": "Judul menarik dan clickbait positif (maksimal 60 karakter)",
      "description": "Deskripsi singkat yang mengundang interaksi/komentar",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
    }}
    """

    # --- PERCOBAAN 1: Gemini 3.5 Flash Lite ---
    try:
        client = get_genai_client()
        if client:
            print("🤖 Menggunakan model utama: gemini-3.5-flash-lite...")
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            parsed_data = json.loads(response.text)
            parsed_data["engine_used"] = "gemini-3.5-flash-lite"
            return parsed_data

    except Exception as e:
        print(f"⚠️ Gemini 3.5 Flash Lite limit/error: {e}")
        print("⚡ Beralih otomatis ke Fallback: Groq (qwen/qwen3.8-27b)...")

    # --- PERCOBAAN 2: Groq Qwen (Fallback saat Gemini Limit) ---
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {"role": "system", "content": "You are a professional social media copywriter. Output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            groq_text = completion.choices[0].message.content.strip()
            parsed_data = json.loads(groq_text)
            parsed_data["engine_used"] = "groq-qwen3.8-27b"
            print("✅ Berhasil membuat copywriting via Groq (Qwen)!")
            return parsed_data
        except Exception as groq_err:
            print(f"⚠️ Groq Qwen juga mengalami error: {groq_err}")

    # --- FALLBACK TERAKHIR (Lokal Default) ---
    return {
        "title": hook_text[:60],
        "description": f"Momen seru: {reason}. Jangan lupa like dan follow!",
        "hashtags": ["#shorts", "#viral", "#foryou", "#trending"],
        "engine_used": "local-fallback"
    }