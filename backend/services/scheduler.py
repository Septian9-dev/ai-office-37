import json
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.researcher import search_target_videos, aria_extract_single_viral_clip
from services.renderer import execute_remotion_render
from services.copywriter import generate_metadata
from services.publisher import publish_and_notify_telegram

scheduler = AsyncIOScheduler(timezone="Asia/Jakarta")

async def run_short_production_pipeline():
    print("🚀 [ARIA MASTERMIND] Memulai riset & produksi dari 3 video utama...")
    
    # 1. Cari 3 video target utama sekaligus
    videos = search_target_videos(max_results=3)
    if not videos:
        print("⚠️ Tidak ada video utama yang ditemukan.")
        return
        
    # 2. Proses masing-masing video utama secara bergantian
    for idx, target_video in enumerate(videos, start=1):
        print(f"\n🎬 Memproses Video Utama ke-{idx}: {target_video['title']}")
        
        try:
            # Aria mengekstrak 5 klip terbaik dari 1 video utama ini
            clip = await aria_extract_single_viral_clip(target_video)
            if not clip or not isinstance(clip, dict):
                print(f"⚠️ Gagal mengekstrak klip dari video ke-{idx}, melompati ke video berikutnya.")
                continue
            
            # Ambil array clips dari AI
            clips_list = clip.get('clips', [])
                
            # Step A: Render Video Short CapCut Style (gabung 5 klip)
            video_path = await execute_remotion_render(
                target_video['url'], 
                clip.get('start_time', '00:00'), 
                clip.get('end_time', '00:30'),
                clip.get('hook_text', 'Viral Clip'),
                idx,
                clips_data=clips_list
            )
            
            if not video_path:
                print(f"⚠️ Gagal merender video ke-{idx}.")
                continue

            # Step B: Buat Judul & Metadata
            metadata = await generate_metadata(
                clip.get('hook_text', ''), 
                clip.get('reason', '')
            )
            
            # Step C: Publish ke YouTube & Kirim Laporan Telegram
            await publish_and_notify_telegram(video_path, metadata)
            print(f"✅ Selesai memproses video ke-{idx}!\n")

        except Exception as e:
            print(f"❌ Terjadi kesalahan pada proses video ke-{idx}: {e}")
            print("⏭️ Melanjutkan ke video berikutnya...")

def start_automated_schedule():
    scheduler.add_job(run_short_production_pipeline, 'cron', hour='11,16,19', minute=0)
    scheduler.start()