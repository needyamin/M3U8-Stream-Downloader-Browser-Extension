# Icon Generation for M3U8 Stream Downloader

This directory contains the icon generation tools for your browser extension.

## What's Included

1. **`icon.svg`** - Master SVG icon with streaming/download theme
2. **Icon generation scripts** (in root directory):
   - `create_icons.ps1` - PowerShell script
   - `create_icons.bat` - Batch file alternative
   - `icon_converter.html` - Browser-based converter

## Required PNG Files

Your extension needs these 4 PNG files:
- `icon16.png` (16×16 pixels)
- `icon32.png` (32×32 pixels) 
- `icon48.png` (48×48 pixels)
- `icon128.png` (128×128 pixels)

## How to Generate Icons

### Method 1: PowerShell Script (Recommended)
```powershell
# Run from the project root directory
.\create_icons.ps1
```

### Method 2: Batch File
```cmd
# Double-click or run from command prompt
create_icons.bat
```

### Method 3: Browser Converter
1. Open `icon_converter.html` in your web browser
2. Click each "Download" button to save the PNG files
3. Save them in the `icons/` directory with the correct names

### Method 4: Online Converter
1. Upload `icons/icon.svg` to an online SVG-to-PNG converter
2. Convert to sizes: 16px, 32px, 48px, 128px
3. Save as `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

## Icon Design

The dummy icon features:
- **Theme**: Streaming/download with play button and download arrow
- **Colors**: Blue-purple gradient (#667eea to #764ba2)
- **Background**: Circular with white elements
- **Style**: Modern, clean, recognizable at small sizes

## Installation Check

Once you have all 4 PNG files in this directory, your extension should load properly in Chrome. The icons are referenced in `manifest.json` for both the extension icon and the browser action button.

## Customization

Feel free to:
- Modify the `icon.svg` file to change the design
- Use different colors or elements
- Create completely new icons that better match your brand

Just make sure to maintain the required sizes and PNG format for browser compatibility. 

# Open this file in Firefox to test the width:
firefox test_popup_width.html 

/* Firefox-specific width fixes - CRITICAL for proper popup width */
html {
  width: 400px !important;
  min-width: 400px !important;
  max-width: 400px !important;
  box-sizing: border-box !important;
}

body {
  width: 400px !important;
  min-width: 400px !important;
  max-width: 400px !important;
}

/* Firefox-specific popup width enforcement */
@-moz-document url-prefix() {
  html, body {
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
  }
  
  .container {
    width: 384px !important;
    min-width: 384px !important;
  }
} 