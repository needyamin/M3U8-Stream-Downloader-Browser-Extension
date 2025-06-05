// Popup script for Universal Media Downloader (Firefox Compatible) - PRODUCTION VERSION

// Firefox compatibility: Use browser API if available, fallback to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log('[UMD Popup] Popup script starting...');

// DOM elements
let streamsList, refreshBtn, clearBtn, loadingIndicator, noStreams;
let isLoading = false;
let loadTimeout = null;

// Initialize popup interface
document.addEventListener('DOMContentLoaded', function() {
    console.log('[UMD Popup] DOM loaded, initializing...');
    
    // Get DOM elements
    streamsList = document.getElementById('streamsList');
    refreshBtn = document.getElementById('refreshBtn');
    clearBtn = document.getElementById('clearBtn');
    loadingIndicator = document.getElementById('loadingIndicator');
    noStreams = document.getElementById('noStreams');
    
    // Set up event listeners
    refreshBtn.addEventListener('click', handleRefresh);
    clearBtn.addEventListener('click', handleClearAll);
    
    // Load streams immediately
    loadStreams();
    
    console.log('[UMD Popup] ✅ Popup initialized');
});

// Enhanced refresh functionality
async function handleRefresh() {
    if (isLoading) {
        console.log('[UMD Popup] Already refreshing, skipping...');
        return;
    }
    
    console.log('[UMD Popup] 🔄 Refresh requested');
    
    isLoading = true;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '🔄 Scanning...';
    
    // Show loading state
    loadingIndicator.style.display = 'flex';
    streamsList.style.display = 'none';
    noStreams.style.display = 'none';
    
    try {
        // Get current active tab
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        if (!currentTab) {
            throw new Error('No active tab found');
        }
        
        // Clear tab-specific streams from background
        await browserAPI.runtime.sendMessage({
            type: 'CLEAR_TAB_STREAMS',
            tabId: currentTab.id
        });
        
        // Request content script to scan for media
        await browserAPI.tabs.sendMessage(currentTab.id, {
            type: 'SCAN_MEDIA'
        });
        
        // Wait a moment for media to be detected
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load updated streams
        await loadStreams();
        
    } catch (error) {
        console.error('[UMD Popup] ❌ Refresh error:', error);
        noStreams.style.display = 'block';
        streamsList.style.display = 'none';
    } finally {
        isLoading = false;
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '🔄 Refresh';
        loadingIndicator.style.display = 'none';
    }
}

// Load and display streams
async function loadStreams() {
    console.log('[UMD Popup] 📊 Loading streams...');
    
    // Clear any existing timeout
    if (loadTimeout) {
        clearTimeout(loadTimeout);
    }
    
    try {
        // Get streams from background script
        const response = await browserAPI.runtime.sendMessage({
            type: 'GET_STREAMS'
        });
        
        if (response && response.streams) {
            const streams = response.streams;
            console.log('[UMD Popup] Received', streams.length, 'streams');
            
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            if (streams.length === 0) {
                noStreams.style.display = 'block';
                streamsList.style.display = 'none';
            } else {
                noStreams.style.display = 'none';
                streamsList.style.display = 'block';
                displayStreams(streams);
            }
            
            // Update stream count
            document.getElementById('streamCount').textContent = streams.length;
            
        } else {
            console.log('[UMD Popup] No streams response or empty response');
            loadingIndicator.style.display = 'none';
            noStreams.style.display = 'block';
            streamsList.style.display = 'none';
            document.getElementById('streamCount').textContent = '0';
        }
        
    } catch (error) {
        console.error('[UMD Popup] ❌ Failed to load streams:', error);
        loadingIndicator.style.display = 'none';
        noStreams.style.display = 'block';
        streamsList.style.display = 'none';
        document.getElementById('streamCount').textContent = '0';
    }
}

// Display streams in the UI
function displayStreams(streams) {
    console.log('[UMD Popup] Displaying', streams.length, 'streams');
    
    if (!streamsList) {
        console.error('[UMD Popup] Streams list element not found');
        return;
    }
    
    // Clear current list
    streamsList.innerHTML = '';
    
    streams.forEach(([streamId, streamData]) => {
        const streamElement = createStreamElement(streamId, streamData);
        streamsList.appendChild(streamElement);
    });
    
    // Update Clear button state
    clearBtn.disabled = streams.length === 0;
}

