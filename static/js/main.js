/**
 * Main application script
 */

// Global state of the application
const appState = {
    currentStage: 'upload',
    uploadedFile: null,
    selectedLanguage: 'en',
    selectedLanguageName: 'English',
    processingJob: null,
    statusCheckInterval: null
};

// DOM elements
const elements = {
    // Stage containers
    uploadStage: document.getElementById('upload-stage'),
    processingStage: document.getElementById('processing-stage'),
    resultsStage: document.getElementById('results-stage'),
    
    // Upload elements
    dropArea: document.getElementById('drop-area'),
    fileInput: document.getElementById('file-input'),
    fileName: document.getElementById('file-name'),
    uploadButton: document.getElementById('upload-button'),
    
    // Language selector
    languageSelect: document.getElementById('language-select'),
    selectedLanguageName: document.getElementById('selected-language-name'),
    languageInfoText: document.getElementById('language-info-text'),
    
    // Processing elements
    stageTranscribing: document.getElementById('stage-transcribing'),
    stageTranslating: document.getElementById('stage-translating'),
    stageGenerating: document.getElementById('stage-generating'),
    stageMerging: document.getElementById('stage-merging'),
    progressBar: document.getElementById('progress-bar'),
    processingStatusMessage: document.getElementById('processing-status-message'),
    cancelButton: document.getElementById('cancel-button'),
    
    // Results elements
    resultsMessage: document.getElementById('results-message'),
    resultVideo: document.getElementById('result-video'),
    originalFilename: document.getElementById('original-filename'),
    videoDuration: document.getElementById('video-duration'),
    targetLanguage: document.getElementById('target-language'),
    downloadButton: document.getElementById('download-button'),
    newDubButton: document.getElementById('new-dub-button')
};

/**
 * Initialize the application
 */
function initApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the UI
    showStage('upload');
}

/**
 * Set up event listeners for the application
 */
function setupEventListeners() {
    // Upload stage listeners
    elements.languageSelect.addEventListener('change', handleLanguageChange);
    elements.uploadButton.addEventListener('click', startUpload);
    
    // Processing stage listeners
    elements.cancelButton.addEventListener('click', cancelProcessing);
    
    // Results stage listeners
    elements.newDubButton.addEventListener('click', () => showStage('upload'));
    
    // Result video loaded
    elements.resultVideo.addEventListener('loadedmetadata', updateVideoDuration);
    
    // Add more listeners as needed
}

/**
 * Switch between application stages
 * @param {string} stageName - Name of the stage to show
 */
function showStage(stageName) {
    // Hide all stages
    document.querySelectorAll('.app-stage').forEach(stage => {
        stage.classList.remove('active');
    });
    
    // Show the selected stage
    const stageElement = document.getElementById(`${stageName}-stage`);
    if (stageElement) {
        stageElement.classList.add('active');
        appState.currentStage = stageName;
    }
    
    // Perform stage-specific initializations
    if (stageName === 'upload') {
        resetUploadForm();
    } else if (stageName === 'processing') {
        resetProcessingStages();
    }
    
    // Update 3D scene based on stage
    if (window.updateSceneForStage) {
        window.updateSceneForStage(stageName);
    }
}

/**
 * Reset the upload form to its initial state
 */
function resetUploadForm() {
    appState.uploadedFile = null;
    elements.fileName.textContent = '';
    elements.uploadButton.disabled = true;
    elements.fileInput.value = '';
    
    // Reset to default language if needed
    if (appState.selectedLanguage !== 'en') {
        elements.languageSelect.value = 'en';
        handleLanguageChange();
    }
}

/**
 * Handle language selection change
 */
function handleLanguageChange() {
    const select = elements.languageSelect;
    appState.selectedLanguage = select.value;
    appState.selectedLanguageName = select.options[select.selectedIndex].text;
    
    // Update UI
    elements.selectedLanguageName.textContent = appState.selectedLanguageName;
    
    // Update language info text based on selection
    const languageInfoMap = {
        'en': 'English is the default target language.',
        'es': 'Spanish is one of the most widely spoken languages in the world.',
        'fr': 'French is known for its elegant pronunciation and is spoken in many countries.',
        'de': 'German is known for its precision and is widely used in business.',
        'it': 'Italian is a musical language with expressive gestures.',
        'ja': 'Japanese uses three writing systems and has unique sentence structure.',
        'ko': 'Korean has a unique alphabet called Hangul that is scientifically designed.',
        'pt': 'Portuguese is spoken in Portugal, Brazil, and parts of Africa.',
        'ru': 'Russian uses the Cyrillic alphabet and has complex grammar.',
        'zh-CN': 'Chinese (Simplified) is the most spoken language in the world.'
    };
    
    elements.languageInfoText.textContent = languageInfoMap[appState.selectedLanguage] || 
                                          `${appState.selectedLanguageName} is available for video dubbing.`;
}

/**
 * Update video duration display
 */
