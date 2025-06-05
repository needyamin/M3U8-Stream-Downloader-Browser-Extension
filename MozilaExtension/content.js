// Universal Media Downloader - Content Script (Firefox Compatible) - ENHANCED VERSION

// Firefox compatibility: Use browser API if available, fallback to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log('[UMD Content] Content script starting on:', window.location.href);

// Track detected URLs to avoid duplicates
let detectedUrls = new Set();
let isScanning = false;
let scanInterval = null;

// Enhanced media URL patterns for better detection
const MEDIA_PATTERNS = [
    // Video extensions
    /\.(mp4|webm|avi|mkv|mov|wmv|flv|m4v|3gp|ogv|ts|m2ts)(\?[^&\s]*)?$/i,
    // Audio extensions  
    /\.(mp3|wav|flac|aac|ogg|m4a|wma|opus|aiff|ape)(\?[^&\s]*)?$/i,
    // Streaming formats
    /\.(m3u8|mpd|ism|f4v|f4a)(\?[^&\s]*)?$/i,
    // Streaming patterns
    /manifest|playlist|videoplayback|stream|media/i,
    // Data URL media
    /^data:(?:video|audio)\//i
];

// Comprehensive media detection function
function detectMediaUrls() {
    console.log('[UMD Content] 🔍 Starting comprehensive media scan...');
    
    if (isScanning) {
        console.log('[UMD Content] Scan already in progress, skipping...');
        return;
    }
    
    isScanning = true;
    let foundCount = 0;
    
    try {
        // 1. Video and Audio Elements (Primary detection)
        const mediaElements = document.querySelectorAll('video, audio');
        console.log('[UMD Content] Found', mediaElements.length, 'media elements');
        
        mediaElements.forEach(element => {
            // Check src attribute
            if (element.src && isValidMediaUrl(element.src)) {
                if (reportMedia(element.src, 'media-element')) foundCount++;
            }
            
            // Check source children
            const sources = element.querySelectorAll('source');
            sources.forEach(source => {
                if (source.src && isValidMediaUrl(source.src)) {
                    if (reportMedia(source.src, 'source-element')) foundCount++;
                }
            });
            
            // Check currentSrc (for dynamically loaded media)
            if (element.currentSrc && isValidMediaUrl(element.currentSrc)) {
                if (reportMedia(element.currentSrc, 'current-src')) foundCount++;
            }
        });
        
        // 2. Links to media files
        const links = document.querySelectorAll('a[href]');
        console.log('[UMD Content] Scanning', links.length, 'links for media URLs...');
        
        links.forEach(link => {
            if (isValidMediaUrl(link.href)) {
                if (reportMedia(link.href, 'link')) foundCount++;
            }
        });
        
        // 3. Data attributes containing media URLs
        const dataElements = document.querySelectorAll('[data-src], [data-url], [data-video], [data-audio], [data-stream]');
        console.log('[UMD Content] Scanning', dataElements.length, 'data attributes...');
        
        dataElements.forEach(el => {
            ['data-src', 'data-url', 'data-video', 'data-audio', 'data-stream'].forEach(attr => {
                const url = el.getAttribute(attr);
                if (url && isValidMediaUrl(url)) {
                    if (reportMedia(url, 'data-attribute')) foundCount++;
                }
            });
        });
        
        // 4. Text content analysis (for URLs in page text)
        const pageText = document.documentElement.textContent || '';
        const urlMatches = pageText.match(/https?:\/\/[^\s<>"']+/g) || [];
        
        console.log('[UMD Content] Found', urlMatches.length, 'URLs in page text...');
        urlMatches.forEach(url => {
            if (isValidMediaUrl(url)) {
                if (reportMedia(url, 'page-text')) foundCount++;
            }
        });
        
        // 5. JavaScript variables and objects (enhanced detection)
        try {
            const scriptTags = document.querySelectorAll('script:not([src])');
            scriptTags.forEach(script => {
                const content = script.textContent || '';
                
                // Look for common video/audio variable patterns
                const patterns = [
                    /"([^"]*\.(?:mp4|webm|avi|mp3|wav|m3u8|mpd)[^"]*)"(?:\?[^"]*)?/gi,
                    /'([^']*\.(?:mp4|webm|avi|mp3|wav|m3u8|mpd)[^']*)'(?:\?[^']*)?/gi,
                    /url\s*:\s*["']([^"']*(?:mp4|webm|avi|mp3|wav|m3u8|mpd)[^"']*)["']/gi,
                    /src\s*:\s*["']([^"']*(?:mp4|webm|avi|mp3|wav|m3u8|mpd)[^"']*)["']/gi
                ];
                
                patterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        if (isValidMediaUrl(match[1])) {
                            if (reportMedia(match[1], 'javascript-var')) foundCount++;
                        }
                    }
                });
            });
        } catch (e) {
            console.log('[UMD Content] JavaScript scanning error:', e.message);
        }
        
        // 6. Meta tags with media URLs
        const metaTags = document.querySelectorAll('meta[content]');
        metaTags.forEach(meta => {
            const content = meta.getAttribute('content');
            if (content && isValidMediaUrl(content)) {
                if (reportMedia(content, 'meta-tag')) foundCount++;
            }
        });
        
        console.log('[UMD Content] ✅ Scan complete! Found', foundCount, 'new media URLs');
        console.log('[UMD Content] Total unique URLs detected:', detectedUrls.size);
        
    } catch (error) {
        console.error('[UMD Content] ❌ Error during media scan:', error);
    }
    isScanning = false;
}

// Enhanced URL validation
function isValidMediaUrl(url) {
    if (!url || typeof url !== 'string' || url.length < 4) {
        return false;
    }
    
    // Convert relative URLs to absolute
    try {
        url = new URL(url, window.location.href).href;
    } catch (e) {
        return false;
    }
    
    // Skip common non-media patterns
    const skipPatterns = [
        'favicon', 'icon', 'logo', 'thumbnail', 'avatar', 'profile',
        'analytics', 'tracking', 'beacon', 'pixel', 'ads', 'advertisement',
        'embed.js', 'player.js', 'config.js', 'jwplayer', 'videojs'
    ];
    
    const urlLower = url.toLowerCase();
    if (skipPatterns.some(pattern => urlLower.includes(pattern))) {
        return false;
    }
    
    // Skip images unless they might be media
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?|$)/i.test(url)) {
        return false;
    }
    
    // Check against media patterns
    return MEDIA_PATTERNS.some(pattern => pattern.test(url));
}

// Report detected media to background script
async function reportMedia(url, source) {
    if (!url || detectedUrls.has(url)) {
        return false;
    }
    
    detectedUrls.add(url);
    
    console.log('[UMD Content] 📱 Reporting media:', url, 'from', source);
    
    try {
        const response = await browserAPI.runtime.sendMessage({
            type: 'MEDIA_FOUND',
            url: url,
            source: source,
            timestamp: Date.now()
        });
        
        console.log('[UMD Content] Media report response:', response);
        return response && response.success;
    } catch (error) {
        console.error('[UMD Content] ❌ Failed to report media:', error);
        return false;
    }
}

// Initialize content script
function initialize() {
    console.log('[UMD Content] Initializing content script...');
    
    // Initial scan
    detectMediaUrls();
    
    // Set up periodic scanning
    scanInterval = setInterval(detectMediaUrls, 5000);
    
    // Monitor DOM changes
    observePageChanges();
    
    // Monitor network requests
    setupNetworkMonitoring();
    
    console.log('[UMD Content] ✅ Content script initialized');
}

// Monitor DOM changes for new media
function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        
        mutations.forEach(mutation => {
            // Check for new nodes
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if it's a media element or contains media
                    if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO' ||
                        node.querySelector('video, audio') ||
                        node.querySelector('[src*=".mp4"], [src*=".mp3"], [src*=".m3u8"]')) {
                        shouldScan = true;
                    }
                }
            });
            
            // Check for attribute changes on media elements
            if (mutation.type === 'attributes' && 
                (mutation.target.tagName === 'VIDEO' || mutation.target.tagName === 'AUDIO') &&
                (mutation.attributeName === 'src' || mutation.attributeName === 'currentSrc')) {
                shouldScan = true;
            }
        });
        
        if (shouldScan) {
            console.log('[UMD Content] DOM changes detected, scanning for new media...');
            setTimeout(() => detectMediaUrls(), 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'data-src', 'data-url']
    });
    
    console.log('[UMD Content] ✅ DOM observer active');
}

// Monitor network requests using XMLHttpRequest and fetch interception
function setupNetworkMonitoring() {
    console.log('[UMD Content] Setting up network monitoring...');
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (isValidMediaUrl(url)) {
            console.log('[UMD Content] XHR media request detected:', url);
            reportMedia(url, 'xhr-request');
        }
        return originalXHROpen.apply(this, arguments);
    };
    
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url) {
        if (typeof url === 'string' && isValidMediaUrl(url)) {
            console.log('[UMD Content] Fetch media request detected:', url);
            reportMedia(url, 'fetch-request');
        }
        return originalFetch.apply(this, arguments);
    };
    
    console.log('[UMD Content] ✅ Network monitoring active');
}

// Start initialization
initialize();

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SCAN_MEDIA') {
        console.log('[UMD Content] Manual scan requested');
        detectMediaUrls();
        sendResponse({ success: true });
    }
    return true;
});

console.log('[UMD Content] Content script loaded on:', window.location.href); 