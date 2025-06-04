# M3U8 Stream Downloader - Icon Generator Script
Write-Host "Creating PNG icons from SVG..." -ForegroundColor Green

# Check if ImageMagick is available
$imageMagickPath = Get-Command "magick" -ErrorAction SilentlyContinue

if ($imageMagickPath) {
    Write-Host "Using ImageMagick to convert icons..." -ForegroundColor Yellow
    
    # Convert SVG to different PNG sizes
    & magick "icons/icon.svg" -resize 16x16 "icons/icon16.png"
    & magick "icons/icon.svg" -resize 32x32 "icons/icon32.png"  
    & magick "icons/icon.svg" -resize 48x48 "icons/icon48.png"
    & magick "icons/icon.svg" -resize 128x128 "icons/icon128.png"
    
    Write-Host "All PNG icons created successfully!" -ForegroundColor Green
    
} else {
    Write-Host "ImageMagick not found." -ForegroundColor Yellow
    Write-Host "Please install ImageMagick or use icon_converter.html" -ForegroundColor Cyan
}

Write-Host "Alternative methods:" -ForegroundColor White
Write-Host "1. Open icon_converter.html in your browser" -ForegroundColor White
Write-Host "2. Use online SVG to PNG converter" -ForegroundColor White
Write-Host "3. Run create_icons.bat" -ForegroundColor White 