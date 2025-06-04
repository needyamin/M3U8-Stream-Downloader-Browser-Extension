// Content script for M3U8 Stream Downloader
class M3U8ContentDetector {
  constructor() {
    this.detectedUrls = new Set();
    this.init();
  }

  init() {
    // Monitor DOM for M3U8 URLs
    this.scanExistingContent();
    this.observeNewContent();
    
    // Inject script to monitor network requests
    this.injectNetworkMonitor();
    
    // Listen for messages from injected script
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  scanExistingContent() {
    // Scan all links and media elements
    const elements = document.querySelectorAll('a, video, audio, source, link[href*="m3u8"]');
    
    elements.forEach(element => {
      const url = element.href || element.src;
      if (url && this.isM3U8Url(url)) {
        this.reportStream(url);
      }
    });

    // Scan all text content for M3U8 URLs
    this.scanTextContent();
  }

  scanTextContent() {
    const textNodes = this.getTextNodes(document.body);
    const m3u8Regex = /https?:\/\/[^\s]+\.m3u8[^\s]*/gi;
    
    textNodes.forEach(node => {
      const matches = node.textContent.match(m3u8Regex);
      if (matches) {
        matches.forEach(url => this.reportStream(url));
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
      textNodes.push(node);
    }

    return textNodes;
  }

  observeNewContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  scanElement(element) {
    // Check the element itself
    const url = element.href || element.src;
    if (url && this.isM3U8Url(url)) {
      this.reportStream(url);
    }

    // Check all child elements
    const children = element.querySelectorAll('a, video, audio, source, link');
    children.forEach(child => {
      const childUrl = child.href || child.src;
      if (childUrl && this.isM3U8Url(childUrl)) {
        this.reportStream(childUrl);
      }
    });

    // Check text content
    if (element.textContent) {
      const matches = element.textContent.match(/https?:\/\/[^\s]+\.m3u8[^\s]*/gi);
      if (matches) {
        matches.forEach(url => this.reportStream(url));
      }
    }
  }

  injectNetworkMonitor() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  handleMessage(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'M3U8_DETECTED') {
      this.reportStream(event.data.url);
    }
  }

  isM3U8Url(url) {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.includes('.m3u8') || 
             urlObj.search.includes('m3u8') ||
             urlObj.pathname.includes('playlist.m3u8') ||
             urlObj.pathname.includes('index.m3u8');
    } catch (e) {
      return url.includes('.m3u8');
    }
  }

  reportStream(url) {
    if (this.detectedUrls.has(url)) return;
    
    this.detectedUrls.add(url);
    
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'M3U8_FOUND',
      url: url,
      source: 'content',
      timestamp: Date.now()
    }).catch(() => {
      // Ignore errors if background script is not ready
    });
  }
}

// Initialize the detector
new M3U8ContentDetector(); 