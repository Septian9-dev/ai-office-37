from services.publisher import get_authenticated_service

print("Membuka browser untuk otorisasi YouTube...")
get_authenticated_service()
print("Otorisasi Berhasil! File token.json telah dibuat.")