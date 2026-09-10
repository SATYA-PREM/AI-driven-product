@echo off
echo Starting Product Intelligence API...
cd /d "%~dp0"
call venv\Scripts\activate
start http://127.0.0.1:8000/docs
uvicorn app.main:app --reload