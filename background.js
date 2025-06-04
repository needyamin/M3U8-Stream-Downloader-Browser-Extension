// Background script for M3U8 Stream Downloader
class M3U8Downloader {
  constructor() {
    this.detectedStreams = new Map();
    this.downloadQueue = new Map();
    this.maxConcurrentDownloads = 6;
    this.init();
  }

  init() {
    // Listen for web requests to detect M3U8 files
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
    if (details.url.includes('.m3u8') || details.url.includes('m3u8')) {
      this.addDetectedStream(details.url, details.tabId);
    }
  }

  onResponseStarted(details) {
    const contentType = this.getHeader(details.responseHeaders, 'content-type');
    if (contentType && (
      contentType.includes('application/x-mpegURL') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      details.url.includes('.m3u8')
    )) {
      this.addDetectedStream(details.url, details.tabId);
    }
  }

  addDetectedStream(url, tabId) {
    const streamId = `${tabId}_${Date.now()}_${Math.random()}`;
    this.detectedStreams.set(streamId, {
      url: url,
      tabId: tabId,
      detected: new Date(),
      status: 'detected'
    });

    // Notify popup if open
    chrome.runtime.sendMessage({
      type: 'STREAM_DETECTED',
      stream: { id: streamId, url: url, tabId: tabId }
    }).catch(() => {}); // Ignore if popup not open
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

      case 'M3U8_FOUND':
        // Handle M3U8 URLs found by content script
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
      
      // Fetch and parse M3U8 playlist
      const playlist = await this.fetchM3U8(stream.url);
      const segments = this.parseM3U8(playlist, stream.url);
      
      if (segments.length === 0) {
        throw new Error('No segments found in M3U8 playlist');
      }

      // Download segments in parallel
      const downloadedSegments = await this.downloadSegments(segments, options);
      
      // Combine segments (for now, we'll download them individually)
      // In a real implementation, you'd want to combine them into a single file
      await this.saveSegments(downloadedSegments, options.filename || 'stream');
      
      stream.status = 'completed';
      
    } catch (error) {
      console.error('Download failed:', error);
      stream.status = 'failed';
      stream.error = error.message;
    }
  }

  async fetchM3U8(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch M3U8: ${response.status}`);
    }
    return await response.text();
  }

  parseM3U8(content, baseUrl) {
    const lines = content.split('\n').map(line => line.trim());
    const segments = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments and empty lines
      if (line.startsWith('#') || !line) continue;
      
      // This is a segment URL
      let segmentUrl = line;
      if (!segmentUrl.startsWith('http')) {
        // Relative URL, make it absolute
        const base = new URL(baseUrl);
        segmentUrl = new URL(segmentUrl, base.origin + base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)).href;
      }
      
      segments.push({
        url: segmentUrl,
        index: segments.length
      });
    }
    
    return segments;
  }

  async downloadSegments(segments, options) {
    const downloadedSegments = [];
    const concurrentLimit = Math.min(options.concurrentDownloads || this.maxConcurrentDownloads, segments.length);
    
    // Create chunks for parallel processing
    const chunks = [];
    for (let i = 0; i < segments.length; i += concurrentLimit) {
      chunks.push(segments.slice(i, i + concurrentLimit));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (segment) => {
        try {
          const response = await fetch(segment.url);
          if (!response.ok) {
            throw new Error(`Failed to download segment ${segment.index}: ${response.status}`);
          }
          
          const blob = await response.blob();
          return {
            index: segment.index,
            blob: blob,
            url: segment.url
          };
        } catch (error) {
          console.error(`Error downloading segment ${segment.index}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      downloadedSegments.push(...results.filter(r => r !== null));
    }
    
    // Sort by index to maintain order
    return downloadedSegments.sort((a, b) => a.index - b.index);
  }

  async saveSegments(segments, filename) {
    // For Chrome extension, we'll save each segment as a separate file
    // In a more advanced implementation, you could combine them using FFmpeg or similar
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const paddedIndex = String(i).padStart(4, '0');
      
      try {
        // Convert blob to data URL for download
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(segment.blob);
        });
        
        // Use Chrome downloads API
        await chrome.downloads.download({
          url: dataUrl,
          filename: `${filename}_segment_${paddedIndex}.ts`,
          saveAs: false
        });
        
      } catch (error) {
        console.error(`Failed to save segment ${i}:`, error);
      }
    }
  }

  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }
}

// Initialize the downloader
const downloader = new M3U8Downloader(); 