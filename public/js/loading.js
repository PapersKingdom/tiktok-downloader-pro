export function showLoading() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="loading-container">
            <div class="loading-animation">
                <div class="tiktok-logo">
                    <i class='bx bxl-tiktok'></i>
                </div>
                <div class="loading-bar">
                    <div class="progress"></div>
                </div>
                <p class="loading-text">Fetching video...</p>
            </div>
        </div>
    `;
}

export function hideLoading() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="instructions">
            <h3>How to Download</h3>
            <ol>
                <li>Copy the link of any TikTok video</li>
                <li>Paste the link in the input box above</li>
                <li>Click the <b>Download</b> button</li>
                <li>Choose your preferred download option</li>
            </ol>
        </div>
    `;
} 