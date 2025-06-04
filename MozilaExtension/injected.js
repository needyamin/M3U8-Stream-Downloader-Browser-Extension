// Injected script to monitor network requests for all media types
(function() {
  'use strict';
  
  // Store original functions
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  function isMediaUrl(url) {
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
      'manifest.mpd', 'chunk_', 'segment_', 'frag_', 'init.mp4', 'video/', 'audio/',
      'hls', 'dash', 'stream'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Skip obvious non-media files
    const skipPatterns = [
      'favicon', 'thumbnail', 'preview', 'poster', 'logo', 'icon', 
      '.gif', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.css', '.js',
      'analytics', 'tracking', 'beacon', 'pixel'
    ];
    
    if (skipPatterns.some(pattern => urlLower.includes(pattern))) {
      return false;
    }
    
    return mediaExtensions.some(ext => urlLower.includes(ext)) ||
           mediaPatterns.some(pattern => urlLower.includes(pattern));
  }

  function reportMedia(url) {
    window.postMessage({
      type: 'MEDIA_DETECTED',
      url: url,
      timestamp: Date.now()
    }, '*');
  }

  // Override fetch
  window.fetch = function(...args) {
    const [resource, config] = args;
    let url = '';
    
    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof Request) {
      url = resource.url;
    }
    
    if (isMediaUrl(url)) {
      reportMedia(url);
    }
    
    return originalFetch.apply(this, args);
  };

  // Override XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    
    if (isMediaUrl(url)) {
      reportMedia(url);
    }
    
    return originalXHROpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    // Additional check on send in case URL was modified
    if (this._url && isMediaUrl(this._url)) {
      reportMedia(this._url);
    }
    
    return originalXHRSend.apply(this, args);
  };

  // Monitor WebSocket connections (some streaming implementations use WebSockets)
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (isMediaUrl(url)) {
      reportMedia(url);
    }
    return new originalWebSocket(url, protocols);
  };

  // Monitor video/audio elements for source changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'src' || mutation.attributeName === 'href')) {
        const element = mutation.target;
        const url = element.src || element.href;
        if (url && isMediaUrl(url)) {
          reportMedia(url);
        }
      }
    });
  });

  observer.observe(document, {
    attributes: true,
    subtree: true,
    attributeFilter: ['src', 'href']
  });

  // Check for MediaSource Extensions (MSE) usage
  if (window.MediaSource) {
    const originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;
    MediaSource.prototype.addSourceBuffer = function(mimeType) {
      if (mimeType) {
        console.log('MediaSource detected:', mimeType);
        
        // Common streaming formats
        if (mimeType.includes('mp2t') || mimeType.includes('mp4') || 
            mimeType.includes('webm') || mimeType.includes('audio/')) {
          // This might be streaming content
          console.log('Potential streaming media detected:', mimeType);
        }
      }
      return originalAddSourceBuffer.call(this, mimeType);
    };
  }

  // Monitor HTMLVideoElement and HTMLAudioElement events
  function monitorMediaElement(element) {
    ['loadstart', 'loadedmetadata', 'canplay'].forEach(eventType => {
      element.addEventListener(eventType, function() {
        if (this.src && isMediaUrl(this.src)) {
          reportMedia(this.src);
        }
        
        // Check for source elements
        const sources = this.querySelectorAll('source');
        sources.forEach(source => {
          if (source.src && isMediaUrl(source.src)) {
            reportMedia(source.src);
          }
        });
      });
    });
  }

  // Monitor existing and new video/audio elements
  document.querySelectorAll('video, audio').forEach(monitorMediaElement);
  
  const mediaObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
              monitorMediaElement(node);
            }
            // Check child video/audio elements
            node.querySelectorAll && node.querySelectorAll('video, audio').forEach(monitorMediaElement);
          }
        });
      }
    });
  });

  mediaObserver.observe(document, { subtree: true, childList: true });

  // Monitor URL changes (for Single Page Applications)
  let currentUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      // Re-scan the page after URL change
      setTimeout(() => {
        const mediaLinks = document.querySelectorAll(`
          a[href*=".mp4"], a[href*=".mp3"], a[href*=".avi"], a[href*=".mkv"],
          a[href*=".mov"], a[href*=".flv"], a[href*=".webm"], a[href*=".wav"],
          a[href*=".flac"], a[href*=".aac"], a[href*=".ogg"], a[href*=".m3u8"],
          link[href*=".mp4"], link[href*=".mp3"], link[href*=".m3u8"]
        `);
        
        mediaLinks.forEach(link => {
          if (isMediaUrl(link.href)) {
            reportMedia(link.href);
          }
        });
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Check for blob URLs (often used for media)
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = function(object) {
    const url = originalCreateObjectURL.call(this, object);
    
    // Check if it's likely a media blob
    if (object instanceof Blob) {
      if (object.type && (object.type.startsWith('video/') || object.type.startsWith('audio/'))) {
        console.log('Media blob URL created:', url, 'Type:', object.type);
        reportMedia(url);
      }
    }
    
    return url;
  };

  console.log('Universal Media Detector injected and monitoring...');
})(); 