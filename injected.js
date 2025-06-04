// Injected script to monitor network requests in page context
(function() {
  'use strict';
  
  // Store original functions
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  function isM3U8Url(url) {
    if (!url) return false;
    return url.includes('.m3u8') || 
           url.includes('m3u8') ||
           url.includes('playlist') ||
           url.toLowerCase().includes('hls');
  }

  function reportM3U8(url) {
    window.postMessage({
      type: 'M3U8_DETECTED',
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
    
    if (isM3U8Url(url)) {
      reportM3U8(url);
    }
    
    return originalFetch.apply(this, args);
  };

  // Override XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    
    if (isM3U8Url(url)) {
      reportM3U8(url);
    }
    
    return originalXHROpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    // Additional check on send in case URL was modified
    if (this._url && isM3U8Url(this._url)) {
      reportM3U8(this._url);
    }
    
    return originalXHRSend.apply(this, args);
  };

  // Monitor WebSocket connections (some HLS implementations use WebSockets)
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (isM3U8Url(url)) {
      reportM3U8(url);
    }
    return new originalWebSocket(url, protocols);
  };

  // Monitor video elements for source changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'src' || mutation.attributeName === 'href')) {
        const element = mutation.target;
        const url = element.src || element.href;
        if (url && isM3U8Url(url)) {
          reportM3U8(url);
        }
      }
    });
  });

  observer.observe(document, {
    attributes: true,
    subtree: true,
    attributeFilter: ['src', 'href']
  });

  // Check for media source extensions
  if (window.MediaSource) {
    const originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;
    MediaSource.prototype.addSourceBuffer = function(mimeType) {
      if (mimeType && mimeType.includes('mp2t')) {
        // This might be HLS content
        console.log('HLS MediaSource detected:', mimeType);
      }
      return originalAddSourceBuffer.call(this, mimeType);
    };
  }

  // Monitor URL changes (for SPAs)
  let currentUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      // Re-scan the page after URL change
      setTimeout(() => {
        const links = document.querySelectorAll('a[href*="m3u8"], link[href*="m3u8"]');
        links.forEach(link => {
          if (isM3U8Url(link.href)) {
            reportM3U8(link.href);
          }
        });
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  console.log('M3U8 Stream Detector injected and monitoring...');
})(); 