# 🦊 Universal Media Downloader - Firefox Extension

Firefox version of the Universal Media Downloader that detects and downloads **all types of media files** including videos, audio, and streaming content.

## 🔥 Firefox-Specific Features

### ✅ **Firefox Compatibility**
- **Manifest V2**: Uses stable Manifest V2 for maximum Firefox compatibility
- **Browser API**: Compatible with both `browser` and `chrome` namespaces
- **Firefox 57+**: Supports Firefox Quantum and newer versions
- **WebExtensions**: Uses modern WebExtensions API

### 🎯 **Same Great Features**
- **All Media Types**: MP4, MP3, M3U8, AVI, MKV, FLAC, WebM, and more
- **Smart Detection**: Network monitoring + DOM scanning + content analysis
- **Anti-Shake UI**: Completely stable popup interface
- **One-Click Downloads**: Direct download to Firefox's download folder

## 📦 Firefox Installation

### 🛠️ **Installation Steps**

1. **Generate Icons** (Required):
   ```bash
   # Open icon_converter.html in Firefox
   # Download all 4 PNG icons:
   # - icon16.png, icon32.png, icon48.png, icon128.png
   # Save them in the icons/ folder
   ```

2. **Install Extension**:
   - Open Firefox → Type `about:debugging` in address bar
   - Click **"This Firefox"** (left sidebar)
   - Click **"Load Temporary Add-on..."**
   - Navigate to this `MozilaExtension` folder
   - Select `manifest.json` file
   - Click **"Open"**

3. **Pin to Toolbar**:
   - Right-click on toolbar → **"Customize"**
   - Drag Universal Media Downloader icon to toolbar
   - Click **"Done"**

### 🔧 **Permanent Installation** (Advanced)

For permanent installation, you'll need to:

1. **Create XPI Package**:
   ```bash
   # Zip all files in MozilaExtension folder
   # Rename from .zip to .xpi
   # Or use: zip -r universal-media-downloader.xpi *
   ```

2. **Developer Installation**:
   - Go to `about:config` in Firefox
   - Set `xpinstall.signatures.required` to `false`
   - Install the .xpi file

3. **Firefox Add-ons Store** (Future):
   - Submit to [addons.mozilla.org](https://addons.mozilla.org)
   - Get Mozilla review and approval
   - Available for public installation

## 🔍 Firefox-Specific Differences

### 📋 **API Differences**
| Feature | Chrome | Firefox |
|---------|--------|---------|
| **API Namespace** | `chrome.*` | `browser.*` (with `chrome.*` fallback) |
| **Promises** | Callback-based | Promise-based (preferred) |
| **Manifest** | V3 preferred | V2 stable, V3 experimental |
| **Downloads** | `chrome.downloads` | `browser.downloads` |
| **WebRequest** | Same | Same |

### 🛠️ **Technical Notes**
- **Manifest V2**: More stable in Firefox than V3
- **Background Scripts**: Uses `background.scripts` instead of `service_worker`
- **Browser Action**: Uses `browser_action` instead of `action`
- **Gecko ID**: Includes `applications.gecko.id` for Firefox

## 🧪 Testing in Firefox

### 🔍 **Basic Testing**
1. **Visit media sites**: YouTube, Vimeo, SoundCloud
2. **Click extension icon**: Should show detected media
3. **Test downloads**: Try downloading different file types
4. **Check downloads**: Files should appear in Firefox Downloads

### 🐛 **Firefox Debugging**
1. **Console Logs**: Open Web Console (F12)
2. **Extension Debugging**: `about:debugging` → Extension → "Inspect"
3. **Background Script**: Debug background.js separately
4. **Content Script**: Use regular webpage console

## ⚠️ Firefox-Specific Issues

### 🔧 **Common Problems**

#### **Extension Won't Load**
```bash
✅ Check: All icon files present?
✅ Check: manifest.json valid?
✅ Try: Reload temporary add-on
✅ Check: Firefox version 57+?
```

#### **Downloads Not Working**
```bash
✅ Check: Download permissions enabled?
✅ Check: Firefox download settings
✅ Try: Different file types
✅ Check: Console for errors
```

#### **Detection Issues**
```bash
✅ Try: Refresh page and extension
✅ Check: Site uses supported formats?
✅ Try: Play video first
✅ Check: Network activity in DevTools
```

### 🔒 **Firefox Permissions**
- **Downloads**: Access to download files
- **Storage**: Save extension settings
- **WebRequest**: Monitor network requests
- **ActiveTab**: Access current webpage
- **All URLs**: Detect media on any site

## 🆚 Chrome vs Firefox Comparison

| Feature | Chrome Extension | Firefox Extension |
|---------|------------------|-------------------|
| **Manifest** | V3 (service_worker) | V2 (background scripts) |
| **API Style** | Callback-based | Promise-based preferred |
| **Installation** | Load unpacked | Load temporary add-on |
| **Debugging** | Extension DevTools | about:debugging |
| **Store** | Chrome Web Store | Firefox Add-ons |
| **Permissions** | More restrictive | More flexible |

## 🚀 Firefox-Specific Optimizations

### ⚡ **Performance**
- **Background Script**: Non-persistent for better memory usage
- **Content Scripts**: Efficient DOM scanning
- **Promise-based**: Better async handling in Firefox

### 🎨 **UI Enhancements**
- **Firefox Theme**: Adapts to Firefox UI
- **Native Scrollbars**: Uses Firefox scrollbar styling
- **Context Menus**: Could integrate with Firefox context menus

## 📋 Developer Notes

### 🛠️ **Building for Firefox**
```javascript
// Firefox compatibility layer
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Use promises when available
const sendMessage = (message) => {
  if (browserAPI.runtime.sendMessage.length === 1) {
    // Firefox - returns promise
    return browserAPI.runtime.sendMessage(message);
  } else {
    // Chrome - uses callback
    return new Promise((resolve) => {
      browserAPI.runtime.sendMessage(message, resolve);
    });
  }
};
```

### 🔄 **Cross-Browser Compatibility**
- **Shared Codebase**: Same logic works in both browsers
- **API Abstraction**: `browserAPI` variable handles differences
- **Feature Detection**: Check API availability before use
- **Graceful Fallbacks**: Handle missing features gracefully

## 📄 License & Credits

This Firefox extension shares the same MIT license as the Chrome version.

**Firefox-specific development**: Optimized for Firefox WebExtensions API and Gecko engine compatibility.

---

## 🦊 Firefox Installation Summary

1. **Download icons** → Open `icon_converter.html` 
2. **Install extension** → `about:debugging` → Load temporary add-on
3. **Test functionality** → Visit media sites and try downloads
4. **Pin to toolbar** → Customize toolbar and add icon

**🔥 Ready to download media in Firefox!**

*Optimized for Firefox Quantum and modern WebExtensions* 