// Create stream element
function createStreamElement(streamId, streamData) {
    console.log('[UMD Popup] Creating stream element for:', streamId, streamData);
    
    const div = document.createElement('div');
    div.className = 'stream-item';
    
    // Extract filename from URL
    let filename = 'Unknown File';
    try {
        const urlObj = new URL(streamData.url);
        filename = urlObj.pathname.split('/').pop() || 'media_file';
        if (filename.length > 30) {
            filename = filename.substring(0, 27) + '...';
        }
    } catch (e) {
        console.error('[UMD Popup] Error parsing URL:', e);
        filename = 'media_file';
    }
    
    // Format detected time
    const detectedTime = streamData.detected ? 
        new Date(streamData.detected).toLocaleTimeString() : 'Unknown';
    
    // Format file size
    const fileSize = streamData.size ? formatFileSize(streamData.size) : 'Unknown size';
    
    // Status indicator
    let statusIcon = '📄';
    if (streamData.status === 'downloading') statusIcon = '⬇️';
    else if (streamData.status === 'completed') statusIcon = '✅';
    else if (streamData.status === 'failed') statusIcon = '❌';
    
    const buttonHtml = `
        <button class="download-btn" 
                data-stream-id="${streamId}"
                ${streamData.status === 'downloading' ? 'disabled' : ''}>
            ${getDownloadButtonText(streamData.status)}
        </button>
    `;
    
    div.innerHTML = `
        <div class="stream-info">
            <div class="stream-title">${statusIcon} ${streamData.type || 'Media File'}</div>
            <div class="stream-details">
                <div><strong>File:</strong> ${filename}</div>
                <div><strong>Size:</strong> ${fileSize}</div>
                <div><strong>Source:</strong> ${streamData.source || 'unknown'}</div>
                <div><strong>Detected:</strong> ${detectedTime}</div>
            </div>
        </div>
        <div class="stream-actions">
            ${buttonHtml}
        </div>
    `;
    
    // Add click event listener to the button
    const button = div.querySelector('.download-btn');
    if (button) {
        button.addEventListener('click', () => downloadStream(streamId));
    }
    
    return div;
}

// Get download button text based on status
function getDownloadButtonText(status) {
    switch (status) {
        case 'downloading':
            return '⬇️ Downloading...';
        case 'completed':
            return '✅ Downloaded';
        case 'failed':
            return '❌ Failed';
        default:
            return '📥 Download';
    }
}

// Format file size
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

// Download specific stream
async function downloadStream(streamId) {
    console.log('[UMD Popup] Download requested for:', streamId);
    
    try {
        // Disable the button immediately
        const button = document.querySelector(`button[data-stream-id="${streamId}"]`);
        if (button) {
            console.log('[UMD Popup] Disabling download button');
            button.disabled = true;
            button.innerHTML = '⬇️ Downloading...';
        } else {
            console.error('[UMD Popup] Could not find download button');
        }
        
        console.log('[UMD Popup] Sending download message to background script');
        const response = await browserAPI.runtime.sendMessage({
            type: 'DOWNLOAD_STREAM',
            streamId: streamId
        });
        
        console.log('[UMD Popup] Received response from background:', response);
        
        if (response && response.success) {
            console.log('[UMD Popup] ✅ Download started');
            // The button will be updated when we refresh the streams
            setTimeout(() => {
                console.log('[UMD Popup] Refreshing streams list');
                loadStreams();
            }, 1000);
        } else {
            throw new Error(response?.error || 'Download failed');
        }
    } catch (error) {
        console.error('[UMD Popup] ❌ Download error:', error);
        // Reset the button state
        const button = document.querySelector(`button[data-stream-id="${streamId}"]`);
        if (button) {
            console.log('[UMD Popup] Resetting button state after error');
            button.disabled = false;
            button.innerHTML = '📥 Download';
        }
    }
}

// Clear all detected streams
async function handleClearAll() {
    console.log('[UMD Popup] Clear all requested');
    
    try {
        const response = await browserAPI.runtime.sendMessage({
            type: 'CLEAR_STREAMS'
        });
        
        if (response && response.success) {
            console.log('[UMD Popup] ✅ Cleared', response.cleared, 'streams');
            loadStreams();
        } else {
            throw new Error('Failed to clear streams');
        }
    } catch (error) {
        console.error('[UMD Popup] ❌ Clear error:', error);
    }
}

// Make download function globally available
window.downloadStream = downloadStream;

// Auto-refresh when popup is opened (but not too frequently)
setTimeout(() => {
    if (!isLoading) {
        console.log('[UMD Popup] Auto-refresh on popup open');
        loadStreams();
    }
}, 500);

console.log('[UMD Popup] ✅ Popup script loaded and ready'); 