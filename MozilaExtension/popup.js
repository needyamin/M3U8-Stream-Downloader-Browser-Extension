// Popup script for Universal Media Downloader (Firefox Compatible)

// Firefox compatibility: Use browser API if available, fallback to chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

class M3U8PopupManager {
  constructor() {
    this.streams = new Map();
    this.refreshInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStreams();
    // DISABLED: No more auto-refresh or user tracking
    // this.startAutoRefresh();
    // this.trackUserInteraction();
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadStreams();
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearAllStreams();
    });

    // DISABLED: Message listener that may cause constant updates
    // browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //   if (request.type === 'STREAM_DETECTED') {
    //     this.loadStreams();
    //   }
    // });
  }

  async loadStreams() {
    try {
      const response = await browserAPI.runtime.sendMessage({ type: 'GET_STREAMS' });
      if (response && response.streams) {
        this.displayStreams(response.streams);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
      this.showError('Failed to load streams. Please try refreshing.');
    }
  }

  displayStreams(streamsData) {
    const streamCount = document.getElementById('streamCount');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noStreams = document.getElementById('noStreams');
    const streamsList = document.getElementById('streamsList');

    // Only update stream count if it actually changed
    const newCount = streamsData.length;
    if (streamCount.textContent !== newCount.toString()) {
      streamCount.textContent = newCount;
    }

    // Hide loading indicator
    if (loadingIndicator.style.display !== 'none') {
      loadingIndicator.style.display = 'none';
    }

    if (streamsData.length === 0) {
      if (noStreams.style.display !== 'block') {
        noStreams.style.display = 'block';
      }
      if (streamsList.style.display !== 'none') {
        streamsList.style.display = 'none';
      }
      return;
    }

    if (noStreams.style.display !== 'none') {
      noStreams.style.display = 'none';
    }
    if (streamsList.style.display !== 'block') {
      streamsList.style.display = 'block';
    }

    // Check if streams have actually changed before rebuilding
    const currentStreamIds = Array.from(this.streams.keys()).sort();
    const newStreamIds = streamsData.map(([id]) => id).sort();
    const hasChanges = JSON.stringify(currentStreamIds) !== JSON.stringify(newStreamIds);

    // Only rebuild if there are actual changes
    if (!hasChanges && streamsList.children.length > 0) {
      return; // No changes, don't rebuild UI
    }

    // Clear existing streams only if needed
    if (streamsList.children.length > 0) {
      streamsList.innerHTML = '';
    }

    // Add each stream
    streamsData.forEach(([streamId, streamData]) => {
      const streamElement = this.createStreamElement(streamId, streamData);
      streamsList.appendChild(streamElement);
      this.streams.set(streamId, streamData);
    });
  }

  createStreamElement(streamId, streamData) {
    const streamItem = document.createElement('div');
    streamItem.className = 'stream-item';
    streamItem.innerHTML = `
      <div class="stream-header">
        <div class="stream-url" title="${streamData.url}">
          ${this.truncateUrl(streamData.url)}
        </div>
        <div class="stream-status status-${streamData.status}">
          ${this.getStatusText(streamData.status)}
        </div>
      </div>
      
      <div class="stream-info">
        <span><strong>Type:</strong> ${streamData.type || 'Media File'}</span>
        <span><strong>Size:</strong> ${streamData.fileSize || 'Unknown'}</span>
      </div>
      
      <div class="stream-actions">
        <input type="text" class="filename-input" placeholder="Enter filename (optional)" 
               value="${this.generateFilename(streamData.url)}">
        <button class="btn btn-primary download-btn" data-stream-id="${streamId}">
          📥 Download
        </button>
      </div>
      
      <div class="stream-details">
        <span>Detected: ${this.formatDate(streamData.detected)}</span>
        <span>Tab ID: ${streamData.tabId}</span>
      </div>
      
      ${streamData.status === 'downloading' ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      ` : ''}
      
      ${streamData.error ? `
        <div class="error-message" style="color: #c62828; font-size: 12px; margin-top: 8px;">
          Error: ${streamData.error}
        </div>
      ` : ''}
    `;

    // Add download button event listener
    const downloadBtn = streamItem.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => {
      this.downloadStream(streamId, streamItem);
    });

    return streamItem;
  }

  async downloadStream(streamId, streamElement) {
    const filenameInput = streamElement.querySelector('.filename-input');
    const downloadBtn = streamElement.querySelector('.download-btn');
    const filename = filenameInput.value.trim() || 'stream';

    try {
      // Update UI
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '⏳ Starting...';
      
      // Get concurrent downloads setting
      const concurrentDownloads = document.getElementById('concurrentDownloads').value;

      // Send download request
      const response = await browserAPI.runtime.sendMessage({
        type: 'DOWNLOAD_STREAM',
        streamId: streamId,
        options: {
          filename: filename,
          concurrentDownloads: parseInt(concurrentDownloads)
        }
      });

      if (response && response.success) {
        downloadBtn.innerHTML = '📥 Downloading...';
        downloadBtn.className = 'btn btn-success';
        
        // Add progress bar if not present
        if (!streamElement.querySelector('.progress-bar')) {
          const progressBar = document.createElement('div');
          progressBar.className = 'progress-bar';
          progressBar.innerHTML = '<div class="progress-fill" style="width: 0%"></div>';
          streamElement.appendChild(progressBar);
        }
        
        this.showNotification('Download started!', 'success');
      } else {
        throw new Error('Failed to start download');
      }
    } catch (error) {
      console.error('Download failed:', error);
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '❌ Failed';
      downloadBtn.className = 'btn btn-danger';
      this.showNotification('Download failed: ' + error.message, 'error');
    }
  }

  async clearAllStreams() {
    try {
      await browserAPI.runtime.sendMessage({ type: 'CLEAR_STREAMS' });
      this.streams.clear();
      this.loadStreams();
      this.showNotification('All streams cleared', 'info');
    } catch (error) {
      console.error('Failed to clear streams:', error);
      this.showNotification('Failed to clear streams', 'error');
    }
  }

  truncateUrl(url) {
    if (!url) return 'Unknown URL';
    if (url.length <= 40) return url;
    
    // Consistent truncation to prevent layout shifts
    const start = url.substring(0, 20);
    const end = url.substring(url.length - 15);
    return start + '...' + end;
  }

  getStatusText(status) {
    const statusMap = {
      'detected': 'Detected',
      'downloading': 'Downloading',
      'completed': 'Completed',
      'failed': 'Failed'
    };
    return statusMap[status] || status;
  }

  generateFilename(url) {
    try {
      if (!url) return 'media';
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      let filename = pathname.split('/').pop();
      
      if (!filename || filename.length < 2) {
        filename = 'media';
      }
      
      // Remove extension for input field
      filename = filename.replace(/\.[^/.]+$/, '');
      
      // Limit filename length to prevent layout issues
      if (filename.length > 20) {
        filename = filename.substring(0, 20);
      }
      
      return filename || 'media';
    } catch (e) {
      return 'media';
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  }

  showNotification(message, type = 'info') {
    // Simplified static notification to prevent layout shifts
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create a simple non-animated notification
    const existing = document.querySelector('.static-notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'static-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      z-index: 10000;
      max-width: 180px;
      word-wrap: break-word;
      pointer-events: none;
    `;
    
    // Set background color based on type
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Remove after delay without any animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }

  showError(message) {
    const content = document.querySelector('.content');
    content.innerHTML = `
      <div class="error-state" style="text-align: center; padding: 40px 20px; color: #dc3545;">
        <h3>❌ Error</h3>
        <p style="margin: 12px 0; line-height: 1.5;">${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          🔄 Retry
        </button>
      </div>
    `;
  }

  startAutoRefresh() {
    // DISABLED: Auto-refresh causing shaking - only manual refresh now
    // this.refreshInterval = setInterval(() => {
    //   const timeSinceInteraction = Date.now() - this.lastUserInteraction;
    //   if (document.visibilityState === 'visible' && timeSinceInteraction > 3000) {
    //     this.loadStreams();
    //   }
    // }, 10000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // REMOVED: trackUserInteraction method - no longer needed
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new M3U8PopupManager();
});

// Cleanup when popup is closed
window.addEventListener('beforeunload', () => {
  if (window.popupManager) {
    window.popupManager.stopAutoRefresh();
  }
}); 