# 🎬 Universal Media Downloader - Browser Extension

A powerful Chrome browser extension that automatically detects and downloads **all types of media files** including videos, audio, and streaming content. Supports MP4, MP3, M3U8, AVI, MKV, FLAC, and many more formats with advanced detection capabilities.

## ✨ Features

### 🎯 **Universal Media Detection**
- **All Video Formats**: MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP, OGV, TS, M2TS, etc.
- **All Audio Formats**: MP3, WAV, FLAC, AAC, OGG, WMA, M4A, OPUS, AIFF, APE, etc.
- **Streaming Formats**: M3U8 (HLS), MPD (DASH), ISM, F4V, F4A
- **Smart Detection**: Network monitoring + DOM scanning + content analysis

### 🚀 **Advanced Capabilities**
- **Real-time Monitoring**: Continuously scans as you browse
- **Multi-source Detection**: Monitors XHR, Fetch, WebSockets, and MediaSource APIs
- **Smart Filtering**: Excludes thumbnails, icons, and non-media content
- **File Size Detection**: Shows estimated file sizes when available
- **Media Type Recognition**: Displays specific format information

### 🎨 **Premium User Experience**
- **Modern UI**: Beautiful, responsive interface with gradient design
- **Zero Shake**: Completely stable popup with anti-shake technology
- **Instant Downloads**: One-click downloading for all detected media
- **Progress Tracking**: Visual indicators for download status
- **Manual Refresh**: User-controlled updates (no auto-refresh disruptions)

## 📦 Installation

### 🛠️ **Quick Setup**

1. **Download** this repository to your computer
2. **Generate Icons** (Required):
   ```bash
   # Open icon_converter.html in your browser
   # Click each download button to get:
   # - icon16.png (16×16)
   # - icon32.png (32×32) 
   # - icon48.png (48×48)
   # - icon128.png (128×128)
   ```
3. **Install Extension**:
   - Open Chrome → `chrome://extensions/`
   - Enable **"Developer mode"** (top-right toggle)
   - Click **"Load unpacked"**
   - Select this project folder
   - Pin to toolbar for easy access

### 🎨 **Icon Generation Options**

**Method 1: Browser Converter** (Easiest)
```bash
1. Open icon_converter.html in your browser
2. Click each download button
3. Save all files in the icons/ folder
```

**Method 2: Command Line** (If you have ImageMagick)
```bash
# Windows PowerShell
.\create_icons.ps1

# Windows Command Prompt  
create_icons.bat
```

