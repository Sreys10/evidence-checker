# PowerShell script to copy MongoDB credentials from .env.local to backend-service/.env
# Run this script from the root directory: .\setup-backend-env.ps1

Write-Host "Setting up backend service environment variables..." -ForegroundColor Cyan

# Read .env.local
if (Test-Path ".env.local") {
    Write-Host "Reading .env.local..." -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    
    # Extract MONGODB_URI and MONGODB_DB_NAME
    $mongodbUri = ""
    $mongodbDbName = "evi-check"
    
    if ($envContent -match "MONGODB_URI=(.+)") {
        $mongodbUri = $matches[1].Trim()
        Write-Host "Found MONGODB_URI" -ForegroundColor Green
    }
    
    if ($envContent -match "MONGODB_DB_NAME=(.+)") {
        $mongodbDbName = $matches[1].Trim()
        Write-Host "Found MONGODB_DB_NAME: $mongodbDbName" -ForegroundColor Green
    }
    
    if ($mongodbUri) {
        # Create backend-service/.env
        $backendEnvPath = "backend-service\.env"
        $backendEnvContent = @"
# MongoDB Atlas Configuration
# Auto-generated from .env.local
MONGODB_URI=$mongodbUri
MONGODB_DB_NAME=$mongodbDbName
PORT=5000
BACKEND_SERVICE_URL=http://localhost:5000
"@
        
        Set-Content -Path $backendEnvPath -Value $backendEnvContent
        Write-Host "✓ Created $backendEnvPath" -ForegroundColor Green
        Write-Host "Backend service is now configured to use MongoDB Atlas!" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Could not find MONGODB_URI in .env.local" -ForegroundColor Red
        Write-Host "Please ensure .env.local contains MONGODB_URI=..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env.local not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
}



