# M3U8 Stream Downloader Browser Extension

A powerful Chrome browser extension that automatically detects M3U8 HLS (HTTP Live Stream) streams on web pages and downloads them using multiple threads for faster performance.

## 🎯 Features

- **Automatic Detection**: Monitors all network requests and web pages for M3U8 streams
- **Multi-threaded Downloads**: Downloads stream segments concurrently for maximum speed
- **Beautiful UI**: Modern, intuitive popup interface
- **Flexible Settings**: Configurable concurrent download limits
- **Real-time Monitoring**: Continuously scans for new streams as you browse
- **Smart Parsing**: Handles both absolute and relative M3U8 URLs
- **Progress Tracking**: Visual progress indicators for active downloads

## 📦 Installation

### Chrome Extension Store (Future)
*This extension is currently in development and not yet published to the Chrome Web Store.*

### Manual Installation (Developer Mode)

1. **Download or Clone** this repository to your local machine
2. **Add Icons** (Required):
   - Add the following icon files to the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon32.png` (32x32 pixels) 
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can create these using any image editor or find suitable icons online
3. **Open Chrome** and navigate to `chrome://extensions/`
4. **Enable Developer Mode** by toggling the switch in the top right
5. **Click "Load unpacked"** and select the extension directory
6. **Pin the extension** to your toolbar for easy access

## 🚀 Usage

### Basic Usage

1. **Navigate** to any website that contains HLS video streams
2. **Click the extension icon** in your browser toolbar
3. **Wait for detection** - The extension will automatically scan for M3U8 streams
4. **Download streams** by clicking the "📥 Download" button next to any detected stream

### Advanced Features

#### Settings
- **Concurrent Downloads**: Adjust the number of simultaneous segment downloads (3-15)
- **Custom Filenames**: Specify custom names for downloaded streams
- **Auto-refresh**: The popup automatically refreshes every 5 seconds to show new streams

#### Stream Management
- **Clear All**: Remove all detected streams from the list
- **Refresh**: Manually refresh the stream detection
- **Status Tracking**: Monitor download progress and status

## 🛠️ Technical Details

### How It Works

1. **Network Monitoring**: Uses Chrome's webRequest API to intercept HTTP requests
2. **Content Scanning**: Injects scripts to monitor DOM changes and network calls
3. **M3U8 Parsing**: Extracts segment URLs from M3U8 playlist files
4. **Parallel Downloads**: Downloads segments concurrently using configurable thread limits
5. **File Management**: Saves individual segments using Chrome's downloads API

### Supported Stream Types

- Standard M3U8 playlists
- HLS streams with `.m3u8` extension
- Streams with `application/x-mpegURL` content-type
- Streams with `application/vnd.apple.mpegurl` content-type

### File Output

Currently, the extension downloads stream segments as individual `.ts` files. Each segment is saved with a sequential naming pattern:
```
filename_segment_0001.ts
filename_segment_0002.ts
filename_segment_0003.ts
...
```

## 🔧 Development

### File Structure
```
M3U8-Stream-Downloader/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for stream detection
├── content.js            # Content script for DOM monitoring
├── injected.js           # Injected script for network monitoring
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── icons/                # Extension icons (16, 32, 48, 128px)
└── README.md             # This file
```

### Key Components

- **Background Script**: Handles network request interception and download management
- **Content Script**: Monitors DOM for M3U8 URLs and coordinates with injected scripts
- **Injected Script**: Runs in page context to monitor fetch/XHR requests
- **Popup Interface**: Provides user interaction and stream management

### Permissions Required

- `activeTab`: Access to current tab content
- `storage`: Store extension settings
- `downloads`: Download files to disk
- `webRequest`: Monitor network requests
- `webRequestBlocking`: Block/modify requests if needed
- `<all_urls>`: Access to all websites for stream detection

## ⚠️ Important Notes

### Legal Considerations
- Only download content you have the right to download
- Respect copyright laws and terms of service
- This tool is for legitimate use cases like downloading your own content or publicly available streams

### Browser Compatibility
- Designed for Chrome-based browsers (Chrome, Edge, Brave, etc.)
- Uses Manifest V3 for modern Chrome extension standards
- Requires modern browser with ES6+ support

### Limitations
- Downloads segments individually (not combined into single file)
- Some heavily protected streams may not be detectable
- Rate limiting may affect download speeds on some servers

## 🐛 Troubleshooting

### No Streams Detected
- Ensure the page has fully loaded
- Try refreshing the page and the extension popup
- Check browser console for any errors
- Some streams may be encrypted or protected

### Downloads Failing
- Check your internet connection
- Verify you have sufficient disk space
- Some servers may have rate limiting
- Try reducing concurrent download count

### Extension Not Working
- Ensure Developer Mode is enabled
- Check that all required files are present
- Verify icon files are in the correct format and location
- Reload the extension from `chrome://extensions/`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or report issues.

### Development Setup
1. Clone the repository
2. Load the extension in developer mode
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source. Please check the LICENSE file for details.

## 🙏 Acknowledgments

- Built using Chrome Extension Manifest V3
- Uses modern web APIs for optimal performance
- Inspired by the need for efficient HLS stream downloading

---

**⚡ Happy Streaming!** 📺