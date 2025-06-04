@echo off
echo M3U8 Stream Downloader - Icon Generator
echo.

REM Check if ImageMagick is installed
where magick >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Converting SVG to PNG icons...
    magick icons/icon.svg -resize 16x16 icons/icon16.png
    magick icons/icon.svg -resize 32x32 icons/icon32.png
    magick icons/icon.svg -resize 48x48 icons/icon48.png
    magick icons/icon.svg -resize 128x128 icons/icon128.png
    echo All icons created successfully!
) else (
    echo ImageMagick not found. Please:
    echo 1. Install ImageMagick from https://imagemagick.org/
    echo 2. Or open icon_converter.html in your browser
    echo 3. Or use an online SVG to PNG converter
)

pause 