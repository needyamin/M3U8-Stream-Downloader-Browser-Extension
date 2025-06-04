// Universal Media Downloader - Background Script
class MediaDownloader {
  constructor() {
    this.detectedStreams = new Map();
    this.downloadQueue = new Map();
    this.init();
  }

  init() {
    // Listen for web requests to detect media files
    chrome.webRequest.onBeforeRequest.addListener(
      this.onBeforeRequest.bind(this),
      { urls: ["<all_urls>"] },
      ["requestBody"]
    );

    chrome.webRequest.onResponseStarted.addListener(
      this.onResponseStarted.bind(this),
      { urls: ["<all_urls>"] },
      ["responseHeaders"]
    );

    // Listen for messages from content script and popup
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
  }

  onBeforeRequest(details) {
    if (this.isMediaUrl(details.url)) {
      this.addDetectedStream(details.url, details.tabId);
    }
  }

  onResponseStarted(details) {
    const contentType = this.getHeader(details.responseHeaders, 'content-type');
    if (this.isMediaContentType(contentType) || this.isMediaUrl(details.url)) {
      this.addDetectedStream(details.url, details.tabId);
    }
  }

  isMediaUrl(url) {
    if (!url) return false;
    
    const mediaExtensions = [
      // Video formats
      '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv',
      '.ts', '.m2ts', '.mts', '.vob', '.asf', '.rm', '.rmvb', '.divx', '.xvid',
      // Audio formats  
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.ape',
      // Streaming formats
      '.m3u8', '.mpd', '.ism', '.f4v', '.f4a'
    ];
    
    const mediaPatterns = [
      'videoplayback', 'video_ts', 'playlist.m3u8', 'index.m3u8', 'master.m3u8',
      'manifest.mpd', 'chunk_', 'segment_', 'frag_', 'init.mp4'
    ];
    
    const urlLower = url.toLowerCase();
    
    return mediaExtensions.some(ext => urlLower.includes(ext)) ||
           mediaPatterns.some(pattern => urlLower.includes(pattern));
  }

  isMediaContentType(contentType) {
    if (!contentType) return false;
    
    const mediaTypes = [
      'video/', 'audio/', 'application/x-mpegurl', 'application/vnd.apple.mpegurl',
      'application/dash+xml', 'application/f4v', 'application/f4a',
      'application/x-flv', 'application/x-shockwave-flash'
    ];
    
    return mediaTypes.some(type => contentType.toLowerCase().includes(type));
  }

  addDetectedStream(url, tabId) {
    // Skip very small files and common non-media patterns
    if (this.shouldSkipUrl(url)) return;
    
    const streamId = `${tabId}_${Date.now()}_${Math.random()}`;
    const mediaType = this.getMediaType(url);
    const fileSize = this.extractFileSize(url);
    
    this.detectedStreams.set(streamId, {
      url: url,
      tabId: tabId,
      detected: new Date(),
      status: 'detected',
      type: mediaType,
      fileSize: fileSize
    });

    // Notify popup if open
    chrome.runtime.sendMessage({
      type: 'STREAM_DETECTED',
      stream: { id: streamId, url: url, tabId: tabId, type: mediaType }
    }).catch(() => {}); // Ignore if popup not open
  }

  shouldSkipUrl(url) {
    const skipPatterns = [
      'favicon', 'thumbnail', 'preview', 'poster', 'logo', 'icon',
      'analytics', 'tracking', 'beacon', 'pixel', 'ad.', 'ads.',
      '.gif', '.jpg', '.jpeg', '.png', '.webp', '.svg'
    ];
    
    const urlLower = url.toLowerCase();
    return skipPatterns.some(pattern => urlLower.includes(pattern)) ||
           url.length > 2000; // Skip extremely long URLs
  }

  getMediaType(url) {
    const urlLower = url.toLowerCase();
    
    // Video formats
    if (urlLower.includes('.mp4') || urlLower.includes('video/mp4')) return 'Video (MP4)';
    if (urlLower.includes('.webm')) return 'Video (WebM)';
    if (urlLower.includes('.avi')) return 'Video (AVI)';
    if (urlLower.includes('.mkv')) return 'Video (MKV)';
    if (urlLower.includes('.mov')) return 'Video (MOV)';
    if (urlLower.includes('.flv')) return 'Video (FLV)';
    if (urlLower.includes('.ts') || urlLower.includes('.m2ts')) return 'Video (TS)';
    
    // Audio formats
    if (urlLower.includes('.mp3')) return 'Audio (MP3)';
    if (urlLower.includes('.wav')) return 'Audio (WAV)';
    if (urlLower.includes('.flac')) return 'Audio (FLAC)';
    if (urlLower.includes('.aac')) return 'Audio (AAC)';
    if (urlLower.includes('.ogg')) return 'Audio (OGG)';
    if (urlLower.includes('.m4a')) return 'Audio (M4A)';
    
    // Streaming formats
    if (urlLower.includes('.m3u8') || urlLower.includes('m3u8')) return 'HLS Stream (M3U8)';
    if (urlLower.includes('.mpd')) return 'DASH Stream (MPD)';
    
    // Generic detection based on content or URL patterns
    if (urlLower.includes('video')) return 'Video';
    if (urlLower.includes('audio')) return 'Audio';
    
    return 'Media File';
  }

