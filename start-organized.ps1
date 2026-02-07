# Start Bloodline Web App with organized structure
Write-Host "Starting Bloodline Web App with organized structure..." -ForegroundColor Green
Write-Host "Frontend files: frontend/" -ForegroundColor Cyan
Write-Host "Backend files: backend/" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location backend

# Set environment variables
$env:EMAIL_USER = "your-gmail@gmail.com"
$env:EMAIL_PASS = "your-16-character-app-password"
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/bloodline"

# Start the server
Write-Host "Starting server..." -ForegroundColor Yellow
node server.js

# Keep the window open
Read-Host "Press any key to exit..."
