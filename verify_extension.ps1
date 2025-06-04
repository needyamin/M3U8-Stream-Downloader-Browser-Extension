# M3U8 Stream Downloader - Extension Verification Script
Write-Host "Verifying M3U8 Stream Downloader Extension..." -ForegroundColor Green
Write-Host "=" * 50

$allGood = $true

# Check manifest.json
if (Test-Path "manifest.json") {
    Write-Host "✅ manifest.json - Found" -ForegroundColor Green
} else {
    Write-Host "❌ manifest.json - MISSING" -ForegroundColor Red
    $allGood = $false
}

# Check core extension files
$requiredFiles = @(
    "background.js",
    "content.js", 
    "popup.html",
    "popup.js",
    "popup.css",
    "injected.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file - Found" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

# Check icon files
Write-Host "`nChecking Icon Files..." -ForegroundColor Yellow
$iconFiles = @("icon16.png", "icon32.png", "icon48.png", "icon128.png")
$iconsMissing = 0

foreach ($icon in $iconFiles) {
    $iconPath = "icons/$icon"
    if (Test-Path $iconPath) {
        Write-Host "✅ $icon - Found" -ForegroundColor Green
    } else {
        Write-Host "❌ $icon - MISSING" -ForegroundColor Red
        $iconsMissing++
    }
}

# Check if icon.svg exists for generation
if (Test-Path "icons/icon.svg") {
    Write-Host "✅ icon.svg - Found (for generating PNG icons)" -ForegroundColor Green
} else {
    Write-Host "❌ icon.svg - MISSING" -ForegroundColor Red
}

# Final verdict
Write-Host "`n" + "=" * 50
if ($allGood -and $iconsMissing -eq 0) {
    Write-Host "🎉 EXTENSION READY FOR INSTALLATION!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Open Chrome and go to chrome://extensions/" -ForegroundColor Cyan
    Write-Host "2. Enable Developer mode" -ForegroundColor Cyan
    Write-Host "3. Click 'Load unpacked' and select this folder" -ForegroundColor Cyan
} elseif ($iconsMissing -gt 0) {
    Write-Host "⚠️  ICONS MISSING - Extension may not load properly" -ForegroundColor Yellow
    Write-Host "Generate icons by:" -ForegroundColor White
    Write-Host "1. Opening icon_converter.html in your browser" -ForegroundColor Cyan
    Write-Host "2. Or running: .\create_icons.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ CRITICAL FILES MISSING - Extension will not work" -ForegroundColor Red
}

Write-Host "=" * 50 