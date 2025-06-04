// Popup script for M3U8 Stream Downloader
class M3U8PopupManager {
  constructor() {
    this.streams = new Map();
    this.refreshInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadStreams();
    this.startAutoRefresh();
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

    // Listen for background script messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'STREAM_DETECTED') {
        this.loadStreams();
      }
    });
  }

  async loadStreams() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STREAMS' });
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

    // Update stream count
    streamCount.textContent = streamsData.length;

    // Hide loading indicator
    loadingIndicator.style.display = 'none';

    if (streamsData.length === 0) {
      noStreams.style.display = 'block';
      streamsList.style.display = 'none';
      return;
    }

    noStreams.style.display = 'none';
    streamsList.style.display = 'block';

    // Clear existing streams
    streamsList.innerHTML = '';

    // Add each stream
    streamsData.forEach(([streamId, streamData]) => {
      const streamElement = this.createStreamElement(streamId, streamData);
      streamsList.appendChild(streamElement);
      this.streams.set(streamId, streamData);
    });
  }

  createStreamElement(streamId, streamData) {
    const streamItem = document.createElement('div');
    streamItem.className = 'stream-item new';
    streamItem.innerHTML = `
      <div class="stream-header">
        <div class="stream-url" title="${streamData.url}">
          ${this.truncateUrl(streamData.url)}
        </div>
        <div class="stream-status status-${streamData.status}">
          ${this.getStatusText(streamData.status)}
        </div>
      </div>
      
      <div class="stream-actions">
        <input type="text" class="filename-input" placeholder="Enter filename (optional)" 
               value="${this.generateFilename(streamData.url)}">
        <button class="btn btn-primary download-btn" data-stream-id="${streamId}">
          📥 Download
        </button>
      </div>
      
      <div class="stream-info">
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
      const response = await chrome.runtime.sendMessage({
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
      await chrome.runtime.sendMessage({ type: 'CLEAR_STREAMS' });
      this.streams.clear();
      this.loadStreams();
      this.showNotification('All streams cleared', 'info');
    } catch (error) {
      console.error('Failed to clear streams:', error);
      this.showNotification('Failed to clear streams', 'error');
    }
  }

  truncateUrl(url) {
    if (url.length <= 50) return url;
    return url.substring(0, 25) + '...' + url.substring(url.length - 25);
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
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop().replace('.m3u8', '');
      return filename || 'stream';
    } catch (e) {
      return 'stream';
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
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
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
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
    // Refresh every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.loadStreams();
    }, 5000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
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