function updateVideoDuration() {
    const video = elements.resultVideo;
    const minutes = Math.floor(video.duration / 60);
    const seconds = Math.floor(video.duration % 60);
    elements.videoDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Reset processing stages to initial state
 */
function resetProcessingStages() {
    const stages = [
        elements.stageTranscribing,
        elements.stageTranslating,
        elements.stageGenerating,
        elements.stageMerging
    ];
    
    stages.forEach(stage => {
        stage.classList.remove('active', 'completed', 'failed');
    });
    
    elements.progressBar.style.width = '0%';
    elements.progressBar.setAttribute('aria-valuenow', '0');
    elements.processingStatusMessage.textContent = 'Starting processing...';
}

/**
 * Start the video upload and processing
 */
function startUpload() {
    if (!appState.uploadedFile) {
        alert('Please select a video file first.');
        return;
    }
    
    const formData = new FormData();
    formData.append('video', appState.uploadedFile);
    formData.append('language', appState.selectedLanguage);
    
    // Show the processing stage
    showStage('processing');
    
    // Send the upload request
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        return response.json();
    })
    .then(data => {
        appState.processingJob = data.job_id;
        
        // Start checking status
        startStatusCheck();
    })
    .catch(error => {
        console.error('Error:', error);
        elements.processingStatusMessage.textContent = `Error: ${error.message}`;
        updateProcessingStage('failed', 'Failed to start processing');
    });
}

/**
 * Start checking the processing status periodically
 */
function startStatusCheck() {
    if (appState.statusCheckInterval) {
        clearInterval(appState.statusCheckInterval);
    }
    
    appState.statusCheckInterval = setInterval(() => {
        if (!appState.processingJob) return;
        
        fetch(`/status/${appState.processingJob}`)
            .then(response => response.json())
            .then(data => {
                updateProcessingUI(data);
                
                // Stop checking if processing is complete or failed
                if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
                    clearInterval(appState.statusCheckInterval);
                    
                    if (data.status === 'completed') {
                        showResults(data);
                    }
                }
            })
            .catch(error => {
                console.error('Error checking status:', error);
                elements.processingStatusMessage.textContent = `Error checking status: ${error.message}`;
            });
    }, 2000); // Check every 2 seconds
}

/**
 * Update the processing UI based on status
 * @param {Object} data - Processing status data
 */
function updateProcessingUI(data) {
    // Update progress bar
    elements.progressBar.style.width = `${data.progress}%`;
    elements.progressBar.setAttribute('aria-valuenow', data.progress);
    
    // Update status message
    elements.processingStatusMessage.textContent = data.message;
    
    // Update processing stages
    if (data.progress < 30) {
        updateProcessingStage('transcribing', data.status);
    } else if (data.progress < 50) {
        updateProcessingStage('translating', data.status);
    } else if (data.progress < 70) {
        updateProcessingStage('generating', data.status);
    } else {
        updateProcessingStage('merging', data.status);
    }
}

/**
 * Update the processing stage UI
 * @param {string} stageName - Name of the current processing stage
 * @param {string} status - Status of the processing
 */
function updateProcessingStage(stageName, status) {
    const stages = {
        'transcribing': elements.stageTranscribing,
        'translating': elements.stageTranslating,
        'generating': elements.stageGenerating,
        'merging': elements.stageMerging
    };
    
    // Reset all stages
    Object.values(stages).forEach(stage => {
        stage.classList.remove('active');
    });
    
    // Mark current and previous stages
    const stageOrder = ['transcribing', 'translating', 'generating', 'merging'];
    const currentIndex = stageOrder.indexOf(stageName);
    
    for (let i = 0; i <= currentIndex; i++) {
        const stageName = stageOrder[i];
        const stage = stages[stageName];
        
        if (i < currentIndex) {
            // Previous stage
            stage.classList.add('completed');
            // Replace spinner with check icon
            const statusElement = stage.querySelector('.stage-status');
            statusElement.innerHTML = '<i class="fas fa-check-circle fa-lg"></i>';
        } else {
            // Current stage
            stage.classList.add('active');
        }
    }
    
    // Handle failed status
    if (status === 'failed' || status === 'cancelled') {
        stages[stageName].classList.add('failed');
        const statusElement = stages[stageName].querySelector('.stage-status');
        statusElement.innerHTML = '<i class="fas fa-times-circle fa-lg text-danger"></i>';
    }
}

/**
 * Cancel the current processing job
 */
function cancelProcessing() {
    if (!appState.processingJob) return;
    
    fetch(`/cancel/${appState.processingJob}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(appState.statusCheckInterval);
        elements.processingStatusMessage.textContent = 'Processing cancelled.';
        updateProcessingStage('transcribing', 'cancelled');
        
        // Return to upload stage after a short delay
        setTimeout(() => {
            showStage('upload');
        }, 2000);
    })
    .catch(error => {
        console.error('Error cancelling job:', error);
    });
}

/**
 * Show the results when processing is complete
 * @param {Object} data - Processing result data
 */
function showResults(data) {
    // Update UI elements with result data
    elements.originalFilename.textContent = data.original_filename;
    elements.targetLanguage.textContent = appState.selectedLanguageName;
    
    // Set video source
    elements.resultVideo.src = `/download/${appState.processingJob}`;
    
    // Set download link
    elements.downloadButton.href = `/download/${appState.processingJob}`;
    
    // Show results stage
    showStage('results');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
