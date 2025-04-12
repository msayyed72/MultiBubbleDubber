/**
 * Handle file uploads with drag and drop functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadButton = document.getElementById('upload-button');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    // Remove highlight when item leaves the drop area
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file input change
    fileInput.addEventListener('change', handleFiles);
    
    // Clicking on the drop area triggers file input
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFiles(e) {
        const files = e.target?.files || e;
        if (files.length) {
            validateAndSetFile(files[0]);
        }
    }
    
    function validateAndSetFile(file) {
        // Check if file is a video
        if (!file.type.startsWith('video/')) {
            alert('Please upload a video file.');
            return;
        }
        
        // Check file size (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            alert('File is too large. Maximum size is 100MB.');
            return;
        }
        
        // Store the file in the application state
        window.appState.uploadedFile = file;
        
        // Update UI
        fileNameDisplay.textContent = file.name;
        uploadButton.disabled = false;
        
        // Create a thumbnail if possible
        createVideoThumbnail(file);
    }
    
    function createVideoThumbnail(file) {
        // Create a video element to load the file and capture a thumbnail
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        
        video.onloadeddata = () => {
            // Update duration information if needed
            const minutes = Math.floor(video.duration / 60);
            const seconds = Math.floor(video.duration % 60);
            const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            fileNameDisplay.innerHTML = `
                <div class="file-preview">
                    <strong>${file.name}</strong>
                    <p>Duration: ${durationText} | Size: ${formatFileSize(file.size)}</p>
                </div>
            `;
            
            // Revoke the blob URL to free up memory
            URL.revokeObjectURL(video.src);
        };
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
});
