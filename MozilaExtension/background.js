// Universal Media Downloader - Background Script (Firefox Compatible) - PRODUCTION VERSION

// Firefox compatibility: Use browser API if available, fallback to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log('[UMD Background] Background script starting...');
console.log('[UMD Background] Browser API:', typeof browserAPI);

// Simple storage for detected media
let detectedMedia = new Map();

// Update badge with current media count
function updateBadge() {
    const count = detectedMedia.size;
    const badgeText = count > 0 ? count.toString() : '';
    
    try {
        // Firefox uses different API methods
        if (typeof browser !== 'undefined' && browser.browserAction) {
            // Firefox
            browser.browserAction.setBadgeText({ text: badgeText });
            browser.browserAction.setBadgeBackgroundColor({ color: '#007cba' });
        } else if (chrome && chrome.browserAction) {
            // Chrome
            chrome.browserAction.setBadgeText({ text: badgeText });
            chrome.browserAction.setBadgeBackgroundColor({ color: '#007cba' });
        }
        console.log('[UMD Background] Badge updated:', badgeText, 'total media:', count);
    } catch (error) {
        console.log('[UMD Background] Could not update badge:', error.message);
    }
}

// Check if URL is actually a media file
function isActualMediaUrl(url) {
    // Direct video file extensions
    const videoExtensions = [
        '.mp4', '.webm', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.m4v',
        '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'
    ];
    
    // Streaming formats
    const streamingFormats = [
        '.m3u8', '.mpd'
    ];
    
    // Skip non-playable formats
    const skipFormats = [
        '.ts', '.f4v', 'segment', 'chunk', 'fragment'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Skip non-playable formats
    if (skipFormats.some(format => urlLower.includes(format))) {
        console.log('[UMD Background] Skipping non-playable format:', url);
        return false;
    }
    
    // Check for direct video file extensions
    const hasVideoExtension = videoExtensions.some(ext => urlLower.endsWith(ext));
    if (hasVideoExtension) {
        return true;
    }
    
    // Check for streaming formats
    const hasStreamingFormat = streamingFormats.some(ext => urlLower.endsWith(ext));
    if (hasStreamingFormat) {
        return true;
    }
    
    // Check for common video URL patterns
    const videoPatterns = [
        'videoplayback',
        'video.mp4',
        'video.webm',
        'media.mp4',
        'media.webm',
        'play.mp4',
        'play.webm',
        'master.m3u8',
        'playlist.m3u8',
        'manifest.mpd'
    ];
    
    return videoPatterns.some(pattern => urlLower.includes(pattern));
}

// Add media from any source
function addDetectedMedia(url, source = 'unknown', tabId = null) {
    console.log('[UMD Background] Adding media:', url, 'from:', source, 'tab:', tabId);
    
    if (!url || typeof url !== 'string') {
        console.log('[UMD Background] Invalid URL, skipping');
        return false;
    }
    
    // Skip very common non-media patterns
    const skipPatterns = [
        'favicon', 'icon', 'logo', 'thumbnail', 'avatar', 'profile',
        'analytics', 'tracking', 'beacon', 'pixel', 'ads', 'advertisement',
        '.gif', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico',
        '.css', '.js', '.json', '.xml', '.txt', '.html', '.php'
    ];
    
    const urlLower = url.toLowerCase();
    if (skipPatterns.some(pattern => urlLower.includes(pattern))) {
        console.log('[UMD Background] Skipping non-media pattern:', url);
        return false;
    }
    
    // Check if URL is actually a media file
    if (!isActualMediaUrl(url)) {
        console.log('[UMD Background] Not a valid media URL:', url);
        return false;
    }
    
    // Check for duplicates by URL (more efficient than checking all entries)
    for (const [mediaId, mediaData] of detectedMedia) {
        if (mediaData.url === url) {
            console.log('[UMD Background] Duplicate URL, skipping:', url);
            return false;
        }
    }
    
    // Create unique ID
    const mediaId = `${tabId || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine media type
    let type = 'Media File';
    
    if (urlLower.endsWith('.mp4')) type = 'Video (MP4)';
    else if (urlLower.endsWith('.webm')) type = 'Video (WebM)';
    else if (urlLower.endsWith('.avi')) type = 'Video (AVI)';
    else if (urlLower.endsWith('.mkv')) type = 'Video (MKV)';
    else if (urlLower.endsWith('.mov')) type = 'Video (MOV)';
    else if (urlLower.endsWith('.wmv')) type = 'Video (WMV)';
    else if (urlLower.endsWith('.flv')) type = 'Video (FLV)';
    else if (urlLower.endsWith('.mp3')) type = 'Audio (MP3)';
    else if (urlLower.endsWith('.wav')) type = 'Audio (WAV)';
    else if (urlLower.endsWith('.flac')) type = 'Audio (FLAC)';
    else if (urlLower.endsWith('.aac')) type = 'Audio (AAC)';
    else if (urlLower.endsWith('.ogg')) type = 'Audio (OGG)';
    else if (urlLower.endsWith('.m4a')) type = 'Audio (M4A)';
    else if (urlLower.endsWith('.m3u8')) type = 'HLS Stream (M3U8)';
    else if (urlLower.endsWith('.mpd')) type = 'DASH Stream (MPD)';
    else if (urlLower.includes('video')) type = 'Video';
    else if (urlLower.includes('audio')) type = 'Audio';
    
    const mediaData = {
        id: mediaId,
        url: url,
        type: type,
        source: source,
        detected: new Date(),
        tabId: tabId,
        status: 'detected',
        size: null // Will be updated when fetched
    };
    
    detectedMedia.set(mediaId, mediaData);
    console.log('[UMD Background] ✅ Media added:', url, '→', type);
    console.log('[UMD Background] Total media in storage:', detectedMedia.size);
    
    // Fetch file size
    fetchFileSize(url, mediaId);
    
    // Update badge immediately
    updateBadge();
    
    return true;
}

// Fetch file size for a media URL
async function fetchFileSize(url, mediaId) {
    try {
        console.log('[UMD Background] Fetching size for:', url);
        
        // For streaming URLs, set streaming size
        if (url.toLowerCase().endsWith('.m3u8') || url.toLowerCase().endsWith('.mpd')) {
            const mediaData = detectedMedia.get(mediaId);
            if (mediaData) {
                mediaData.size = 'stream';
                console.log('[UMD Background] Streaming URL detected, size will vary');
            }
            return;
        }
        
        // Try HEAD request first
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                headers: {
                    'Accept': '*/*'
                }
            });
            
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                const size = parseInt(contentLength, 10);
                const mediaData = detectedMedia.get(mediaId);
                
                if (mediaData) {
                    mediaData.size = size;
                    console.log('[UMD Background] File size detected via HEAD:', formatFileSize(size));
                    return;
                }
            }
        } catch (headError) {
            console.log('[UMD Background] HEAD request failed, trying GET:', headError.message);
        }
        
        // If HEAD fails, try GET
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': '*/*'
            }
        });
        
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            const size = parseInt(contentLength, 10);
            const mediaData = detectedMedia.get(mediaId);
            
            if (mediaData) {
                mediaData.size = size;
                console.log('[UMD Background] File size detected via GET:', formatFileSize(size));
            }
        }
    } catch (error) {
        console.log('[UMD Background] Could not fetch file size:', error.message);
    }
}

// Format file size to human readable format
function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    if (bytes === 'stream') return 'Streaming';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Clear streams from a specific tab
function clearTabStreams(tabId) {
    console.log('[UMD Background] Clearing streams from tab:', tabId);
    
    let removedCount = 0;
    for (const [mediaId, mediaData] of detectedMedia.entries()) {
        if (mediaData.tabId === tabId) {
            detectedMedia.delete(mediaId);
            removedCount++;
        }
    }
    
    console.log('[UMD Background] Removed', removedCount, 'streams from tab', tabId);
    console.log('[UMD Background] Remaining media:', detectedMedia.size);
    
    // Update badge after clearing
    updateBadge();
    
    return removedCount;
}

// Handle messages from content scripts and popup
function handleMessage(request, sender, sendResponse) {
    console.log('[UMD Background] Message received:', request.type, 'from:', sender.tab ? `tab ${sender.tab.id}` : 'popup');
    
    try {
        switch (request.type) {
            case 'GET_STREAMS':
                const streams = Array.from(detectedMedia.entries());
                console.log('[UMD Background] Sending', streams.length, 'streams to popup');
                console.log('[UMD Background] Current detectedMedia size:', detectedMedia.size);
                sendResponse({ streams: streams });
                break;
            
            case 'MEDIA_FOUND':
                const tabId = sender && sender.tab ? sender.tab.id : null;
                const added = addDetectedMedia(request.url, request.source || 'content', tabId);
                console.log('[UMD Background] Media found response:', added ? 'added' : 'skipped');
                sendResponse({ success: added });
                break;
            
            case 'CLEAR_STREAMS':
                const count = detectedMedia.size;
                detectedMedia.clear();
                console.log('[UMD Background] Cleared', count, 'streams');
                updateBadge();
                sendResponse({ success: true, cleared: count });
                break;
                
            case 'CLEAR_TAB_STREAMS':
                const removedCount = clearTabStreams(request.tabId);
                console.log('[UMD Background] Tab streams cleared, removed:', removedCount);
                sendResponse({ success: true, removedCount: removedCount });
                break;
                
            case 'DOWNLOAD_STREAM':
                console.log('[UMD Background] Download request for:', request.streamId);
                try {
                    downloadMedia(request.streamId, request.options)
                        .then(() => {
                            console.log('[UMD Background] Download process completed');
                            sendResponse({ success: true });
                        })
                        .catch(error => {
                            console.error('[UMD Background] Download process failed:', error);
                            sendResponse({ success: false, error: error.message });
                        });
                } catch (error) {
                    console.error('[UMD Background] Download request failed:', error);
                    sendResponse({ success: false, error: error.message });
                }
                return true; // Keep the message channel open for async response
                break;

            case 'GET_MEDIA_COUNT':
                const currentCount = detectedMedia.size;
                console.log('[UMD Background] Media count requested:', currentCount);
                sendResponse({ count: currentCount });
                break;
                
            default:
                console.log('[UMD Background] Unknown message type:', request.type);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('[UMD Background] Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    // Keep response channel open for async operations
    return true;
}

// Download media file
async function downloadMedia(streamId, options = {}) {
    console.log('[UMD Background] Starting download process for:', streamId);
    
    const media = detectedMedia.get(streamId);
    if (!media) {
        console.error('[UMD Background] Media not found:', streamId);
        throw new Error('Media not found');
    }
    
    try {
        media.status = 'downloading';
        console.log('[UMD Background] Starting download:', media.url);
        
        // Generate filename
        const filename = options.filename || generateFilename(media.url);
        console.log('[UMD Background] Generated filename:', filename);
        
        // Validate URL and get content type before downloading
        try {
            console.log('[UMD Background] Validating URL:', media.url);
            const response = await fetch(media.url, { 
                method: 'HEAD',
                headers: {
                    'Accept': '*/*'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get content type
            const contentType = response.headers.get('content-type');
            console.log('[UMD Background] Content-Type:', contentType);
            
            // Update media type if we got a content type
            if (contentType) {
                if (contentType.includes('video')) {
                    media.type = 'Video';
                } else if (contentType.includes('audio')) {
                    media.type = 'Audio';
                } else if (contentType.includes('application/dash+xml')) {
                    media.type = 'DASH Stream (MPD)';
                } else if (contentType.includes('application/vnd.apple.mpegurl')) {
                    media.type = 'HLS Stream (M3U8)';
                }
            }
            
            console.log('[UMD Background] URL validation successful');
        } catch (error) {
            console.error('[UMD Background] URL validation failed:', error);
            media.status = 'failed';
            media.error = 'URL validation failed: ' + error.message;
            throw error;
        }
        
        // Start download with error handling
        try {
            console.log('[UMD Background] Initiating download with filename:', filename);
            
            // Use fetch to get the complete file
            const response = await fetch(media.url, {
                method: 'GET',
                headers: {
                    'Accept': '*/*'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Get the blob
            const blob = await response.blob();
            console.log('[UMD Background] Downloaded blob size:', formatFileSize(blob.size));
            
            // Create object URL
            const objectUrl = URL.createObjectURL(blob);
            
            // Start download using the object URL
            const downloadId = await browserAPI.downloads.download({
                url: objectUrl,
                filename: filename,
                saveAs: false
            });
            
            console.log('[UMD Background] Download initiated with ID:', downloadId);
            
            // Listen for download completion
            browserAPI.downloads.onChanged.addListener(function downloadListener(delta) {
                if (delta.id === downloadId) {
                    console.log('[UMD Background] Download state changed:', delta);
                    if (delta.state && delta.state.current === 'complete') {
                        media.status = 'completed';
                        console.log('[UMD Background] ✅ Download completed:', filename);
                        // Clean up object URL
                        URL.revokeObjectURL(objectUrl);
                        browserAPI.downloads.onChanged.removeListener(downloadListener);
                    } else if (delta.error) {
                        media.status = 'failed';
                        media.error = delta.error.current;
                        console.error('[UMD Background] ❌ Download failed:', delta.error.current);
                        // Clean up object URL
                        URL.revokeObjectURL(objectUrl);
                        browserAPI.downloads.onChanged.removeListener(downloadListener);
                    }
                }
            });
            
            console.log('[UMD Background] ✅ Download started:', filename);
            
        } catch (downloadError) {
            console.error('[UMD Background] ❌ Download failed:', downloadError);
            media.status = 'failed';
            media.error = downloadError.message;
            throw downloadError;
        }
        
    } catch (error) {
        console.error('[UMD Background] ❌ Download process failed:', error);
        media.status = 'failed';
        media.error = error.message;
        throw error;
    }
}

// Generate filename from URL
function generateFilename(url) {
    try {
        const urlObj = new URL(url);
        let filename = urlObj.pathname.split('/').pop();
        
        // Remove query parameters
        filename = filename.split('?')[0];
        
        // Remove any invalid characters
        filename = filename.replace(/[<>:"/\\|?*]/g, '_');
        
        if (!filename || filename.length < 3) {
            filename = 'media_' + Date.now();
        }
        
        // Ensure it has an extension
        if (!filename.includes('.')) {
            const urlLower = url.toLowerCase();
            if (urlLower.includes('.mp4')) filename += '.mp4';
            else if (urlLower.includes('.webm')) filename += '.webm';
            else if (urlLower.includes('.avi')) filename += '.avi';
            else if (urlLower.includes('.mkv')) filename += '.mkv';
            else if (urlLower.includes('.mov')) filename += '.mov';
            else if (urlLower.includes('.flv')) filename += '.flv';
            else if (urlLower.includes('.mp3')) filename += '.mp3';
            else if (urlLower.includes('.wav')) filename += '.wav';
            else if (urlLower.includes('.flac')) filename += '.flac';
            else if (urlLower.includes('.aac')) filename += '.aac';
            else if (urlLower.includes('.ogg')) filename += '.ogg';
            else if (urlLower.includes('.m4a')) filename += '.m4a';
            else if (urlLower.includes('.m3u8')) filename += '.m3u8';
            else if (urlLower.includes('.mpd')) filename += '.mpd';
            else if (urlLower.includes('.ts')) filename += '.ts';
            else filename += '.mp4'; // default
        }
        
        return filename;
    } catch (e) {
        console.error('[UMD Background] Error generating filename:', e);
        return 'media_' + Date.now() + '.mp4';
    }
}

// Set up webRequest listeners for network monitoring
function setupWebRequestListeners() {
    console.log('[UMD Background] Setting up webRequest listeners...');
    
    try {
        // Monitor all network requests
        browserAPI.webRequest.onBeforeRequest.addListener(
            function(details) {
                const url = details.url;
                
                // Check if it's a media URL
                if (isActualMediaUrl(url)) {
                    console.log('[UMD Background] Network media detected:', url);
                    addDetectedMedia(url, 'network', details.tabId);
                }
            },
            { urls: ["<all_urls>"] },
            ["requestBody"]
        );
        
        console.log('[UMD Background] ✅ webRequest listeners active');
    } catch (error) {
        console.error('[UMD Background] ❌ Failed to set up webRequest listeners:', error);
    }
}

// Initialize background script
function initialize() {
    console.log('[UMD Background] Initializing background script...');
    
    try {
        // Set up message listener
        browserAPI.runtime.onMessage.addListener(handleMessage);
        console.log('[UMD Background] ✅ Message listener active');
        
        // Set up network monitoring
        setupWebRequestListeners();
        
        // Initialize badge
        updateBadge();
        
        console.log('[UMD Background] ✅ Background script initialization complete');
        
    } catch (error) {
        console.error('[UMD Background] ❌ Initialization error:', error);
    }
}

// Start initialization
initialize();

console.log('[UMD Background] Background script loaded and ready'); 