# Universal Media Downloader - Firefox Extension Verification Script
Write-Host "🦊 Verifying Firefox Extension..." -ForegroundColor Green
Write-Host "=" * 60

$allGood = $true
$firefoxSpecific = $true

# Check manifest.json
if (Test-Path "manifest.json") {
    Write-Host "✅ manifest.json - Found" -ForegroundColor Green
    
    # Check if it's Firefox-compatible
    $manifest = Get-Content "manifest.json" | ConvertFrom-Json
    if ($manifest.manifest_version -eq 2) {
        Write-Host "   📋 Manifest V2 - Firefox Compatible" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Manifest V3 - May have issues in Firefox" -ForegroundColor Yellow
        $firefoxSpecific = $false
    }
    
    if ($manifest.browser_action) {
        Write-Host "   🖱️  browser_action - Firefox Compatible" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️  Uses 'action' instead of 'browser_action'" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ manifest.json - MISSING" -ForegroundColor Red
    $allGood = $false
}

# Check Firefox-compatible files
$requiredFiles = @(
    "background.js",
    "content.js", 
    "popup.html",
    "popup.js",
    "popup.css",
    "injected.js"
)

Write-Host "`n📁 Checking Core Files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file - Found" -ForegroundColor Green
        
        # Check if file contains Firefox-specific code
        $content = Get-Content $file -Raw
        if ($content -match "browserAPI|typeof browser") {
            Write-Host "   🦊 Firefox API compatibility detected" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ $file - MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

# Check icon files
Write-Host "`n🎨 Checking Icon Files..." -ForegroundColor Yellow
$iconFiles = @("icon16.png", "icon32.png", "icon48.png", "icon128.png")
$iconsMissing = 0

foreach ($icon in $iconFiles) {
    $iconPath = "icons/$icon"
    if (Test-Path $iconPath) {
        $size = (Get-Item $iconPath).Length
        Write-Host "✅ $icon - Found ($([math]::Round($size/1024, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host "❌ $icon - MISSING" -ForegroundColor Red
        $iconsMissing++
    }
}

# Check Firefox-specific files
Write-Host "`n🦊 Checking Firefox-Specific Files..." -ForegroundColor Yellow
if (Test-Path "README_FIREFOX.md") {
    Write-Host "✅ README_FIREFOX.md - Found" -ForegroundColor Green
} else {
    Write-Host "ℹ️  README_FIREFOX.md - Not found (optional)" -ForegroundColor Yellow
}

# Final verdict
Write-Host "`n" + "=" * 60
if ($allGood -and $iconsMissing -eq 0 -and $firefoxSpecific) {
    Write-Host "🎉 FIREFOX EXTENSION READY!" -ForegroundColor Green
    Write-Host "Next steps for Firefox:" -ForegroundColor White
    Write-Host "1. Open Firefox" -ForegroundColor Cyan
    Write-Host "2. Type 'about:debugging' in address bar" -ForegroundColor Cyan
    Write-Host "3. Click 'This Firefox' in left sidebar" -ForegroundColor Cyan
    Write-Host "4. Click 'Load Temporary Add-on...'" -ForegroundColor Cyan
    Write-Host "5. Select manifest.json from this folder" -ForegroundColor Cyan
} elseif ($iconsMissing -gt 0) {
    Write-Host "⚠️  ICONS MISSING - Extension may not load properly" -ForegroundColor Yellow
    Write-Host "Generate icons by:" -ForegroundColor White
    Write-Host "1. Opening icon_converter.html in Firefox" -ForegroundColor Cyan
    Write-Host "2. Downloading all 4 PNG files" -ForegroundColor Cyan
    Write-Host "3. Saving them in the icons/ folder" -ForegroundColor Cyan
} elseif (-not $firefoxSpecific) {
    Write-Host "⚠️  COMPATIBILITY ISSUES - May not work optimally in Firefox" -ForegroundColor Yellow
    Write-Host "This appears to be a Chrome extension. Firefox version should:" -ForegroundColor White
    Write-Host "- Use Manifest V2" -ForegroundColor Cyan
    Write-Host "- Use browser_action instead of action" -ForegroundColor Cyan
    Write-Host "- Include browserAPI compatibility layer" -ForegroundColor Cyan
} else {
    Write-Host "❌ CRITICAL FILES MISSING - Extension will not work" -ForegroundColor Red
}

Write-Host "`n🔍 Firefox Extension Features:" -ForegroundColor Yellow
Write-Host "• Manifest V2 for stability" -ForegroundColor White
Write-Host "• browserAPI compatibility layer" -ForegroundColor White
Write-Host "• Promise-based API calls" -ForegroundColor White
Write-Host "• Firefox debugging support" -ForegroundColor White
Write-Host "• Cross-browser compatibility" -ForegroundColor White

Write-Host "`n🆚 Differences from Chrome:" -ForegroundColor Yellow
Write-Host "• Installation: about:debugging vs chrome://extensions/" -ForegroundColor White
Write-Host "• API: browser.* vs chrome.*" -ForegroundColor White
Write-Host "• Debugging: Different DevTools interface" -ForegroundColor White
Write-Host "• Manifest: V2 vs V3" -ForegroundColor White

Write-Host "=" * 60 