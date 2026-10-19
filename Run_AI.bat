@echo off
title AI Office 37 Starter

echo Memulai Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo Memulai Frontend (Next.js)...
start "Frontend - Next.js" cmd /k "cd frontend && npm run dev -- --webpack"

echo.
echo Server Backend dan Frontend sedang berjalan di jendela terpisah!