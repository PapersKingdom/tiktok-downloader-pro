import { disabledButton } from "./disabledButton.js";
import { getUrl } from "./getUrl.js";
import { showLoading, hideLoading } from "./loading.js";
import { initTheme } from "./theme.js";

// Show app loader
function showAppLoader() {
    const loader = document.createElement('div');
    loader.className = 'app-loader';
    loader.innerHTML = `
        <div class="app-loader-content">
            <div class="app-loader-logo">
                <i class='bx bxl-tiktok'></i>
            </div>
            <div class="app-loader-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            <p>Loading...</p>
        </div>
    `;
    document.body.appendChild(loader);

    // Simulate loading progress
    const progressFill = loader.querySelector('.progress-fill');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('fade-out');
                setTimeout(() => loader.remove(), 500);
            }, 500);
        }
        progressFill.style.width = `${progress}%`;
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    // Show app loader
    showAppLoader();

    // Initialize theme
    initTheme();

    // Initialize elements
    const form = document.getElementById('form');
    const content = document.getElementById('content');
    const resultContainer = document.getElementById('result');
    const submitButton = document.getElementById('submit');
    const pasteButton = document.getElementById('paste-btn');
    const urlInput = document.getElementById('url');
    const historyList = document.getElementById('history-list');
    
    // Initialize button state
    disabledButton();

    // Load history from localStorage
    loadHistory();

    // Handle paste button
    pasteButton.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            urlInput.dispatchEvent(new Event('input'));
            showToast('Link pasted successfully!', 'success');
        } catch (err) {
            showToast('Unable to access clipboard', 'error');
        }
    });

    // Add error handling for input validation
    urlInput.addEventListener('input', () => {
        const url = urlInput.value.trim();
        const inputGroup = urlInput.closest('.input-group');
        
        if (url && !isValidTikTokUrl(url)) {
            inputGroup.classList.add('error');
            urlInput.setCustomValidity('Please enter a valid TikTok URL');
        } else {
            inputGroup.classList.remove('error');
            urlInput.setCustomValidity('');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        
        if (!isValidTikTokUrl(url)) {
            showToast('Please enter a valid TikTok URL', 'error');
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        submitButton.querySelector('.btn-text').style.display = 'none';
        submitButton.querySelector('.loader').style.display = 'block';
        
        // Show loading animation
        showLoading();
        resultContainer.classList.add('hidden');
        
        try {
            const videoData = await getUrl(url);
            
            // Update UI with video preview
            resultContainer.classList.remove('hidden');
            content.classList.add('hidden');
            
            const previewVideo = document.getElementById('preview-video');
            previewVideo.src = videoData.url;
            
            // Add to history
            addToHistory(videoData);
            
            // Setup download buttons
            setupDownloadButtons(videoData);
            
            showToast('Video ready for download!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
            content.innerHTML = `
                <div class="error-container">
                    <i class='bx bx-error-circle'></i>
                    <h3 class="messageError">${error.message}</h3>
                    <button class="btn-submit retry-button" onclick="window.location.reload()">
                        <i class='bx bx-refresh'></i>
                        Try Again
                    </button>
                </div>
            `;
            content.classList.remove('hidden');
        } finally {
            // Reset loading state
            submitButton.disabled = false;
            submitButton.querySelector('.btn-text').style.display = 'block';
            submitButton.querySelector('.loader').style.display = 'none';
        }
        
        form.reset();
    });
});

// Helper functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function setupDownloadButtons(videoData) {
    const downloadNoWm = document.getElementById('download-no-wm');
    const downloadWithWm = document.getElementById('download-with-wm');
    const copyLink = document.getElementById('copy-link');

    async function startDownload(url, button, type) {
        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = `
            <div class="download-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <span class="progress-text">0%</span>
            </div>
        `;
        button.disabled = true;

        try {
            const response = await fetch(url);
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            
            let receivedLength = 0;
            const chunks = [];

            while(true) {
                const {done, value} = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                // Calculate progress
                const progress = (receivedLength / contentLength) * 100;
                const progressFill = button.querySelector('.progress-fill');
                const progressText = button.querySelector('.progress-text');
                
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            }

            // Concatenate chunks into a single Uint8Array
            const chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            for(let chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }

            // Create blob and download
            const blob = new Blob([chunksAll], { type: 'video/mp4' });
            const filename = `tiktok-${type}-${Date.now()}.mp4`;
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showToast('Download completed!', 'success');
            
            // Update history with download info
            updateHistoryDownload(videoData, type);
        } catch (err) {
            console.error('Download error:', err);
            showToast('Download failed. Please try again.', 'error');
        } finally {
            // Reset button state
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    downloadNoWm.onclick = () => startDownload(videoData.downloadUrl, downloadNoWm, 'no-watermark');
    downloadWithWm.onclick = () => startDownload(videoData.originalUrl, downloadWithWm, 'with-watermark');
    
    copyLink.onclick = async () => {
        try {
            await navigator.clipboard.writeText(videoData.downloadUrl);
            showToast('Download link copied!', 'success');
        } catch (err) {
            showToast('Failed to copy link', 'error');
        }
    };
}

function addToHistory(videoData) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const timestamp = new Date().toLocaleString();
    
    historyItem.innerHTML = `
        <div class="history-item-thumbnail">
            <div class="thumbnail-placeholder">
                <i class='bx bxl-tiktok'></i>
            </div>
            <div class="thumbnail-overlay">
                <span class="download-type">${videoData.title ? 'Video' : 'Unknown'}</span>
            </div>
        </div>
        <div class="history-item-info">
            <div class="history-item-header">
                <p class="history-item-title">${videoData.title?.substring(0, 50) || 'TikTok Video'}</p>
                <small class="history-item-author">@${videoData.author}</small>
            </div>
            <div class="history-item-meta">
                <small class="history-item-time">${timestamp}</small>
                <div class="history-item-downloads">
                    <span class="download-count" title="Downloads">0</span>
                    <i class='bx bx-download'></i>
                </div>
            </div>
        </div>
        <div class="history-item-actions">
            <button class="btn-icon" onclick="startDownload('${videoData.downloadUrl}', this, 'no-watermark')" title="Download without watermark">
                <i class='bx bx-download'></i>
            </button>
            <button class="btn-icon" onclick="startDownload('${videoData.originalUrl}', this, 'with-watermark')" title="Download with watermark">
                <i class='bx bxs-download'></i>
            </button>
            <button class="btn-icon copy-btn" data-url="${videoData.downloadUrl}" title="Copy link">
                <i class='bx bx-copy'></i>
            </button>
        </div>
    `;

    // Add click handler for copy buttons
    const copyBtn = historyItem.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(copyBtn.dataset.url);
            showToast('Link copied!', 'success');
        } catch (err) {
            showToast('Failed to copy link', 'error');
        }
    });
    
    const historyList = document.getElementById('history-list');
    
    // Insert at the beginning (latest first)
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // Keep only last 5 items
    while (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
    
    // Save to localStorage
    saveHistory();
}

function updateHistoryDownload(videoData, type) {
    const historyList = document.getElementById('history-list');
    const historyItems = historyList.getElementsByClassName('history-item');
    
    for (const item of historyItems) {
        const downloadUrl = item.querySelector('.btn-icon').getAttribute('onclick').match(/'([^']+)'/)[1];
        if (downloadUrl === videoData.downloadUrl) {
            const downloadCount = item.querySelector('.download-count');
            downloadCount.textContent = parseInt(downloadCount.textContent) + 1;
            saveHistory();
            break;
        }
    }
}

function saveHistory() {
    const historyList = document.getElementById('history-list');
    const historyData = Array.from(historyList.children).map(item => item.outerHTML);
    localStorage.setItem('downloadHistory', JSON.stringify(historyData));
}

function loadHistory() {
    const historyList = document.getElementById('history-list');
    const savedHistory = localStorage.getItem('downloadHistory');
    
    if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        historyList.innerHTML = historyData.join('');
    }
}

// Helper function to validate TikTok URLs
function isValidTikTokUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'www.tiktok.com' || 
               urlObj.hostname === 'vm.tiktok.com' ||
               urlObj.hostname === 'tiktok.com';
    } catch {
        return false;
    }
}