**Method 3: Online Converter**
- Upload `icons/icon.svg` to any SVG-to-PNG converter
- Export at sizes: 16px, 32px, 48px, 128px
- Save as `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

## 🎯 Usage

### 🔍 **Basic Detection**
1. **Visit any website** with video or audio content
2. **Click the extension icon** 🎬 in your toolbar
3. **Browse the detected media** - shows type, size, and source
4. **Click "📥 Download"** next to any file you want

### 🎮 **Advanced Usage**

#### **Best Detection Results**
- **Play videos** to trigger network requests
- **Navigate streaming sites**: YouTube, Vimeo, Twitch, etc.
- **Visit media-heavy pages**: News sites, video platforms
- **Check social media**: Instagram, Twitter, TikTok videos

#### **Download Options**
- **Custom filenames**: Edit the filename before downloading
- **Batch operations**: Use "Clear All" to manage detected files
- **Manual refresh**: Click "🔄 Refresh" to scan for new media

#### **Settings**
- **Concurrent Downloads**: Adjust simultaneous download limit (3-15)
- **Format Priority**: All formats detected automatically
- **File Management**: Downloads go to your default download folder

## 🎪 Supported Formats

### 📹 **Video Formats**
| Format | Extension | Description |
|--------|-----------|-------------|
| MP4 | `.mp4` | Most common web video format |
| WebM | `.webm` | Modern web video format |
| AVI | `.avi` | Windows video format |
| MKV | `.mkv` | High-quality container format |
| MOV | `.mov` | QuickTime video format |
| FLV | `.flv` | Flash video format |
| TS | `.ts`, `.m2ts` | Transport stream format |
| 3GP | `.3gp` | Mobile video format |

### 🎵 **Audio Formats**
| Format | Extension | Description |
|--------|-----------|-------------|
| MP3 | `.mp3` | Universal audio format |
| FLAC | `.flac` | Lossless audio format |
| WAV | `.wav` | Uncompressed audio |
| AAC | `.aac` | Advanced audio codec |
| OGG | `.ogg` | Open-source audio format |
| M4A | `.m4a` | Apple audio format |
| WMA | `.wma` | Windows audio format |
| OPUS | `.opus` | Modern audio codec |

### 📡 **Streaming Formats**
| Format | Extension | Description |
|--------|-----------|-------------|
| HLS | `.m3u8` | HTTP Live Streaming |
| DASH | `.mpd` | Dynamic Adaptive Streaming |
| ISM | `.ism` | IIS Smooth Streaming |
| F4V/F4A | `.f4v`, `.f4a` | Flash streaming formats |

## 🛠️ Technical Architecture

### 🔍 **Detection Methods**

1. **Network Interception**: Monitors all HTTP requests via webRequest API
2. **DOM Monitoring**: Scans HTML elements and watches for dynamic content  
3. **JavaScript Injection**: Monitors in-page network calls (fetch, XHR, WebSocket, MediaSource)

### 📁 **File Structure**
```
Universal-Media-Downloader/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js          # Network monitoring & download logic
├── content.js             # DOM scanning & media detection
├── injected.js            # In-page network monitoring
├── popup.html             # User interface
├── popup.css              # Anti-shake styling
├── popup.js               # UI logic & interactions
├── icons/                 # Extension icons
├── create_icons.ps1       # PowerShell icon generator
├── create_icons.bat       # Batch icon generator
├── icon_converter.html    # Browser-based icon converter
└── README.md              # This documentation
```

### 🔐 **Required Permissions**
- `activeTab`: Access current tab content
- `storage`: Save settings & preferences  
- `downloads`: Download files to disk
- `webRequest`: Monitor network requests
- `<all_urls>`: Access all websites

## 🐛 Troubleshooting

### ❌ **No Media Detected**
- Check: Page fully loaded?
- Try: Play a video first
- Try: Click "🔄 Refresh" button
- Check: Different websites (YouTube, Vimeo)
- Check: Browser console for errors (F12)

### 📥 **Download Issues**
- Check: Internet connection stable?
- Check: Sufficient disk space?
- Try: Reduce concurrent downloads (Settings)
- Try: Different file formats
- Check: Chrome download settings

### 🔧 **Extension Problems**
- Check: All 4 icon files present in icons/ folder?
- Try: Reload extension (chrome://extensions/)
- Check: Developer mode enabled?
- Try: Remove and reinstall extension
- Check: Chrome version (requires modern browser)

### 🎭 **UI Issues**
- Fixed: Popup shaking (anti-shake technology implemented)
- Fixed: Layout shifts (strict width controls)
- Fixed: Text overflow (ellipsis truncation)
- Check: Browser zoom at 100%?

## ⚖️ Legal & Ethical Guidelines

### ✅ **Acceptable Use**
- Download content you own or created
- Save publicly available, copyright-free media
- Educational and research purposes
- Personal backup of your own content

### ❌ **Prohibited Use**
- Downloading copyrighted content without permission
- Violating terms of service of websites
- Commercial use of protected content
- Redistributing downloaded content

**Always respect copyright laws and website terms of service.**

## 🚀 Upcoming Features

- **File Merging**: Combine M3U8 segments automatically
- **Quality Selection**: Choose video quality before download
- **Playlist Support**: Download entire playlists
- **Format Conversion**: Built-in media conversion
- **Dark Mode**: Toggle dark/light themes
- **Cloud Integration**: Save to Google Drive, Dropbox

## 🤝 Contributing

### 🛠️ **Development Setup**
1. Fork this repository
2. Clone your fork locally
3. Load extension in developer mode
4. Make changes and test
5. Submit pull request with detailed description

### 🐛 **Bug Reports**
Please include:
- Browser version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots or recordings

## 📄 License

This project is open source under the MIT License. See `LICENSE` file for details.

## 🙏 Acknowledgments

- **Chrome Extension APIs**: For powerful browser integration
- **Manifest V3**: Modern extension architecture
- **Open Source Community**: For inspiration and feedback
- **Beta Testers**: For finding bugs and suggesting improvements

---

## 📊 Quick Stats

| Feature | Status |
|---------|--------|
| **Video Formats** | ✅ 15+ supported |
| **Audio Formats** | ✅ 10+ supported |
| **Streaming Formats** | ✅ 5+ supported |
| **Anti-Shake Technology** | ✅ Implemented |
| **Manifest V3** | ✅ Compatible |
| **Cross-Platform** | ✅ Chrome, Edge, Brave |

---

**🎬 Start downloading media with ease!** 

*Built with ❤️ for the web community*