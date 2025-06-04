# 🎬 M3U8 Stream Downloader - Installation Guide

## Prerequisites ✅

Before installing, make sure you have all required PNG icon files in the `icons/` directory:
- `icon16.png` (16×16 pixels)
- `icon32.png` (32×32 pixels) 
- `icon48.png` (48×48 pixels)
- `icon128.png` (128×128 pixels)

**If you don't have these files yet:**
1. Open `icon_converter.html` in your browser
2. Click each download button to save the PNG files
3. Place them in the `icons/` folder

## Installation Steps 🚀

### **Chrome Browser**
1. Open Chrome and go to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to this project folder and select it
5. Click **"Select Folder"**

### **Microsoft Edge Browser**
1. Open Edge and go to: `edge://extensions/`
2. Enable **"Developer mode"** (toggle in left sidebar)
3. Click **"Load unpacked"**
4. Navigate to this project folder and select it
5. Click **"Select Folder"**

### **Firefox Browser** (Alternative method)
1. Open Firefox and go to: `about:debugging`
2. Click **"This Firefox"**
3. Click **"Load Temporary Add-on"**
4. Navigate to this folder and select `manifest.json`

## Testing Your Extension 🧪

### **1. Check if Extension Loaded**
- Look for the M3U8 Stream Downloader icon in your browser toolbar
- If you see the icon, the extension loaded successfully!

### **2. Test the Extension**
1. **Visit a website with video content** (YouTube, Vimeo, etc.)
2. **Click the extension icon** in your browser toolbar
3. **The popup should open** showing the extension interface
4. **Check the console** for any detected M3U8 streams

### **3. Test M3U8 Detection**
1. Visit a site that uses HLS/M3U8 streaming (many video sites)
2. Open the extension popup
3. The extension should detect and list any M3U8 streams found
4. You can then attempt to download them

## Troubleshooting 🔧

### **Extension Won't Load**
- ✅ Make sure all 4 PNG icon files are in the `icons/` folder
- ✅ Check that `manifest.json` exists in the root folder
- ✅ Verify Developer mode is enabled
- ✅ Try refreshing the extensions page and reloading

### **Extension Icon Missing**
- The PNG icon files are required - use `icon_converter.html` to generate them
- Make sure filenames are exactly: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

### **Popup Won't Open**
- Check browser console (F12) for JavaScript errors
- Verify `popup.html`, `popup.js`, and `popup.css` files exist
- Try reloading the extension

### **No Streams Detected**
- The extension works with HLS/M3U8 streams specifically
- Not all video sites use M3U8 format
- Check the browser's Network tab to see if .m3u8 files are being loaded

## Permissions 🔒

This extension requires these permissions:
- **activeTab**: To access the current webpage
- **storage**: To save settings and preferences  
- **downloads**: To download detected streams
- **webRequest**: To observe and detect M3U8 requests (non-blocking)

Note: This extension uses Manifest V3 and does not require blocking web request permissions.

## Uninstalling 🗑️

To remove the extension:
1. Go to your browser's extensions page
2. Find "M3U8 Stream Downloader"
3. Click "Remove" or the trash icon
4. Confirm removal

## Development Mode Notes 📝

Since this is loaded as an unpacked extension:
- Changes to files require clicking "Reload" on the extensions page
- The extension may show as "Developer mode" extension
- Some browsers may show security warnings for unpacked extensions

---

**Need Help?** Check the project files:
- `README.md` - Project overview
- `icons/README_ICONS.md` - Icon generation help
- Browser console (F12) - For debugging errors 