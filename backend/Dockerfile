FROM python:3.12-slim

# Install dependency sistem: FFmpeg & Font DejaVu
RUN apt-get update && apt-get install -y \
    ffmpeg \
    fonts-dejavu-core \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements dan install modul Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh kode aplikasi
COPY . .

# Expose port server
EXPOSE 8000

# Jalankan server FastAPI via Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]