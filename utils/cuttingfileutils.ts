// utils/download.ts
export const downloadFile = async (url: string, filename: string) => {
  try {
    // First try direct download
    const directLink = document.createElement('a');
    directLink.href = url;
    directLink.download = filename;
    directLink.style.display = 'none';
    document.body.appendChild(directLink);
    directLink.click();
    document.body.removeChild(directLink);
    
    // If direct download doesn't work, try fetch approach
    setTimeout(async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth if needed
          }
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const fetchLink = document.createElement('a');
        fetchLink.href = blobUrl;
        fetchLink.download = filename;
        fetchLink.style.display = 'none';
        document.body.appendChild(fetchLink);
        fetchLink.click();
        document.body.removeChild(fetchLink);
        window.URL.revokeObjectURL(blobUrl);
      } catch (fetchError) {
        console.error('Fetch download failed:', fetchError);
        // Fallback: open in new tab
        window.open(url, '_blank');
      }
    }, 1000);
    
  } catch (error) {
    console.error('Download failed:', error);
    // Final fallback
    window.open(url, '_blank');
  }
};