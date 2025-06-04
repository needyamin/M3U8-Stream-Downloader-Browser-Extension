// Content script for Universal Media Downloader
class MediaContentDetector {
  constructor() {
    this.detectedUrls = new Set();
    this.init();
  }

  init() {
    this.scanExistingContent();
    this.setupObservers();
    this.injectDetectionScript();
  }

  setupObservers() {
    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node);
            }
          });
        } else if (mutation.type === 'attributes' && 
                   (mutation.attributeName === 'src' || mutation.attributeName === 'href')) {
          this.scanElement(mutation.target);
        }
      });
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href']
    });

    // Listen for messages from injected script
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  scanExistingContent() {
    // Scan all media elements and links
    const elements = document.querySelectorAll(`
      a, video, audio, source, embed, object,
      link[href*=".mp4"], link[href*=".mp3"], link[href*=".m3u8"],
      [src*=".mp4"], [src*=".mp3"], [src*=".avi"], [src*=".mkv"], 
      [src*=".mov"], [src*=".flv"], [src*=".webm"], [src*=".m4v"],
      [src*=".wav"], [src*=".flac"], [src*=".aac"], [src*=".ogg"], 
      [src*=".m4a"], [src*=".wma"], [src*=".m3u8"], [src*=".mpd"]
    `);
    
    elements.forEach(element => {
      const url = element.href || element.src || element.data;
      if (url && this.isMediaUrl(url)) {
        this.reportMedia(url);
      }
    });

    // Scan all text content for media URLs
    this.scanTextContent();
  }

  scanTextContent() {
    const textNodes = this.getTextNodes(document.body);
    const mediaRegex = /https?:\/\/[^\s]+\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v|mp3|wav|flac|aac|ogg|wma|m4a|m3u8|mpd)[^\s]*/gi;
    
    textNodes.forEach(node => {
      const matches = node.textContent.match(mediaRegex);
      if (matches) {
        matches.forEach(url => this.reportMedia(url));
      }
    });
  }

  getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim().length > 0) {
        textNodes.push(node);
      }
    }

    return textNodes;
  }

  injectDetectionScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  scanElement(element) {
    // Check the element itself
    const url = element.href || element.src || element.data;
    if (url && this.isMediaUrl(url)) {
      this.reportMedia(url);
    }

    // Check all child elements
    const children = element.querySelectorAll(`
      a, video, audio, source, embed, object,
      [src*=".mp4"], [src*=".mp3"], [src*=".avi"], [src*=".mkv"],
      [src*=".mov"], [src*=".flv"], [src*=".webm"], [src*=".wav"],
      [src*=".flac"], [src*=".aac"], [src*=".ogg"], [src*=".m3u8"]
    `);
    
    children.forEach(child => {
      const childUrl = child.href || child.src || child.data;
      if (childUrl && this.isMediaUrl(childUrl)) {
        this.reportMedia(childUrl);
      }
    });

    // Check text content for media URLs
    if (element.textContent) {
      const mediaRegex = /https?:\/\/[^\s]+\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v|mp3|wav|flac|aac|ogg|wma|m4a|m3u8|mpd)[^\s]*/gi;
      const matches = element.textContent.match(mediaRegex);
      if (matches) {
        matches.forEach(url => this.reportMedia(url));
      }
    }
  }

  handleMessage(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'MEDIA_DETECTED') {
      this.reportMedia(event.data.url);
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
      'manifest.mpd', 'chunk_', 'segment_', 'frag_', 'init.mp4', 'video/', 'audio/'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Skip obvious non-media files
    const skipPatterns = [
      'favicon', 'thumbnail', 'preview', 'poster', 'logo', 'icon',
      '.gif', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.css', '.js'
    ];
    
    if (skipPatterns.some(pattern => urlLower.includes(pattern))) {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      
      // Skip data URLs that are too long (likely images)
      if (url.startsWith('data:') && url.length > 1000) {
        return false;
      }
      
      return mediaExtensions.some(ext => urlLower.includes(ext)) ||
             mediaPatterns.some(pattern => urlLower.includes(pattern));
    } catch (e) {
      return mediaExtensions.some(ext => urlLower.includes(ext));
    }
  }

  reportMedia(url) {
    if (this.detectedUrls.has(url)) return;
    
    this.detectedUrls.add(url);
    
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'MEDIA_FOUND',
      url: url,
      source: 'content',
      timestamp: Date.now()
    }).catch(() => {
      // Ignore errors if background script is not ready
    });
  }
}

// Initialize the detector
new MediaContentDetector(); 