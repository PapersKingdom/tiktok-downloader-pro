export const getUrl = async (url) => {
    try {
        const response = await fetch('/url', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoUrl: url })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || (!data.nowm && !data.wm)) {
            throw new Error('Invalid response data');
        }

        // Return data in the format expected by our UI
        return {
            url: data.nowm, // URL for preview
            downloadUrl: data.nowm, // URL for no watermark download
            originalUrl: data.wm, // URL with watermark
            audioUrl: data.music, // Audio URL
            title: data.title || 'TikTok Video',
            thumbnail: data.thumbnail || null,
            author: data.author || 'Unknown Creator'
        };
    } catch (error) {
        console.error('Error fetching video:', error);
        throw new Error(
            error.message === 'Failed to fetch' 
                ? 'Network error. Please check your connection.' 
                : 'Error processing video. Please try a different link.'
        );
    }
}