  extractFileSize(url) {
    // Try to extract file size from URL parameters
    try {
      const urlObj = new URL(url);
      const sizeParam = urlObj.searchParams.get('clen') || 
                       urlObj.searchParams.get('size') || 
                       urlObj.searchParams.get('bytes');
      if (sizeParam) {
        const size = parseInt(sizeParam);
        return this.formatFileSize(size);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
    return 'Unknown';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async onMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'GET_STREAMS':
        sendResponse({ streams: Array.from(this.detectedStreams.entries()) });
        break;
      
      case 'DOWNLOAD_STREAM':
        this.downloadStream(request.streamId, request.options);
        sendResponse({ success: true });
        break;
      
      case 'CLEAR_STREAMS':
        this.detectedStreams.clear();
        sendResponse({ success: true });
        break;

      case 'MEDIA_FOUND':
        // Handle media URLs found by content script
        if (request.url && sender.tab) {
          this.addDetectedStream(request.url, sender.tab.id);
        }
        sendResponse({ success: true });
        break;
    }
  }

  async downloadStream(streamId, options = {}) {
    const stream = this.detectedStreams.get(streamId);
    if (!stream) return;

    try {
      stream.status = 'downloading';
      
      if (stream.type.includes('M3U8') || stream.url.includes('.m3u8')) {
        // Handle M3U8 streams
        await this.downloadM3U8Stream(stream, options);
      } else {
        // Handle direct media files
        await this.downloadDirectFile(stream, options);
      }
      
      stream.status = 'completed';
      
    } catch (error) {
      console.error('Download failed:', error);
      stream.status = 'failed';
      stream.error = error.message;
    }
  }

  async downloadDirectFile(stream, options) {
    const filename = this.generateFilename(stream.url, options.filename);
    
    try {
      // Use Chrome downloads API for direct download
      await chrome.downloads.download({
        url: stream.url,
        filename: filename,
        saveAs: false
      });
    } catch (error) {
      // If direct download fails, try with fetch
      console.log('Direct download failed, trying fetch method...');
      const response = await fetch(stream.url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);
      
      await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      });
    }
  }

  async downloadM3U8Stream(stream, options) {
    try {
      // For M3U8, try to download the playlist file first
      const playlistFilename = this.generateFilename(stream.url, options.filename, '.m3u8');
      
      // Download the M3U8 playlist file
      await chrome.downloads.download({
        url: stream.url,
        filename: playlistFilename,
        saveAs: false
      });
      
      // Optional: Also try to fetch and analyze the playlist
      try {
        const response = await fetch(stream.url);
        const playlist = await response.text();
        
        // Create a combined playlist with absolute URLs
        const absolutePlaylist = this.convertToAbsoluteUrls(playlist, stream.url);
        const blob = new Blob([absolutePlaylist], { type: 'application/x-mpegURL' });
        const dataUrl = await this.blobToDataUrl(blob);
        
        const absoluteFilename = this.generateFilename(stream.url, options.filename + '_absolute', '.m3u8');
        await chrome.downloads.download({
          url: dataUrl,
          filename: absoluteFilename,
          saveAs: false
        });
        
      } catch (e) {
        console.log('Could not process M3U8 playlist:', e);
      }
      
    } catch (error) {
      throw new Error(`M3U8 download failed: ${error.message}`);
    }
  }

  convertToAbsoluteUrls(playlist, baseUrl) {
    const lines = playlist.split('\n');
    const baseUrlObj = new URL(baseUrl);
    const basePath = baseUrlObj.origin + baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);
    
    return lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('http')) {
        // Convert relative URL to absolute
        return basePath + trimmedLine;
      }
      return line;
    }).join('\n');
  }

  generateFilename(url, customName, extension = null) {
    if (customName && !customName.includes('.')) {
      // Add appropriate extension
      if (extension) {
        return customName + extension;
      } else {
        const ext = this.extractExtension(url);
        return customName + (ext ? '.' + ext : '.mp4');
      }
    }
    
    if (customName) {
      return customName;
    }
    
    try {
      const urlObj = new URL(url);
      let filename = urlObj.pathname.split('/').pop();
      
      if (!filename || filename.length < 3) {
        filename = 'media_' + Date.now();
      }
      
      // Ensure it has an extension
      if (!filename.includes('.')) {
        const ext = this.extractExtension(url);
        filename += '.' + (ext || 'mp4');
      }
      
      return filename;
    } catch (e) {
      return 'media_' + Date.now() + (extension || '.mp4');
    }
  }

  extractExtension(url) {
    const urlLower = url.toLowerCase();
    const extensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'm3u8', 'ts'];
    
    for (const ext of extensions) {
      if (urlLower.includes('.' + ext)) {
        return ext;
      }
    }
    return null;
  }

  async blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }
}

// Initialize the downloader
const downloader = new MediaDownloader(); 