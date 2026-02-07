@echo off
echo Starting Bloodline Web App with organized structure...
echo.
echo Frontend files: frontend/
echo Backend files: backend/
echo.
cd backend
set EMAIL_USER=your-gmail@gmail.com
set EMAIL_PASS=your-16-character-app-password
set MONGODB_URI=mongodb://127.0.0.1:27017/bloodline
node server.js
pause
